const taskPatterns = [
  // CALL
  /\bcall\s+(me|him|her|them|.+?)\s+(later|tomorrow|today|at\s+\d+)/i,
  /\bcall\s+me\b/i,

  // REMIND
  /\bremind\s+me\b/i,
  /\bremember\s+to\b/i,

  // SEND
  /\bsend\s+(me|him|her|them)\b/i,

  // MEET
  /\bmeet\s+(me|him|her|them)\b/i,
  /\bmeeting\b/i,

  // FUTURE ACTIONS
  /\bdo\s+it\s+(later|tomorrow|today)\b/i,
  /\bfinish\s+it\s+(later|tomorrow|today)\b/i,

  // REQUEST / TASK
  /\bneed\s+to\b/i,
  /\bhave\s+to\b/i,
  /\bgotta\b/i,
  /\bdon't\s+forget\b/i,
];

const futureWords = [
  "later",
  "tomorrow",
  "today",
  "tonight",
  "udya",
  "aaj",
  "nantar",
  "नंतर",
  "उद्या",
  "आज",
  "आज रात्री",
];

const taskActions = [
  "call",
  "send",
  "meet",
  "remind",
  "remember",
  "finish",
  "complete",
  "submit",
  "do",
  "bring",
  "take",
  "go",
  "wake",
  "uth",
  "lavkar uthaycha",
];

export const detectTask = (text) => {
  if (!text || !text.trim()) {
    return {
      isTask: false,
      title: "",
      deadline: null,
    };
  }

  const normalizedText = text
    .toLowerCase()
    .trim();

  const hasPattern = taskPatterns.some((pattern) =>
    pattern.test(normalizedText)
  );

  const hasFutureWord = futureWords.some((word) =>
    normalizedText.includes(word)
  );

  const hasTaskAction = taskActions.some((word) =>
    normalizedText.includes(word)
  );

  /*
   * Task is detected when:
   *
   * 1. A strong task pattern exists
   * OR
   * 2. An action + future/reminder context exists
   */

  const isTask =
    hasPattern ||
    (hasTaskAction && hasFutureWord);

  if (!isTask) {
    return {
      isTask: false,
      title: "",
      deadline: null,
    };
  }

  return {
    isTask: true,
    title: generateTaskTitle(normalizedText),
    deadline: extractDeadline(normalizedText),
  };
};

const generateTaskTitle = (text) => {
  // Keep the original message as the task title.
  // We'll improve this later with smarter extraction.

  return text
    .charAt(0)
    .toUpperCase() + text.slice(1);
};

const extractDeadline = (text) => {
  const now = new Date();

  // TOMORROW / उद्या
  if (
    text.includes("tomorrow") ||
    text.includes("udya") ||
    text.includes("उद्या")
  ) {
    const tomorrow = new Date(now);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    // Try to find time
    const timeMatch = text.match(
      /\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
    );

    if (timeMatch) {
      let hour = Number(timeMatch[1]);
      const minute = Number(timeMatch[2] || 0);
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hour < 12) {
        hour += 12;
      }

      if (period === "am" && hour === 12) {
        hour = 0;
      }

      tomorrow.setHours(hour, minute, 0, 0);
    }

    return tomorrow;
  }

  // TODAY / आज
  if (
    text.includes("today") ||
    text.includes("aaj") ||
    text.includes("आज")
  ) {
    const today = new Date();

    const timeMatch = text.match(
      /\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
    );

    if (timeMatch) {
      let hour = Number(timeMatch[1]);
      const minute = Number(timeMatch[2] || 0);
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hour < 12) {
        hour += 12;
      }

      if (period === "am" && hour === 12) {
        hour = 0;
      }

      today.setHours(hour, minute, 0, 0);
    }

    return today;
  }

  // No clear deadline
  return null;
};