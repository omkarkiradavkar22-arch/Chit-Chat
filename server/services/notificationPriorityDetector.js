const urgentKeywords = [
  // English
  "urgent",
  "urgently",
  "asap",
  "immediately",
  "emergency",
  "critical",
  "right now",
  "very important",
  "do it now",
  "call me now",

  // Hinglish / Marathi
  "tatkal",
  "lagech",
  "लगेच",
  "तात्काळ",
  "आत्ता",
  "aata",
  "ata",
  "lavkar",
  "lavkar kar",
  "लवकर",
  "urgent ahe",
  "khup urgent",
];

const importantKeywords = [
  // English
  "important",
  "deadline",
  "due today",
  "due tomorrow",
  "submit today",
  "submit tomorrow",
  "assignment",
  "exam",
  "meeting",
  "interview",
  "reminder",
  "remember",
  "don't forget",
  "dont forget",
  "please send",

  // Hinglish / Marathi
  "mahatvache",
  "महत्त्वाचे",
  "महत्वाचे",
  "deadline ahe",
  "udya",
  "उद्या",
  "aaj",
  "आज",
  "exam ahe",
  "paper ahe",
  "assignment ahe",
  "assignment pathav",
  "assignment pathav na",
  "visru nako",
  "विसरू नको",
  "lakshat thev",
  "लक्षात ठेव",
];

export const detectNotificationPriority = (text = "") => {
  const normalizedText = text
    .toLowerCase()
    .trim();

  if (!normalizedText) {
    return "normal";
  }

  // 🔴 URGENT
  const isUrgent = urgentKeywords.some((keyword) =>
    normalizedText.includes(keyword.toLowerCase())
  );

  if (isUrgent) {
    return "urgent";
  }

  // 🟠 IMPORTANT
  const isImportant = importantKeywords.some((keyword) =>
    normalizedText.includes(keyword.toLowerCase())
  );

  if (isImportant) {
    return "important";
  }

  // ⚪ NORMAL
  return "normal";
};