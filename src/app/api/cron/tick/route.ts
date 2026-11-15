import { processEmailOutbox } from "@/lib/email";
import { formatMedicineNameForLanguage, SupportedLanguage, TIME_SLOT_LABELS } from "@/lib/i18n/messages";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, parseLocalScheduleToUtc } from "@/lib/time";
import { AccessStatus, AppointmentStatus, DoseStatus, MedicineStatus, NotificationType, Role } from "@prisma/client";
import crypto from "crypto";
import { formatInTimeZone } from "date-fns-tz";
import { subHours, addHours, subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (token.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

async function handleCronTick(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  // Dev Time Travel support (?now=<ISO>) when NODE_ENV !== "production"
  const simulatedNowStr = req.nextUrl.searchParams.get("now");
  let now = new Date();
  if (process.env.NODE_ENV !== "production" && simulatedNowStr) {
    const parsed = new Date(simulatedNowStr);
    if (!isNaN(parsed.getTime())) {
      now = parsed;
    }
  }

  const report = {
    simulatedNow: now.toISOString(),
    materialized: 0,
    staleCleaned: 0,
    dueNotified: 0,
    nudgeNotified: 0,
    missedEscalated: 0,
    patternAlerts: 0,
    appointmentReminders: 0,
    refillAlerts: 0,
    emailsProcessed: 0,
  };

  // ---------------------------------------------------------------------------
  // a. MATERIALIZE: PENDING doses between now-6h and now+6h
  // ---------------------------------------------------------------------------
  try {
    const windowStart = subHours(now, 6);
    const windowEnd = addHours(now, 6);

    const activeMedicines = await prisma.medicine.findMany({
      where: {
        status: MedicineStatus.ACTIVE,
        startDate: { lte: windowEnd },
        OR: [{ endDate: null }, { endDate: { gte: windowStart } }],
      },
      include: {
        elder: {
          include: { elderProfile: { select: { timezone: true } } },
        },
        schedules: {
          where: { isActive: true },
        },
      },
    });

    const dosesToCreate: Array<{
      scheduleId: string;
      medicineId: string;
      elderId: string;
      scheduledFor: Date;
      status: DoseStatus;
    }> = [];

    for (const med of activeMedicines) {
      const tz = med.elder.elderProfile?.timezone || DEFAULT_TIMEZONE;

      // Check dates in the window
      for (let dayOffset = -1; dayOffset <= 1; dayOffset++) {
        const checkDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        const dateStr = formatInTimeZone(checkDate, tz, "yyyy-MM-dd");
        const dayOfWeek = parseInt(formatInTimeZone(checkDate, tz, "i"), 10) % 7; // 0..6

        for (const schedule of med.schedules) {
          if (!schedule.daysOfWeek.includes(dayOfWeek)) continue;

          const scheduledFor = parseLocalScheduleToUtc(dateStr, schedule.timeOfDay, tz);
          if (scheduledFor >= windowStart && scheduledFor <= windowEnd) {
            dosesToCreate.push({
              scheduleId: schedule.id,
              medicineId: med.id,
              elderId: med.elderId,
              scheduledFor,
              status: DoseStatus.PENDING,
            });
          }
        }
      }
    }

    if (dosesToCreate.length > 0) {
      const res = await prisma.doseLog.createMany({
        data: dosesToCreate,
        skipDuplicates: true,
      });
      report.materialized = res.count;
    }
  } catch (err) {
    console.error("[CRON_TICK] Materialization error:", err);
  }

  // ---------------------------------------------------------------------------
  // b. STALE CLEANUP: PENDING doses older than 6 hours silently become MISSED
  // ---------------------------------------------------------------------------
  try {
    const staleThreshold = subHours(now, 6);
    const res = await prisma.doseLog.updateMany({
      where: {
        status: DoseStatus.PENDING,
        scheduledFor: { lt: staleThreshold },
      },
      data: {
        status: DoseStatus.MISSED,
        escalationLevel: 3,
        note: "System recovery: marked missed silently after extended pending state.",
      },
    });
    report.staleCleaned = res.count;
  } catch (err) {
    console.error("[CRON_TICK] Stale cleanup error:", err);
  }

  // ---------------------------------------------------------------------------
  // c. DUE REMINDER (Level 0 -> 1): now >= scheduledFor, notify Elder & Caretaker
  // Group multiple doses due at same minute for same elder into one notification
  // ---------------------------------------------------------------------------
  try {
    const dueDoses = await prisma.doseLog.findMany({
      where: {
        status: DoseStatus.PENDING,
        escalationLevel: 0,
        scheduledFor: { lte: now },
      },
      include: {
        elder: {
          include: {
            elderProfile: { select: { timezone: true } },
            elderAccessAsElder: {
              where: { status: AccessStatus.ACTIVE, role: Role.CARETAKER },
              select: { memberId: true },
            },
          },
        },
        medicine: true,
        schedule: true,
      },
    });

    // Group by elderId + scheduledFor ISO
    const dueGroupMap = new Map<string, typeof dueDoses>();
    for (const dose of dueDoses) {
      const key = `${dose.elderId}_${dose.scheduledFor.toISOString()}`;
      if (!dueGroupMap.has(key)) dueGroupMap.set(key, []);
      dueGroupMap.get(key)!.push(dose);
    }

    for (const group of dueGroupMap.values()) {
      const firstDose = group[0];
      const elder = firstDose.elder;
      const tz = elder.elderProfile?.timezone || DEFAULT_TIMEZONE;
      const slot = firstDose.schedule.slot;
      const scheduledForIso = firstDose.scheduledFor.toISOString();

      // Atomic conditional update to prevent double notification
      const doseIds = group.map((d) => d.id);
      const claimed = await prisma.doseLog.updateMany({
        where: {
          id: { in: doseIds },
          escalationLevel: 0,
        },
        data: { escalationLevel: 1 },
      });

      if (claimed.count === 0) continue;

      const medNames = group
        .map((d) => formatMedicineNameForLanguage(d.medicine.name, d.medicine.nameLocal, elder.language as SupportedLanguage))
        .join(", ");
      const doseQuantities = group.map((d) => d.schedule.doseQuantity).join(", ");
      const timeStr = formatInTimeZone(firstDose.scheduledFor, tz, "hh:mm a");

      // Notify Elder
      await createNotification({
        userId: elder.id,
        elderId: elder.id,
        type: NotificationType.UPCOMING_DOSE,
        templateKey: "dose_due",
        params: {
          elderName: elder.name,
          medicines: medNames,
          doseQuantity: doseQuantities,
          slot: TIME_SLOT_LABELS[elder.language as SupportedLanguage]?.[slot] || slot,
          time: timeStr,
        },
        dedupeKey: `due:${elder.id}:${scheduledForIso}:${elder.id}`,
        email: false, // Elder gets in-app
      });
      report.dueNotified++;

      // Notify Caretakers (in-app + email)
      for (const link of elder.elderAccessAsElder) {
        await createNotification({
          userId: link.memberId,
          elderId: elder.id,
          type: NotificationType.UPCOMING_DOSE,
          templateKey: "dose_due",
          params: {
            elderName: elder.name,
            medicines: medNames,
            doseQuantity: doseQuantities,
            slot: slot,
            time: timeStr,
          },
          dedupeKey: `due:${elder.id}:${scheduledForIso}:${link.memberId}`,
          email: true,
        });
        report.dueNotified++;
      }
    }
  } catch (err) {
    console.error("[CRON_TICK] Due reminder error:", err);
  }

  // ---------------------------------------------------------------------------
  // d. NUDGE (Level 1 -> 2): now >= scheduledFor + (grace/2), still PENDING
  // ---------------------------------------------------------------------------
  try {
    const candidateDoses = await prisma.doseLog.findMany({
      where: {
        status: DoseStatus.PENDING,
        escalationLevel: 1,
      },
      include: {
        elder: {
          include: {
            elderProfile: { select: { timezone: true } },
            elderAccessAsElder: {
              where: { status: AccessStatus.ACTIVE, role: Role.CARETAKER },
              select: { memberId: true },
            },
          },
        },
        medicine: true,
        schedule: true,
      },
    });

    const nudgeGroupMap = new Map<string, typeof candidateDoses>();
    for (const dose of candidateDoses) {
      const halfGraceMs = (dose.schedule.graceMinutes / 2) * 60 * 1000;
      if (now.getTime() >= dose.scheduledFor.getTime() + halfGraceMs) {
        const key = `${dose.elderId}_${dose.scheduledFor.toISOString()}`;
        if (!nudgeGroupMap.has(key)) nudgeGroupMap.set(key, []);
        nudgeGroupMap.get(key)!.push(dose);
      }
    }

    for (const group of nudgeGroupMap.values()) {
      const firstDose = group[0];
      const elder = firstDose.elder;
      const tz = elder.elderProfile?.timezone || DEFAULT_TIMEZONE;
      const slot = firstDose.schedule.slot;
      const scheduledForIso = firstDose.scheduledFor.toISOString();

      const doseIds = group.map((d) => d.id);
      const claimed = await prisma.doseLog.updateMany({
        where: {
          id: { in: doseIds },
          escalationLevel: 1,
        },
        data: { escalationLevel: 2 },
      });

      if (claimed.count === 0) continue;

      const medNames = group.map((d) => d.medicine.name).join(", ");
      const timeStr = formatInTimeZone(firstDose.scheduledFor, tz, "hh:mm a");

      // Nudge Caretakers
      for (const link of elder.elderAccessAsElder) {
        await createNotification({
          userId: link.memberId,
          elderId: elder.id,
          type: NotificationType.UPCOMING_DOSE,
          templateKey: "dose_nudge",
          params: {
            elderName: elder.name,
            medicines: medNames,
            slot: slot,
            time: timeStr,
          },
          dedupeKey: `nudge:${elder.id}:${scheduledForIso}:${link.memberId}`,
          email: true,
        });
        report.nudgeNotified++;
      }
    }
  } catch (err) {
    console.error("[CRON_TICK] Nudge error:", err);
  }

  // ---------------------------------------------------------------------------
  // e. MISSED (Level 2 -> 3): now >= scheduledFor + graceMinutes, still PENDING
  // Notify Family (email+app), Caretakers (email+app), Doctors (app only)
  // ---------------------------------------------------------------------------
  try {
    const pendingDoses = await prisma.doseLog.findMany({
      where: {
        status: DoseStatus.PENDING,
        escalationLevel: { in: [0, 1, 2] },
      },
      include: {
        elder: {
          include: {
            elderProfile: { select: { timezone: true } },
            elderAccessAsElder: {
              where: { status: AccessStatus.ACTIVE },
              select: { memberId: true, role: true },
            },
          },
        },
        medicine: true,
        schedule: true,
      },
    });

    const missedGroupMap = new Map<string, typeof pendingDoses>();
    for (const dose of pendingDoses) {
      const graceMs = dose.schedule.graceMinutes * 60 * 1000;
      if (now.getTime() >= dose.scheduledFor.getTime() + graceMs) {
        const key = `${dose.elderId}_${dose.scheduledFor.toISOString()}`;
        if (!missedGroupMap.has(key)) missedGroupMap.set(key, []);
        missedGroupMap.get(key)!.push(dose);
      }
    }

    for (const group of missedGroupMap.values()) {
      const firstDose = group[0];
      const elder = firstDose.elder;
      const tz = elder.elderProfile?.timezone || DEFAULT_TIMEZONE;
      const slot = firstDose.schedule.slot;
      const scheduledForIso = firstDose.scheduledFor.toISOString();

      const doseIds = group.map((d) => d.id);
      const claimed = await prisma.doseLog.updateMany({
        where: {
          id: { in: doseIds },
          status: DoseStatus.PENDING,
        },
        data: {
          status: DoseStatus.MISSED,
          escalationLevel: 3,
          notifiedFamilyAt: now,
        },
      });

      if (claimed.count === 0) continue;

      const medNames = group.map((d) => d.medicine.name).join(", ");
      const timeStr = formatInTimeZone(firstDose.scheduledFor, tz, "hh:mm a");

      for (const link of elder.elderAccessAsElder) {
        const isFamily = link.role === Role.FAMILY;
        const isCaretaker = link.role === Role.CARETAKER;
        const isDoctor = link.role === Role.DOCTOR;

        await createNotification({
          userId: link.memberId,
          elderId: elder.id,
          type: NotificationType.MISSED_DOSE,
          templateKey: "dose_missed",
          params: {
            elderName: elder.name,
            medicines: medNames,
            slot: slot,
            time: timeStr,
          },
          dedupeKey: `missed:${elder.id}:${scheduledForIso}:${link.memberId}`,
          email: isFamily || isCaretaker, // Family & Caretakers get email; Doctor gets in-app flag
        });
        report.missedEscalated++;
      }
    }
  } catch (err) {
    console.error("[CRON_TICK] Missed escalation error:", err);
  }

  // ---------------------------------------------------------------------------
  // f. PATTERN ALERT: >= 3 missed doses in past 24h
  // ---------------------------------------------------------------------------
  try {
    const past24h = subDays(now, 1);
    const dateStr = formatInTimeZone(now, DEFAULT_TIMEZONE, "yyyy-MM-dd");

    const recentMisses = await prisma.doseLog.groupBy({
      by: ["elderId"],
      where: {
        status: DoseStatus.MISSED,
        scheduledFor: { gte: past24h },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 3 } },
      },
    });

    for (const item of recentMisses) {
      const elder = await prisma.user.findUnique({
        where: { id: item.elderId },
        select: {
          id: true,
          name: true,
          elderAccessAsElder: {
            where: { role: Role.DOCTOR, status: AccessStatus.ACTIVE },
            select: { memberId: true },
          },
        },
      });

      if (!elder) continue;

      for (const doc of elder.elderAccessAsElder) {
        await createNotification({
          userId: doc.memberId,
          elderId: elder.id,
          type: NotificationType.MISSED_DOSE,
          templateKey: "pattern_alert",
          params: {
            elderName: elder.name,
            missCount: item._count.id,
          },
          dedupeKey: `pattern:${elder.id}:${dateStr}:${doc.memberId}`,
          email: true, // Doctor alerted via in-app and email
        });
        report.patternAlerts++;
      }
    }
  } catch (err) {
    console.error("[CRON_TICK] Pattern alert error:", err);
  }

  // ---------------------------------------------------------------------------
  // g. APPOINTMENT REMINDERS (24h and 2h)
  // ---------------------------------------------------------------------------
  try {
    const scheduledAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: { gte: now },
      },
      include: {
        elder: {
          include: {
            elderProfile: { select: { timezone: true } },
            elderAccessAsElder: {
              where: { status: AccessStatus.ACTIVE, role: Role.CARETAKER },
              select: { memberId: true },
            },
          },
        },
        doctor: { select: { name: true } },
      },
    });

    for (const app of scheduledAppointments) {
      const msUntil = app.scheduledAt.getTime() - now.getTime();
      const hoursUntil = msUntil / (60 * 60 * 1000);
      const tz = app.elder.elderProfile?.timezone || DEFAULT_TIMEZONE;
      const timeStr = formatInTimeZone(app.scheduledAt, tz, "hh:mm a");

      // 24h reminder (between 2h and 24h away)
      if (hoursUntil <= 24 && hoursUntil > 2 && !app.reminder24hSentAt) {
        const claimed = await prisma.appointment.updateMany({
          where: { id: app.id, reminder24hSentAt: null },
          data: { reminder24hSentAt: now },
        });

        if (claimed.count > 0) {
          const recipients = [app.elderId, ...app.elder.elderAccessAsElder.map((l) => l.memberId)];
          for (const recipientId of recipients) {
            await createNotification({
              userId: recipientId,
              elderId: app.elderId,
              type: NotificationType.APPOINTMENT_REMINDER,
              templateKey: "appointment_24h",
              params: {
                elderName: app.elder.name,
                title: app.title,
                time: timeStr,
                doctorName: app.doctor?.name || "Doctor",
                location: app.location || "Clinic",
              },
              dedupeKey: `app24h:${app.id}:${recipientId}`,
              email: true,
            });
            report.appointmentReminders++;
          }
        }
      }

      // 2h reminder (<= 2h away)
      if (hoursUntil <= 2 && hoursUntil > 0 && !app.reminder2hSentAt) {
        const claimed = await prisma.appointment.updateMany({
          where: { id: app.id, reminder2hSentAt: null },
          data: { reminder2hSentAt: now },
        });

        if (claimed.count > 0) {
          const recipients = [app.elderId, ...app.elder.elderAccessAsElder.map((l) => l.memberId)];
          for (const recipientId of recipients) {
            await createNotification({
              userId: recipientId,
              elderId: app.elderId,
              type: NotificationType.APPOINTMENT_REMINDER,
              templateKey: "appointment_2h",
              params: {
                elderName: app.elder.name,
                title: app.title,
                time: timeStr,
                location: app.location || "Clinic",
              },
              dedupeKey: `app2h:${app.id}:${recipientId}`,
              email: true,
            });
            report.appointmentReminders++;
          }
        }
      }
    }
  } catch (err) {
    console.error("[CRON_TICK] Appointment reminder error:", err);
  }

  // ---------------------------------------------------------------------------
  // h. REFILL CHECK (stockCount <= refillThreshold)
  // ---------------------------------------------------------------------------
  try {
    const dateStr = formatInTimeZone(now, DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const lowStockMedicines = await prisma.medicine.findMany({
      where: {
        status: MedicineStatus.ACTIVE,
        stockCount: { not: null },
        refillThreshold: { not: null },
      },
      include: {
        elder: {
          include: {
            elderAccessAsElder: {
              where: {
                status: AccessStatus.ACTIVE,
                role: { in: [Role.CARETAKER, Role.DOCTOR] },
              },
              select: { memberId: true },
            },
          },
        },
      },
    });

    for (const med of lowStockMedicines) {
      if (med.stockCount !== null && med.refillThreshold !== null && med.stockCount <= med.refillThreshold) {
        const recipients = [med.elderId, ...med.elder.elderAccessAsElder.map((l) => l.memberId)];
        for (const recipientId of recipients) {
          await createNotification({
            userId: recipientId,
            elderId: med.elderId,
            type: NotificationType.REFILL_REMINDER,
            templateKey: "refill_reminder",
            params: {
              elderName: med.elder.name,
              medicineName: med.name,
              stockCount: med.stockCount,
            },
            dedupeKey: `refill:${med.id}:${dateStr}:${recipientId}`,
            email: true,
          });
          report.refillAlerts++;
        }
      }
    }
  } catch (err) {
    console.error("[CRON_TICK] Refill check error:", err);
  }

  // ---------------------------------------------------------------------------
  // i. EMAIL OUTBOX: Process queued emails within ~40s budget
  // ---------------------------------------------------------------------------
  try {
    const emailResult = await processEmailOutbox(20, 40000);
    report.emailsProcessed = emailResult.sent;
  } catch (err) {
    console.error("[CRON_TICK] Email outbox processing error:", err);
  }

  return NextResponse.json({
    ok: true,
    data: report,
  });
}

export async function GET(req: NextRequest) {
  return handleCronTick(req);
}

export async function POST(req: NextRequest) {
  return handleCronTick(req);
}
