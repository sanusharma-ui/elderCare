import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TIMEZONE,
  getDayOfWeekInTimezone,
  getTodayDateString,
  parseLocalScheduleToUtc,
} from "@/lib/time";
import { DoseStatus, MedicineStatus, TimeSlot } from "@prisma/client";
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

    // Readable by ELDER self, linked DOCTOR, linked CARETAKER; FAMILY forbidden
    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to daily medication schedules");
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

    const timezone = elder.elderProfile?.timezone || DEFAULT_TIMEZONE;
    const now = new Date();
    const todayDateString = getTodayDateString(timezone);
    const dayOfWeek = getDayOfWeekInTimezone(now, timezone);

    // Fetch active medicines with their active schedules
    const medicines = await prisma.medicine.findMany({
      where: {
        elderId,
        status: MedicineStatus.ACTIVE,
      },
      include: {
        schedules: {
          where: { isActive: true },
        },
      },
    });

    // Filter schedules applicable for today
    const scheduleItems: Array<{
      scheduleId: string;
      medicineId: string;
      medicineName: string;
      nameLocal: string | null;
      genericName: string | null;
      dosage: string;
      form: string;
      foodRelation: string;
      instructions: string | null;
      warnings: string | null;
      timeOfDay: string;
      slot: TimeSlot;
      doseQuantity: string;
      graceMinutes: number;
      scheduledFor: Date;
    }> = [];

    const todayStartUtc = parseLocalScheduleToUtc(todayDateString, "00:00", timezone);
    const todayEndUtc = parseLocalScheduleToUtc(todayDateString, "23:59", timezone);

    for (const med of medicines) {
      // Check date bounds
      if (med.startDate > todayEndUtc) continue;
      if (med.endDate && med.endDate < todayStartUtc) continue;

      for (const schedule of med.schedules) {
        if (!schedule.daysOfWeek.includes(dayOfWeek)) continue;

        const scheduledFor = parseLocalScheduleToUtc(
          todayDateString,
          schedule.timeOfDay,
          timezone
        );

        scheduleItems.push({
          scheduleId: schedule.id,
          medicineId: med.id,
          medicineName: med.name,
          nameLocal: med.nameLocal,
          genericName: med.genericName,
          dosage: med.dosage,
          form: med.form,
          foodRelation: med.foodRelation,
          instructions: med.instructions,
          warnings: med.warnings,
          timeOfDay: schedule.timeOfDay,
          slot: schedule.slot,
          doseQuantity: schedule.doseQuantity,
          graceMinutes: schedule.graceMinutes,
          scheduledFor,
        });
      }
    }

    // Fetch existing DoseLog entries for today for these schedules
    const scheduleIds = scheduleItems.map((s) => s.scheduleId);
    const existingLogs = await prisma.doseLog.findMany({
      where: {
        elderId,
        scheduleId: { in: scheduleIds },
        scheduledFor: {
          gte: todayStartUtc,
          lte: todayEndUtc,
        },
      },
    });

    // Map logs by `${scheduleId}_${scheduledFor.toISOString()}`
    const logMap = new Map<string, (typeof existingLogs)[0]>();
    for (const log of existingLogs) {
      logMap.set(`${log.scheduleId}_${log.scheduledFor.toISOString()}`, log);
    }

    // Construct enriched dose entries
    const doses = scheduleItems.map((item) => {
      const key = `${item.scheduleId}_${item.scheduledFor.toISOString()}`;
      const log = logMap.get(key);

      const isMarkableRole = access === "SELF" || access === "CARETAKER";
      const windowStart = new Date(item.scheduledFor.getTime() - 60 * 60 * 1000);
      const windowEnd = new Date(item.scheduledFor.getTime() + 12 * 60 * 60 * 1000);
      const inWindow = now >= windowStart && now <= windowEnd;
      const canMark = isMarkableRole && inWindow;

      return {
        scheduleId: item.scheduleId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        nameLocal: item.nameLocal,
        genericName: item.genericName,
        dosage: item.dosage,
        form: item.form,
        foodRelation: item.foodRelation,
        instructions: item.instructions,
        warnings: item.warnings,
        timeOfDay: item.timeOfDay,
        slot: item.slot,
        doseQuantity: item.doseQuantity,
        graceMinutes: item.graceMinutes,
        scheduledFor: item.scheduledFor.toISOString(),
        doseLogId: log ? log.id : null,
        status: log ? log.status : DoseStatus.PENDING,
        markedAt: log?.markedAt ? log.markedAt.toISOString() : null,
        markedByRole: log?.markedByRole ?? null,
        note: log?.note ?? null,
        canMark,
      };
    });

    // Group into slots
    const groupedSlots: Record<TimeSlot, typeof doses> = {
      [TimeSlot.MORNING]: [],
      [TimeSlot.AFTERNOON]: [],
      [TimeSlot.EVENING]: [],
      [TimeSlot.NIGHT]: [],
    };

    for (const dose of doses) {
      groupedSlots[dose.slot].push(dose);
    }

    // Sort doses within each slot by timeOfDay
    Object.keys(groupedSlots).forEach((slotKey) => {
      groupedSlots[slotKey as TimeSlot].sort((a, b) =>
        a.timeOfDay.localeCompare(b.timeOfDay)
      );
    });

    const summary = {
      total: doses.length,
      pending: doses.filter((d) => d.status === DoseStatus.PENDING).length,
      taken: doses.filter((d) => d.status === DoseStatus.TAKEN).length,
      given: doses.filter((d) => d.status === DoseStatus.GIVEN).length,
      missed: doses.filter((d) => d.status === DoseStatus.MISSED).length,
      skipped: doses.filter((d) => d.status === DoseStatus.SKIPPED).length,
    };

    return successResponse({
      date: todayDateString,
      dayOfWeek,
      timezone,
      elder: {
        id: elder.id,
        name: elder.name,
      },
      summary,
      slots: groupedSlots,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
