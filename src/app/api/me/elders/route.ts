import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessStatus, Role } from "@prisma/client";

export async function GET() {
  try {
    const authUser = await requireAuth();

    // If caller is an ELDER themself, return their own profile
    if (authUser.role === Role.ELDER) {
      const elder = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { elderProfile: true },
      });
      return successResponse([
        {
          id: elder!.id,
          name: elder!.name,
          email: elder!.email,
          phone: elder!.phone,
          language: elder!.language,
          role: elder!.role,
          elderProfile: elder!.elderProfile,
          relation: "SELF",
        },
      ]);
    }

    // For linked DOCTOR, CARETAKER, or FAMILY members
    const links = await prisma.elderAccess.findMany({
      where: {
        memberId: authUser.id,
        status: AccessStatus.ACTIVE,
      },
      include: {
        elder: {
          include: {
            elderProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const results = links.map((link) => {
      const elder = link.elder;

      // FAMILY role: strictly minimal fields (basic name and id only)
      if (link.role === Role.FAMILY) {
        return {
          id: elder.id,
          name: elder.name,
          relation: link.role,
          linkedAt: link.createdAt,
        };
      }

      // DOCTOR and CARETAKER: full read-level clinical and contact profile
      return {
        id: elder.id,
        name: elder.name,
        email: elder.email,
        phone: elder.phone,
        language: elder.language,
        elderProfile: elder.elderProfile,
        relation: link.role,
        linkedAt: link.createdAt,
      };
    });

    return successResponse(results);
  } catch (err) {
    return handleApiError(err);
  }
}
