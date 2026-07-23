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
  const title = invite.revealTitle || "Plot Twist";
  const baseDescription = invite.description || invite.teaserMessage || "";
  // Fold the Partiful RSVP link into the event so it travels with the calendar
  // entry (both as a dedicated URL property and inline in the description).
  const description = invite.partifulUrl
    ? `${baseDescription ? `${baseDescription}\n\n` : ""}RSVP on Partiful: ${invite.partifulUrl}`
    : baseDescription;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plot Twist//Invite//EN",
    "BEGIN:VEVENT",
    `UID:${invite._id || crypto.randomUUID()}@plot-twist`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    ...buildDateLines(invite),
    `SUMMARY:${escapeCalendarText(title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    ...(invite.partifulUrl ? [`URL:${escapeCalendarText(invite.partifulUrl)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

// Prefer an explicit event date (an all-day VEVENT, spanning the range if set).
// Fall back to a one-hour block at the unlock time when no event date was given.
function buildDateLines(invite) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(invite.eventStartDate || "")) {
    const endSource =
      invite.eventIsRange && invite.eventEndDate ? invite.eventEndDate : invite.eventStartDate;
    // For all-day events the iCal DTEND is exclusive, so it lands on the day after.
    return [
      `DTSTART;VALUE=DATE:${invite.eventStartDate.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addOneDay(endSource).replace(/-/g, "")}`
    ];
  }

  const startDate = new Date(invite.unlockAt);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  return [`DTSTART:${formatCalendarDate(startDate)}`, `DTEND:${formatCalendarDate(endDate)}`];
}

function addOneDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${next.getUTCFullYear()}-${mm}-${dd}`;
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
