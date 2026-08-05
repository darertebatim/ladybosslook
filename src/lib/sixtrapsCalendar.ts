// Calendar helpers for the /sixtraps webinar landing.
// Google Calendar URL + ICS blob generation.

export interface WebinarEvent {
  title: string;
  description: string;
  startUtc: Date;
  durationMinutes: number;
  location: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function buildGoogleCalendarUrl(evt: WebinarEvent): string {
  const end = new Date(evt.startUtc.getTime() + evt.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evt.title,
    dates: `${toIcsDate(evt.startUtc)}/${toIcsDate(end)}`,
    details: evt.description,
    location: evt.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(evt: WebinarEvent): string {
  const end = new Date(evt.startUtc.getTime() + evt.durationMinutes * 60_000);
  const uid = `sixtraps-${evt.startUtc.getTime()}@ladybosslook.com`;
  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ladybosslook//SixTraps//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(evt.startUtc)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escape(evt.title)}`,
    `DESCRIPTION:${escape(evt.description)}`,
    `LOCATION:${escape(evt.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(evt: WebinarEvent, filename = "sixtraps.ics") {
  const blob = new Blob([buildIcsContent(evt)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/**
 * Format a UTC date in Los Angeles time with American (Gregorian) calendar.
 */
export function formatLADateTime(d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "full",
      timeStyle: "short",
    }).format(d) + " (PT)";
  } catch {
    return d.toISOString();
  }
}

/**
 * Format a UTC date in the user's local browser timezone (American calendar).
 */
export function formatLocalDateTime(d: Date): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
    const date = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
    const formatted = `${time}, ${date}`;
    return tz ? `${formatted} (${tz})` : formatted;
  } catch {
    return d.toString();
  }
}