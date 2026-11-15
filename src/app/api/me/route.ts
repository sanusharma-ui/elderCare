import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requireAuth, sanitizeUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UpdateMeSchema } from "@/lib/validators";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const authUser = await requireAuth();

    const userWithProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        doctorProfile: true,
        elderProfile: true,
      },
    });

    if (!userWithProfile) {
      throw AppError.notFound("User not found");
    }

    return successResponse(sanitizeUser(userWithProfile));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    const rawBody = await req.json();
    const data = UpdateMeSchema.parse(rawBody);

    // If updating phone, ensure not in use by another user
    if (data.phone && data.phone !== authUser.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: authUser.id },
        },
      });
      if (existingPhone) {
        throw AppError.conflict("Phone number is already associated with another account");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic user details
      const user = await tx.user.update({
        where: { id: authUser.id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.language ? { language: data.language } : {}),
        },
      });

      // 2. Update role-specific profile
      if (authUser.role === Role.DOCTOR && (data.specialization || data.registrationNumber || data.clinicName)) {
        await tx.doctorProfile.upsert({
          where: { userId: authUser.id },
          update: {
            ...(data.specialization ? { specialization: data.specialization } : {}),
            ...(data.registrationNumber ? { registrationNumber: data.registrationNumber } : {}),
            ...(data.clinicName ? { clinicName: data.clinicName } : {}),
          },
          create: {
            userId: authUser.id,
            specialization: data.specialization || "General Medicine",
            registrationNumber: data.registrationNumber || "PENDING",
            clinicName: data.clinicName || "Clinic",
          },
        });
      } else if (authUser.role === Role.ELDER) {
        await tx.elderProfile.upsert({
          where: { userId: authUser.id },
          update: {
            ...(data.dateOfBirth ? { dateOfBirth: new Date(data.dateOfBirth) } : {}),
            ...(data.gender !== undefined ? { gender: data.gender } : {}),
            ...(data.bloodGroup !== undefined ? { bloodGroup: data.bloodGroup } : {}),
            ...(data.medicalConditions !== undefined ? { medicalConditions: data.medicalConditions } : {}),
            ...(data.allergies !== undefined ? { allergies: data.allergies } : {}),
            ...(data.emergencyContactName !== undefined ? { emergencyContactName: data.emergencyContactName } : {}),
            ...(data.emergencyContactPhone !== undefined ? { emergencyContactPhone: data.emergencyContactPhone } : {}),
            ...(data.timezone ? { timezone: data.timezone } : {}),
            ...(data.largeTextMode !== undefined ? { largeTextMode: data.largeTextMode } : {}),
            ...(data.voiceReminders !== undefined ? { voiceReminders: data.voiceReminders } : {}),
          },
          create: {
            userId: authUser.id,
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
          },
        });
      }

      return user;
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: updated.id },
      include: {
        doctorProfile: true,
        elderProfile: true,
      },
    });

    return successResponse(sanitizeUser(fullUser!));
  } catch (err) {
    return handleApiError(err);
  }
}
