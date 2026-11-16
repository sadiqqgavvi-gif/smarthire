// Colour and label for a score out of 10.
// null, "" and "N/A" mean the answer was not scored (Number(null) would be 0).
export const toScore = (score) => {
  if (score === null || score === undefined || score === "") return null;
  const value = Number(score);
  return Number.isFinite(value) ? value : null;
};

export const getScoreTone = (score) => {
  const value = toScore(score);
  if (value === null) {
    return {
      label: "Not scored",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      bar: "bg-slate-400",
    };
  }
  if (value >= 8) {
    return {
      label: "Excellent",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      bar: "bg-emerald-500",
    };
  }
  if (value >= 6) {
    return {
      label: "Good",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      bar: "bg-blue-500",
    };
  }
  if (value >= 4) {
    return {
      label: "Needs work",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      bar: "bg-amber-500",
    };
  }
  return {
    label: "Keep practicing",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    bar: "bg-red-500",
  };
};
