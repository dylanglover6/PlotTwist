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
