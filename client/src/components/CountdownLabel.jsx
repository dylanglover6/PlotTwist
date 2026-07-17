import { useEffect, useMemo, useState } from "react";
import { getTimeLeft } from "../utils/time.js";

// A compact countdown for button labels and small status text.
export default function CountdownLabel({ mode = "full", targetDate }) {
  const targetTime = useMemo(() => new Date(targetDate).getTime(), [targetDate]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetTime));

  useEffect(() => {
    if (!Number.isFinite(targetTime)) return undefined;

    function tick() {
      setTimeLeft(getTimeLeft(targetTime));
    }

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [targetTime]);

  if (!Number.isFinite(targetTime)) {
    return null;
  }

  if (mode === "hoursMinutes") {
    return (
      <span>
        {String(timeLeft.totalHours).padStart(2, "0")} Hours{" "}
        {String(timeLeft.minutes).padStart(2, "0")} Minutes
      </span>
    );
  }

  return (
    <span>
      {String(timeLeft.days).padStart(2, "0")} Days {String(timeLeft.hours).padStart(2, "0")} Hours{" "}
      {String(timeLeft.minutes).padStart(2, "0")} Minutes{" "}
      {String(timeLeft.seconds).padStart(2, "0")} Seconds
    </span>
  );
}
