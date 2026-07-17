import { useEffect, useMemo, useState } from "react";

// CountdownTimer receives a future date and displays how much time remains.
export default function CountdownTimer({ className = "", onComplete, targetDate }) {
  // Convert the incoming date once per targetDate change.
  const targetTime = useMemo(() => new Date(targetDate).getTime(), [targetDate]);

  // The function form of useState calculates the first value only on initial render.
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetTime));

  useEffect(() => {
    if (!Number.isFinite(targetTime)) return undefined;

    // tick recalculates remaining time and updates the screen.
    function tick() {
      const nextTimeLeft = getTimeLeft(targetTime);
      setTimeLeft(nextTimeLeft);

      // Optional chaining means "call onComplete only if it was provided."
      if (nextTimeLeft.totalMilliseconds <= 0) {
        onComplete?.();
      }
    }

    // Run once immediately so the UI does not wait one second before updating.
    tick();

    // Then keep updating once per second.
    const intervalId = window.setInterval(tick, 1000);

    // Clear the interval when the component unmounts or targetTime changes.
    return () => window.clearInterval(intervalId);
  }, [onComplete, targetTime]);

  // This array lets us render each time unit with one map call.
  const units = [
    ["Days", timeLeft.days],
    ["Hours", timeLeft.hours],
    ["Minutes", timeLeft.minutes],
    ["Seconds", timeLeft.seconds]
  ];
  const isFinalCountdown = timeLeft.totalSeconds <= 10 && timeLeft.totalSeconds > 0;

  // If the date cannot be parsed, do not render a broken countdown.
  if (!Number.isFinite(targetTime)) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-4 gap-2 ${isFinalCountdown ? "countdown-final" : ""} ${className}`}
    >
      {units.map(([label, value]) => (
        <div
          className={`rounded-2xl bg-white/10 px-2 py-3 ${
            isFinalCountdown && label === "Seconds" ? "countdown-final__seconds" : ""
          }`}
          key={label}
        >
          <strong className="block text-2xl leading-none">{String(value).padStart(2, "0")}</strong>
          <span className="mt-1 block text-[0.68rem] font-bold uppercase text-orange-100">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Convert a millisecond difference into display-friendly date parts.
function getTimeLeft(targetTime) {
  const totalMilliseconds = Math.max(0, targetTime - Date.now());
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds,
    totalSeconds
  };
}
