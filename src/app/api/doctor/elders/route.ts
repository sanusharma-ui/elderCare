import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { requireAuth, sanitizeUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DoctorCreateElderSchema,
  generateInternalAuthEmail,
  PaginationQuerySchema,
} from "@/lib/validators";
import { AccessStatus, AppointmentStatus, MedicineStatus, Prisma, Role } from "@prisma/client";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const doctor = await requireAuth([Role.DOCTOR]);
    const rawBody = await req.json();
    const data = DoctorCreateElderSchema.parse(rawBody);

    const hasRealEmail = Boolean(data.email);
    const authEmail = hasRealEmail
      ? data.email!
      : generateInternalAuthEmail(data.phone!);

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
          { authEmail },
        ],
      },
    });

    if (existing) {
      throw AppError.conflict("An account with this email or phone already exists");
    }

    // Generate strong temporary password: e.g. "Smriti!9aF24b8C"
    const randomHex = crypto.randomBytes(4).toString("hex");
    const temporaryPassword = `Smriti!${randomHex}9A`;

    // 1. Create confirmed Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          name: data.name,
          createdByDoctorId: doctor.id,
        },
      });

    if (authError || !authData.user) {
      throw AppError.badRequest(
        authError?.message || "Failed to create elder authentication credentials"
      );
    }

    const elderUserId = authData.user.id;

    // 2. Create public records atomically
    let createdElder;
    try {
      createdElder = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: elderUserId,
            name: data.name,
            email: data.email ?? null,
            authEmail,
            hasRealEmail,
            phone: data.phone ?? null,
            role: Role.ELDER,
            language: data.language,
            isActive: true,
            mustChangePassword: true, // Requires password change on first login
          },
        });

        const profile = await tx.elderProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender ?? null,
            bloodGroup: data.bloodGroup ?? null,
            medicalConditions: data.medicalConditions ?? null,
            allergies: data.allergies ?? null,
            emergencyContactName: data.emergencyContactName ?? null,
            emergencyContactPhone: data.emergencyContactPhone ?? null,
            timezone: data.timezone ?? "Asia/Kolkata",
            largeTextMode: data.largeTextMode ?? true,
            voiceReminders: data.voiceReminders ?? false,
            createdByDoctorId: doctor.id,
          },
        });

        // Auto-link creating doctor with DOCTOR role
        const access = await tx.elderAccess.create({
          data: {
            elderId: user.id,
            memberId: doctor.id,
            role: Role.DOCTOR,
            status: AccessStatus.ACTIVE,
          },
        });

        await createAuditLog({
          actorId: doctor.id,
          elderId: user.id,
          action: "ELDER_CREATED_BY_DOCTOR",
          entity: "User",
          entityId: user.id,
          after: { user, profile, access },
          tx,
        });

        return {
          ...user,
          elderProfile: profile,
        };
      });
    } catch (dbError) {
      // Compensating action
      await supabaseAdmin.auth.admin.deleteUser(elderUserId).catch((err) => {
        console.error("Compensating rollback failed for elder:", elderUserId, err);
      });
      throw dbError;
    }

    return successResponse(
      {
        elder: sanitizeUser(createdElder),
        temporaryPassword,
        message:
          "Elder account created successfully. Provide the temporary password to the elder. They will be prompted to change it upon first login.",
      },
      undefined,
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const doctor = await requireAuth([Role.DOCTOR]);
    const { searchParams } = new URL(req.url);

    const query = PaginationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 10,
      search: searchParams.get("search") ?? undefined,
    });

    const whereClause: Prisma.ElderAccessWhereInput = {
      memberId: doctor.id,
      status: AccessStatus.ACTIVE,
      ...(query.search
        ? {
            elder: {
              OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    };

    const total = await prisma.elderAccess.count({ where: whereClause });

    const links = await prisma.elderAccess.findMany({
      where: whereClause,
      include: {
        elder: {
          include: {
            elderProfile: true,
            elderMedicines: {
              where: { status: MedicineStatus.ACTIVE },
              select: { id: true },
            },
            elderAppointments: {
              where: {
                scheduledAt: { gte: new Date() },
                status: AppointmentStatus.SCHEDULED,
              },
              orderBy: { scheduledAt: "asc" },
              take: 1,
              select: { scheduledAt: true, title: true, id: true },
            },
          },
        },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
    });

    const patients = links.map((link) => {
      const elder = link.elder;
      const nextAppointment = elder.elderAppointments[0] ?? null;

      return {
        id: elder.id,
        name: elder.name,
        email: elder.email,
        phone: elder.phone,
        language: elder.language,
        elderProfile: elder.elderProfile,
        activeMedicineCount: elder.elderMedicines.length,
        nextAppointmentAt: nextAppointment ? nextAppointment.scheduledAt : null,
        nextAppointment: nextAppointment,
        linkedAt: link.createdAt,
      };
    });

    return successResponse(patients, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
