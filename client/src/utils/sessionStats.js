const dayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

// Consecutive days with at least one saved session, ending today or yesterday.
export const computeStreak = (sessions = [], now = new Date()) => {
  const days = new Set(sessions.map((s) => dayKey(s?.createdAt)).filter(Boolean));
  if (!days.size) return 0;

  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
