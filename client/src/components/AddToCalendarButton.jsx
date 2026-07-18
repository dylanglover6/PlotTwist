import { CalendarPlus } from "lucide-react";

export default function AddToCalendarButton({
  className = "button-secondary",
  invite,
  label = "Add to Calendar"
}) {
  const calendarHref = createCalendarHref(invite);

  return (
    <a className={className} download="plot-twist.ics" href={calendarHref}>
      <CalendarPlus size={18} />
      <span className="min-w-0 text-center leading-tight">{label}</span>
    </a>
  );
}

function createCalendarHref(invite) {
  const startDate = new Date(invite.unlockAt);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const title = invite.revealTitle || "Plot Twist";
  const description = invite.description || invite.teaserMessage || "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plot Twist//Invite//EN",
    "BEGIN:VEVENT",
    `UID:${invite._id || crypto.randomUUID()}@plot-twist`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(startDate)}`,
    `DTEND:${formatCalendarDate(endDate)}`,
    `SUMMARY:${escapeCalendarText(title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function formatCalendarDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeCalendarText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
