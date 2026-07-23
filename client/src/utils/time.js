// Convert a target timestamp into display-friendly remaining-time parts.
// Shared by CountdownTimer and CountdownLabel so the math lives in one place.
export function getTimeLeft(targetTime, now = Date.now()) {
  const totalMilliseconds = Math.max(0, targetTime - now);
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const totalHours = Math.floor(totalSeconds / 3600);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    totalSeconds,
    totalMilliseconds
  };
}

// Parse a plain "YYYY-MM-DD" as a local calendar day (no timezone shift).
function parseDateOnly(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Human-friendly label for an optional event date or range, e.g.
// "August 1, 2026", "August 1–3, 2026", or "August 1 – September 3, 2026".
// Returns "" when no date is set.
export function formatEventDate(start, end, isRange) {
  const startDate = parseDateOnly(start);
  if (!startDate) return "";

  const monthDay = (d) => d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const full = (d) => d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  const endDate = isRange ? parseDateOnly(end) : null;
  if (!endDate || endDate.getTime() <= startDate.getTime()) {
    return full(startDate);
  }

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  if (sameMonth) {
    // "August 1–3, 2026"
    return `${monthDay(startDate)}–${endDate.getDate()}, ${endDate.getFullYear()}`;
  }
  if (sameYear) {
    // "August 1 – September 3, 2026"
    return `${monthDay(startDate)} – ${full(endDate)}`;
  }
  // "August 1, 2026 – January 3, 2027"
  return `${full(startDate)} – ${full(endDate)}`;
}
