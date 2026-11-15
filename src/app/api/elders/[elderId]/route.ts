import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth, sanitizeUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UpdateElderSchema } from "@/lib/validators";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ elderId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId } = await params;

    const access = await getElderAccess(authUser.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    const elder = await prisma.user.findUnique({
      where: { id: elderId },
      include: {
        elderProfile: true,
      },
    });

    if (!elder) {
      throw AppError.notFound("Elder not found");
    }

    // FAMILY role: strictly minimal fields (basic name only)
    if (access === "FAMILY") {
      return successResponse({
        id: elder.id,
        name: elder.name,
        accessRole: access,
      });
    }

    // SELF, DOCTOR, CARETAKER: full clinical & personal profile
    return successResponse({
      ...sanitizeUser(elder),
      accessRole: access,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ elderId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId } = await params;

    const access = await getElderAccess(authUser.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    // Only the elder self OR their linked DOCTOR can edit profile
    if (access !== "SELF" && access !== "DOCTOR") {
      throw AppError.forbidden("Only the elder or their linked doctor can update profile details");
    }

    const rawBody = await req.json();
    const data = UpdateElderSchema.parse(rawBody);

    const existingElder = await prisma.user.findUnique({
      where: { id: elderId },
      include: { elderProfile: true },
    });

    if (!existingElder) {
      throw AppError.notFound("Elder not found");
    }

    // Check phone uniqueness if changed
    if (data.phone && data.phone !== existingElder.phone) {
      const duplicatePhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: elderId },
        },
      });
      if (duplicatePhone) {
        throw AppError.conflict("Phone number is already associated with another account");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: elderId },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.language ? { language: data.language } : {}),
        },
      });

      const profile = await tx.elderProfile.upsert({
        where: { userId: elderId },
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
          userId: elderId,
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

      const updatedCombined = { ...user, elderProfile: profile };

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "ELDER_PROFILE_UPDATED",
        entity: "ElderProfile",
        entityId: profile.id,
        before: existingElder,
        after: updatedCombined,
        tx,
      });

      return updatedCombined;
    });

    return successResponse(sanitizeUser(updated));
  } catch (err) {
    return handleApiError(err);
  }
}
