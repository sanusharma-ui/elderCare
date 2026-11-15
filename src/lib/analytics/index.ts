import { DEFAULT_TIMEZONE } from "@/lib/time";
import { DoseStatus, NoteSeverity, TimeSlot } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";
import { prisma } from "../prisma";

export interface DaySeriesItem {
  date: string;
  adherencePercentage: number | null;
  taken: number;
  given: number;
  missed: number;
  skipped: number;
  total: number;
}

export interface MedicineAdherenceItem {
  medicineId: string;
  medicineName: string;
  nameLocal: string | null;
  adherencePercentage: number | null;
  taken: number;
  given: number;
  missed: number;
  total: number;
}

export interface ElderAdherenceResult {
  elderId: string;
  days: number;
  overallPercentage: number | null;
  totalClosedDoses: number;
  takenCount: number;
  givenCount: number;
  missedCount: number;
  skippedCount: number;
  currentMissStreak: number;
  lastTakenAt: string | null;
  perSlotMisses: Record<TimeSlot, number>;
  perMedicine: MedicineAdherenceItem[];
  perDaySeries: DaySeriesItem[];
}

/**
 * Pure SQL/Prisma Adherence Analytics for a single elder.
 * Adherence % = (TAKEN + GIVEN) / (TAKEN + GIVEN + MISSED) * 100
 */
export async function calculateElderAdherence(
  elderId: string,
  days: number = 7
): Promise<ElderAdherenceResult> {
  const elder = await prisma.user.findUnique({
    where: { id: elderId },
    include: { elderProfile: true },
  });

  const timezone = elder?.elderProfile?.timezone || DEFAULT_TIMEZONE;
  const now = new Date();
  const startDate = subDays(now, days);

  // Fetch all closed/relevant dose logs in the time window
  const doseLogs = await prisma.doseLog.findMany({
    where: {
      elderId,
      scheduledFor: {
        gte: startDate,
        lte: now,
      },
    },
    include: {
      medicine: {
        select: {
          id: true,
          name: true,
          nameLocal: true,
        },
      },
      schedule: {
        select: {
          slot: true,
        },
      },
    },
    orderBy: { scheduledFor: "desc" },
  });

  let takenCount = 0;
  let givenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;
  let lastTakenAtDate: Date | null = null;

  const perSlotMisses: Record<TimeSlot, number> = {
    [TimeSlot.MORNING]: 0,
    [TimeSlot.AFTERNOON]: 0,
    [TimeSlot.EVENING]: 0,
    [TimeSlot.NIGHT]: 0,
  };

  const medicineMap = new Map<
    string,
    {
      name: string;
      nameLocal: string | null;
      taken: number;
      given: number;
      missed: number;
    }
  >();

  const dayMap = new Map<
    string,
    {
      taken: number;
      given: number;
      missed: number;
      skipped: number;
    }
  >();

  // Initialize day map in chronological order
  for (let i = days - 1; i >= 0; i--) {
    const dayDate = subDays(now, i);
    const dayStr = formatInTimeZone(dayDate, timezone, "yyyy-MM-dd");
    dayMap.set(dayStr, { taken: 0, given: 0, missed: 0, skipped: 0 });
  }

  // Calculate current miss streak (from most recent backward)
  let currentMissStreak = 0;
  let streakBroken = false;

  for (const log of doseLogs) {
    if (log.status === DoseStatus.PENDING) continue;

    if (!streakBroken) {
      if (log.status === DoseStatus.MISSED) {
        currentMissStreak++;
      } else if (log.status === DoseStatus.TAKEN || log.status === DoseStatus.GIVEN) {
        streakBroken = true;
      }
    }

    if (log.status === DoseStatus.TAKEN || log.status === DoseStatus.GIVEN) {
      if (!lastTakenAtDate && log.markedAt) {
        lastTakenAtDate = log.markedAt;
      }
    }

    // Counts
    if (log.status === DoseStatus.TAKEN) takenCount++;
    else if (log.status === DoseStatus.GIVEN) givenCount++;
    else if (log.status === DoseStatus.MISSED) {
      missedCount++;
      if (log.schedule?.slot) {
        perSlotMisses[log.schedule.slot]++;
      }
    } else if (log.status === DoseStatus.SKIPPED) {
      skippedCount++;
    }

    // Per-medicine tracking
    if (!medicineMap.has(log.medicineId)) {
      medicineMap.set(log.medicineId, {
        name: log.medicine.name,
        nameLocal: log.medicine.nameLocal,
        taken: 0,
        given: 0,
        missed: 0,
      });
    }
    const medStats = medicineMap.get(log.medicineId)!;
    if (log.status === DoseStatus.TAKEN) medStats.taken++;
    else if (log.status === DoseStatus.GIVEN) medStats.given++;
    else if (log.status === DoseStatus.MISSED) medStats.missed++;

    // Per-day tracking
    const logDateStr = formatInTimeZone(log.scheduledFor, timezone, "yyyy-MM-dd");
    const dayStats = dayMap.get(logDateStr);
    if (dayStats) {
      if (log.status === DoseStatus.TAKEN) dayStats.taken++;
      else if (log.status === DoseStatus.GIVEN) dayStats.given++;
      else if (log.status === DoseStatus.MISSED) dayStats.missed++;
      else if (log.status === DoseStatus.SKIPPED) dayStats.skipped++;
    }
  }

  const totalClosedDoses = takenCount + givenCount + missedCount;
  const overallPercentage =
    totalClosedDoses > 0
      ? Math.round(((takenCount + givenCount) / totalClosedDoses) * 1000) / 10
      : null;

  const perMedicine: MedicineAdherenceItem[] = Array.from(medicineMap.entries()).map(
    ([id, stats]) => {
      const closed = stats.taken + stats.given + stats.missed;
      return {
        medicineId: id,
        medicineName: stats.name,
        nameLocal: stats.nameLocal,
        taken: stats.taken,
        given: stats.given,
        missed: stats.missed,
        total: closed,
        adherencePercentage:
          closed > 0 ? Math.round(((stats.taken + stats.given) / closed) * 1000) / 10 : null,
      };
    }
  );

  const perDaySeries: DaySeriesItem[] = Array.from(dayMap.entries()).map(
    ([date, stats]) => {
      const closed = stats.taken + stats.given + stats.missed;
      return {
        date,
        taken: stats.taken,
        given: stats.given,
        missed: stats.missed,
        skipped: stats.skipped,
        total: closed,
        adherencePercentage:
          closed > 0 ? Math.round(((stats.taken + stats.given) / closed) * 1000) / 10 : null,
      };
    }
  );

  return {
    elderId,
    days,
    overallPercentage,
    totalClosedDoses,
    takenCount,
    givenCount,
    missedCount,
    skippedCount,
    currentMissStreak,
    lastTakenAt: lastTakenAtDate ? lastTakenAtDate.toISOString() : null,
    perSlotMisses,
    perMedicine,
    perDaySeries,
  };
}

export interface PatientAttentionItem {
  elderId: string;
  name: string;
  language: string;
  adherencePercentage: number | null;
  riskScore: number;
  missedDoses7d: number;
  currentMissStreak: number;
  unseenNotesCount: number;
  lowStockCount: number;
  reasons: string[];
}

export interface DoctorDashboardResult {
  totalPatients: number;
  onTrack: number;
  needsAttention: number;
  critical: number;
  unseenNotesCount: number;
  dosesMissedToday: number;
  attentionList: PatientAttentionItem[];
}

/**
 * Doctor Dashboard aggregation.
 * Optimized for 200+ patients without N+1 queries.
 */
export async function calculateDoctorDashboardMetrics(
  doctorId: string
): Promise<DoctorDashboardResult> {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const todayStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  // 1. Fetch all actively linked elders
  const links = await prisma.elderAccess.findMany({
    where: {
      memberId: doctorId,
      status: "ACTIVE",
    },
    include: {
      elder: {
        select: {
          id: true,
          name: true,
          language: true,
          elderProfile: {
            select: { timezone: true },
          },
        },
      },
    },
  });

  const totalPatients = links.length;
  if (totalPatients === 0) {
    return {
      totalPatients: 0,
      onTrack: 0,
      needsAttention: 0,
      critical: 0,
      unseenNotesCount: 0,
      dosesMissedToday: 0,
      attentionList: [],
    };
  }

  const elderIds = links.map((l) => l.elder.id);

  // 2. Batch fetch DoseLogs in past 7 days
  const doseLogs7d = await prisma.doseLog.findMany({
    where: {
      elderId: { in: elderIds },
      scheduledFor: {
        gte: sevenDaysAgo,
        lte: now,
      },
      status: { in: [DoseStatus.TAKEN, DoseStatus.GIVEN, DoseStatus.MISSED] },
    },
    select: {
      elderId: true,
      status: true,
      scheduledFor: true,
    },
    orderBy: { scheduledFor: "desc" },
  });

  // 3. Batch count doses missed today
  const dosesMissedToday = await prisma.doseLog.count({
    where: {
      elderId: { in: elderIds },
      scheduledFor: { gte: todayStartUtc },
      status: DoseStatus.MISSED,
    },
  });

  // 4. Batch fetch unseen caretaker notes
  const unseenNotes = await prisma.caretakerNote.findMany({
    where: {
      elderId: { in: elderIds },
      doctorSeenAt: null,
    },
    select: {
      elderId: true,
      severity: true,
    },
  });

  // 5. Batch fetch low stock medicines
  const lowStockMeds = await prisma.medicine.findMany({
    where: {
      elderId: { in: elderIds },
      status: "ACTIVE",
      stockCount: { not: null },
      refillThreshold: { not: null },
    },
    select: {
      elderId: true,
      stockCount: true,
      refillThreshold: true,
    },
  });

  // Group maps
  const elderDoseLogsMap = new Map<string, typeof doseLogs7d>();
  for (const log of doseLogs7d) {
    if (!elderDoseLogsMap.has(log.elderId)) {
      elderDoseLogsMap.set(log.elderId, []);
    }
    elderDoseLogsMap.get(log.elderId)!.push(log);
  }

  const elderUnseenNotesMap = new Map<string, typeof unseenNotes>();
  for (const note of unseenNotes) {
    if (!elderUnseenNotesMap.has(note.elderId)) {
      elderUnseenNotesMap.set(note.elderId, []);
    }
    elderUnseenNotesMap.get(note.elderId)!.push(note);
  }

  const elderLowStockMap = new Map<string, number>();
  for (const med of lowStockMeds) {
    if (med.stockCount !== null && med.refillThreshold !== null && med.stockCount <= med.refillThreshold) {
      elderLowStockMap.set(med.elderId, (elderLowStockMap.get(med.elderId) || 0) + 1);
    }
  }

  let onTrack = 0;
  let needsAttention = 0;
  let critical = 0;
  const attentionList: PatientAttentionItem[] = [];

  for (const link of links) {
    const elder = link.elder;
    const logs = elderDoseLogsMap.get(elder.id) || [];
    const notes = elderUnseenNotesMap.get(elder.id) || [];
    const lowStockCount = elderLowStockMap.get(elder.id) || 0;

    let taken = 0;
    let missed = 0;
    let missStreak = 0;
    let streakBroken = false;

    for (const log of logs) {
      if (!streakBroken) {
        if (log.status === DoseStatus.MISSED) {
          missStreak++;
        } else if (log.status === DoseStatus.TAKEN || log.status === DoseStatus.GIVEN) {
          streakBroken = true;
        }
      }
      if (log.status === DoseStatus.TAKEN || log.status === DoseStatus.GIVEN) {
        taken++;
      } else if (log.status === DoseStatus.MISSED) {
        missed++;
      }
    }

    const closed = taken + missed;
    const adherence = closed > 0 ? Math.round((taken / closed) * 1000) / 10 : null;

    let urgentNotesCount = 0;
    let warningNotesCount = 0;
    for (const n of notes) {
      if (n.severity === NoteSeverity.URGENT) urgentNotesCount++;
      else if (n.severity === NoteSeverity.WARNING) warningNotesCount++;
    }

    // Deterministic Risk Score Calculation
    let riskScore = 0;
    const reasons: string[] = [];

    riskScore += missed * 10;
    riskScore += missStreak * 15;
    riskScore += urgentNotesCount * 25;
    riskScore += warningNotesCount * 10;
    riskScore += lowStockCount * 8;

    if (adherence !== null && adherence < 60) {
      riskScore += 30;
      reasons.push("LOW_ADHERENCE");
    } else if (adherence !== null && adherence < 85) {
      riskScore += 15;
      reasons.push("MODERATE_ADHERENCE");
    }

    if (missStreak >= 2) {
      reasons.push("MISS_STREAK");
    }
    if (urgentNotesCount > 0) {
      reasons.push("URGENT_NOTE");
    }
    if (warningNotesCount > 0) {
      reasons.push("WARNING_NOTE");
    }
    if (lowStockCount > 0) {
      reasons.push("LOW_STOCK");
    }

    // Tiers
    if (adherence === null || (adherence >= 85 && missStreak < 3)) {
      onTrack++;
    } else if (adherence < 60 || missStreak >= 3) {
      critical++;
    } else {
      needsAttention++;
    }

    attentionList.push({
      elderId: elder.id,
      name: elder.name,
      language: elder.language,
      adherencePercentage: adherence,
      riskScore,
      missedDoses7d: missed,
      currentMissStreak: missStreak,
      unseenNotesCount: notes.length,
      lowStockCount,
      reasons,
    });
  }

  // Sort attention list descending by riskScore
  attentionList.sort((a, b) => b.riskScore - a.riskScore);

  return {
    totalPatients,
    onTrack,
    needsAttention,
    critical,
    unseenNotesCount: unseenNotes.length,
    dosesMissedToday,
    attentionList,
  };
}
