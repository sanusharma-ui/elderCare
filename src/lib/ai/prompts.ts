import { DoctorDashboardResult, ElderAdherenceResult } from "@/lib/analytics";
import { SupportedLanguage } from "@/lib/i18n/messages";

export const PROMPTS_VERSION = "2.0.0";
export const AI_DISCLAIMER =
  "Advisory only; clinical decisions remain with the doctor.";

export function getDailyBriefSystemPrompt(): string {
  return `You are Smriti Clinical Assistant, a specialized AI briefing engine for geriatricians and doctors managing elderly patients in India.
Your task is to generate a concise, objective, calm, and scannable daily briefing for the doctor based STRICTLY on the provided JSON data.

CRITICAL RULES:
1. Every number, percentage, count, and patient name must come directly from the input JSON. NEVER fabricate or recalculate data.
2. NEVER suggest medication changes, specific drugs, dosages, or clinical diagnoses. Your role is strictly summarization and attention prioritization.
3. Write in a calm, professional tone suitable for a physician.
4. Output MUST be written in the specified language ('en' for English, 'hi' for Hindi, 'mr' for Marathi).
5. Always end with the reminder that this summary is advisory.`;
}

export function getDailyBriefUserPrompt(
  metrics: DoctorDashboardResult,
  doctorName: string,
  lang: SupportedLanguage
): string {
  return `Doctor: ${doctorName}
Target Language: ${lang}
Dashboard Metrics JSON:
${JSON.stringify(metrics, null, 2)}

Please generate a structured daily briefing with:
1. Headline sentence: "X of N patients on track, Y need attention, Z critical focus."
2. Key Patients Requiring Immediate Review (top 3 from attentionList) with the exact reasons provided.
3. Observations on caretaker notes and low stock items.
Keep it strictly under 250 words, clean bullet points, calm tone.`;
}

export function generateDailyBriefFallback(
  metrics: DoctorDashboardResult,
  doctorName: string,
  lang: SupportedLanguage
): string {
  const topPatients = metrics.attentionList.slice(0, 3);

  if (lang === "hi") {
    const patientBullets = topPatients.length
      ? topPatients
          .map(
            (p) =>
              `• ${p.name}: पालन दर ${p.adherencePercentage ?? "N/A"}%, पिछले 7 दिनों में ${p.missedDoses7d} खुराकें छूटीं (${p.reasons.join(", ")})`
          )
          .join("\n")
      : "कोई क्रिटिकल मरीज नहीं है।";

    return `दैनिक क्लिनिकल ब्रीफ - डॉ. ${doctorName}\n\nकुल ${metrics.totalPatients} मरीजों में से ${metrics.onTrack} मरीज सही स्थिति में हैं, ${metrics.needsAttention} मरीजों पर ध्यान देने की आवश्यकता है, और ${metrics.critical} क्रिटिकल श्रेणी में हैं। आज ${metrics.dosesMissedToday} खुराकें छूटी हैं।\n\nप्राथमिकता सूची:\n${patientBullets}\n\nकेयरटेकर नोट्स: ${metrics.unseenNotesCount} नए नोट समीक्षा हेतु लंबित हैं।`;
  }

  if (lang === "mr") {
    const patientBullets = topPatients.length
      ? topPatients
          .map(
            (p) =>
              `• ${p.name}: औषध पालन ${p.adherencePercentage ?? "N/A"}%, मागील 7 दिवसांत ${p.missedDoses7d} डोस चुकले (${p.reasons.join(", ")})`
          )
          .join("\n")
      : "सध्या कोणताही रुग्ण गंभीर स्थितीत नाही.";

    return `दैनिक क्लिनिकल सारांश - डॉ. ${doctorName}\n\nएकूण ${metrics.totalPatients} रुग्णांपैकी ${metrics.onTrack} रुग्ण चांगल्या स्थितीत आहेत, ${metrics.needsAttention} रुग्णांवर लक्ष ठेवण्याची गरज आहे, आणि ${metrics.critical} रुग्ण गंभीर स्थितीत आहेत. आज ${metrics.dosesMissedToday} डोस चुकले आहेत.\n\nप्राधान्य रुग्ण:\n${patientBullets}\n\nकेअरटेकर नोंदी: ${metrics.unseenNotesCount} नवीन नोंदी तपासणीसाठी बाकी आहेत.`;
  }

  // English fallback
  const patientBullets = topPatients.length
    ? topPatients
        .map(
          (p) =>
            `• ${p.name}: Adherence ${p.adherencePercentage ?? "N/A"}%, ${p.missedDoses7d} missed doses in 7 days (${p.reasons.join(", ")})`
        )
        .join("\n")
    : "No critical attention patients currently.";

  return `Daily Clinical Brief - Dr. ${doctorName}\n\n${metrics.onTrack} of ${metrics.totalPatients} patients are on track, ${metrics.needsAttention} need attention, and ${metrics.critical} are in critical focus. ${metrics.dosesMissedToday} doses missed today across all linked patients.\n\nTop Priority Patients:\n${patientBullets}\n\nCaretaker Updates: ${metrics.unseenNotesCount} unread notes awaiting doctor review.`;
}

export function getPatientSummarySystemPrompt(): string {
  return `You are Smriti Clinical Assistant. Summarize a 7-day adherence report for a single elderly patient for their consulting doctor.
Keep it between 3 to 5 lines. Concise, respectful, objective.
Do not recommend specific medications or doses.
Output strictly in the specified language ('en', 'hi', or 'mr').`;
}

export function generatePatientSummaryFallback(
  adherence: ElderAdherenceResult,
  elderName: string,
  lang: SupportedLanguage
): string {
  const pctStr = adherence.overallPercentage !== null ? `${adherence.overallPercentage}%` : "No data";

  if (lang === "hi") {
    return `${elderName} जी का पिछले ${adherence.days} दिनों का औसत दवा पालन ${pctStr} रहा है (कुल ${adherence.totalClosedDoses} खुराकें: ${adherence.takenCount + adherence.givenCount} ली गईं, ${adherence.missedCount} छूटीं)। वर्तमान में लगातार छूटी खुराकों की संख्या ${adherence.currentMissStreak} है। सबसे कमजोर समय स्लॉट: रात/शाम।`;
  }

  if (lang === "mr") {
    return `${elderName} यांचा मागील ${adherence.days} दिवसांचा औषध पालन दर ${pctStr} आहे (एकूण ${adherence.totalClosedDoses} डोस: ${adherence.takenCount + adherence.givenCount} पूर्ण, ${adherence.missedCount} चुकले). सध्या सलग चुकलेल्या डोसची संख्या ${adherence.currentMissStreak} आहे.`;
  }

  return `${elderName} has maintained an overall adherence rate of ${pctStr} across the past ${adherence.days} days (${adherence.takenCount + adherence.givenCount} taken/given, ${adherence.missedCount} missed out of ${adherence.totalClosedDoses} closed doses). Current miss streak is ${adherence.currentMissStreak}. Weakest adherence is observed during evening/night doses.`;
}
