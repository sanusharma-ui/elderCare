import { TimeSlot } from "@prisma/client";

export type SupportedLanguage = "en" | "hi" | "mr";

export interface MessageTemplate {
  title: string;
  body: string;
}

export const TIME_SLOT_LABELS: Record<SupportedLanguage, Record<TimeSlot, string>> = {
  en: {
    [TimeSlot.MORNING]: "Morning",
    [TimeSlot.AFTERNOON]: "Afternoon",
    [TimeSlot.EVENING]: "Evening",
    [TimeSlot.NIGHT]: "Night",
  },
  hi: {
    [TimeSlot.MORNING]: "सुबह",
    [TimeSlot.AFTERNOON]: "दोपहर",
    [TimeSlot.EVENING]: "शाम",
    [TimeSlot.NIGHT]: "रात",
  },
  mr: {
    [TimeSlot.MORNING]: "सकाळी",
    [TimeSlot.AFTERNOON]: "दुपारी",
    [TimeSlot.EVENING]: "संध्याकाळी",
    [TimeSlot.NIGHT]: "रात्री",
  },
};

export const MESSAGE_CATALOG: Record<
  string,
  Record<SupportedLanguage, MessageTemplate>
> = {
  dose_due: {
    en: {
      title: "Medication Reminder: {elderName}",
      body: "Time to take/give {medicines} ({doseQuantity}) for {elderName} ({slot}).",
    },
    hi: {
      title: "दवा का समय: {elderName}",
      body: "{elderName} जी के {slot} की दवा {medicines} ({doseQuantity}) लेने का समय हो गया है।",
    },
    mr: {
      title: "औषधाची वेळ: {elderName}",
      body: "{elderName} यांच्या {slot} ची औषधे {medicines} ({doseQuantity}) घेण्याची वेळ झाली आहे.",
    },
  },
  dose_nudge: {
    en: {
      title: "Medication Still Pending: {elderName}",
      body: "{elderName}'s {slot} medication ({medicines}) scheduled for {time} is still pending. Please confirm.",
    },
    hi: {
      title: "दवा बाकी है (अनुस्मारक): {elderName}",
      body: "{elderName} जी की {time} ({slot}) की दवा {medicines} अभी तक नहीं ली गई है। कृपया सुनिश्चित करें।",
    },
    mr: {
      title: "औषध बाकी आहे (स्मरणपत्र): {elderName}",
      body: "{elderName} यांचे {time} ({slot}) चे औषध {medicines} अद्याप घेतलेले नाही. कृपया खात्री करा.",
    },
  },
  dose_missed: {
    en: {
      title: "URGENT: Missed Medication Alert for {elderName}",
      body: "{elderName} missed their {slot} medication ({medicines}) scheduled for {time}. Please contact them immediately.",
    },
    hi: {
      title: "जरूरी सूचना: {elderName} की छूटी हुई दवा",
      body: "{elderName} जी की {time} ({slot}) की दवा {medicines} छूट गई है। कृपया तुरंत उनसे या केयरटेकर से संपर्क करें।",
    },
    mr: {
      title: "तात्काळ सूचना: {elderName} यांचे औषध चुकले",
      body: "{elderName} यांचे {time} ({slot}) चे औषध {medicines} सुटले आहे. कृपया त्वरित त्यांच्याशी किंवा केअरटेकरशी संपर्क साधा.",
    },
  },
  dose_late_taken: {
    en: {
      title: "Medication Update: {elderName}",
      body: "{elderName}'s previously missed medication ({medicines}) was completed late at {time}.",
    },
    hi: {
      title: "दवा अपडेट: {elderName}",
      body: "{elderName} जी की पहले छूटी हुई दवा ({medicines}) {time} पर ले ली गई है।",
    },
    mr: {
      title: "औषध अपडेट: {elderName}",
      body: "{elderName} यांचे पूर्वी सुटलेले औषध ({medicines}) {time} वाजता घेण्यात आले आहे.",
    },
  },
  appointment_24h: {
    en: {
      title: "Doctor Appointment Tomorrow: {elderName}",
      body: "{elderName} has an appointment '{title}' tomorrow at {time} with {doctorName} at {location}.",
    },
    hi: {
      title: "कल डॉक्टर अपॉइंटमेंट: {elderName}",
      body: "{elderName} जी की कल {time} बजे '{title}' अपॉइंटमेंट है ({doctorName}, {location})।",
    },
    mr: {
      title: "उद्या डॉक्टरांची भेट: {elderName}",
      body: "{elderName} यांची उद्या {time} वाजता '{title}' भेट नियोजित आहे ({doctorName}, {location}).",
    },
  },
  appointment_2h: {
    en: {
      title: "Appointment in 2 Hours: {elderName}",
      body: "{elderName}'s appointment '{title}' is in 2 hours at {time} ({location}).",
    },
    hi: {
      title: "2 घंटे में अपॉइंटमेंट: {elderName}",
      body: "{elderName} जी की अपॉइंटमेंट '{title}' 2 घंटे में {time} बजे है ({location})।",
    },
    mr: {
      title: "2 तासांत अपॉइंटमेंट: {elderName}",
      body: "{elderName} यांची '{title}' अपॉइंटमेंट 2 तासांत {time} वाजता आहे ({location}).",
    },
  },
  refill_reminder: {
    en: {
      title: "Low Stock Alert: {medicineName}",
      body: "Only {stockCount} doses remaining for {medicineName} for {elderName}. Please refill soon.",
    },
    hi: {
      title: "दवा का स्टॉक कम है: {medicineName}",
      body: "{elderName} जी की दवा {medicineName} की केवल {stockCount} खुराक बची हैं। कृपया जल्द ही नई दवा लाएं।",
    },
    mr: {
      title: "औषधांचा साठा कमी आहे: {medicineName}",
      body: "{elderName} यांच्या {medicineName} औषधाचे फक्त {stockCount} डोस शिल्लक आहेत. कृपया लवकर खरेदी करा.",
    },
  },
  caretaker_note: {
    en: {
      title: "Caretaker Note for {elderName}",
      body: "Caretaker {authorName} noted: \"{text}\"",
    },
    hi: {
      title: "केयरटेकर नोट: {elderName}",
      body: "केयरटेकर {authorName} ने लिखा: \"{text}\"",
    },
    mr: {
      title: "केअरटेकर नोंद: {elderName}",
      body: "केअरटेकर {authorName} यांनी नोंद केली: \"{text}\"",
    },
  },
  caretaker_note_urgent: {
    en: {
      title: "URGENT Caretaker Alert for {elderName}",
      body: "URGENT alert from {authorName}: \"{text}\"",
    },
    hi: {
      title: "अत्यावश्यक केयरटेकर अलर्ट: {elderName}",
      body: "{authorName} द्वारा {elderName} जी के लिए अत्यावश्यक सूचना: \"{text}\"",
    },
    mr: {
      title: "तात्काळ केअरटेकर अलर्ट: {elderName}",
      body: "{authorName} यांनी {elderName} यांच्यासाठी तात्काळ सूचना दिली: \"{text}\"",
    },
  },
  pattern_alert: {
    en: {
      title: "Clinical Pattern Alert: {elderName}",
      body: "{elderName} has missed {missCount} doses in the last 24 hours. Clinical intervention advised.",
    },
    hi: {
      title: "क्लिनिकल पैटर्न अलर्ट: {elderName}",
      body: "{elderName} जी की पिछले 24 घंटों में {missCount} खुराकें छूटी हैं। कृपया ध्यान दें।",
    },
    mr: {
      title: "क्लिनिकल पॅटर्न अलर्ट: {elderName}",
      body: "{elderName} यांचे मागील 24 तासांत {missCount} डोस चुकले आहेत. कृपया लक्ष द्यावे.",
    },
  },
};

/**
 * Interpolates variables in a template string, e.g. "{elderName} -> Ramesh Sharma"
 */
export function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  let result = template;
  for (const [key, val] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(val));
  }
  return result;
}

/**
 * Formats a medicine name with local transliteration if available for hi/mr
 */
export function formatMedicineNameForLanguage(
  name: string,
  nameLocal: string | null | undefined,
  lang: SupportedLanguage
): string {
  if ((lang === "hi" || lang === "mr") && nameLocal) {
    return `${name} (${nameLocal})`;
  }
  return name;
}

/**
 * Renders title and body for a given templateKey, language and parameters
 */
export function renderMessage(
  templateKey: string,
  lang: SupportedLanguage,
  params: Record<string, string | number>
): MessageTemplate {
  const category = MESSAGE_CATALOG[templateKey];
  const template =
    category?.[lang] || category?.en || {
      title: "Smriti Notification",
      body: "You have a new notification on Smriti.",
    };

  return {
    title: interpolate(template.title, params),
    body: interpolate(template.body, params),
  };
}
