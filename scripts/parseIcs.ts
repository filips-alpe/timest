import { CalendarEvent } from "./types";

export function parseIcs(icsData: string) {
  const events: CalendarEvent[] = [];

  // Split the .ics data into individual events
  const eventStrings = icsData.split("BEGIN:VEVENT");
  eventStrings.shift(); // Remove the first element (it's not an event)

  // Parse each event's start and end dates
  for (const eventString of eventStrings) {
    const startMatch = eventString.match(/DTSTART:(.*)/);
    const endMatch = eventString.match(/DTEND:(.*)/);

    if (startMatch && endMatch) {
      const start = toDate(startMatch[1]);
      const end = toDate(endMatch[1]);
      events.push({
        start,
        end,
        durationMillis: end.getTime() - start.getTime(),
      });
    }
  }

  // Sort the events by start date
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Group the events by date
  const eventsByDate = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    eventsByDate.set(
      event.start.getTime(),
      (eventsByDate.get(event.start.getTime()) ?? []).concat(event),
    );
  }

  return eventsByDate;
}

function toDate(dateStr: string): Date {
  const isoDateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(
    4,
    6,
  )}-${dateStr.slice(6, 8)}T${dateStr.slice(9, 11)}:${dateStr.slice(
    11,
    13,
  )}:${dateStr.slice(13, 15)}.000Z`;
  return new Date(isoDateStr);
}

export function printDay(date: Date) {
  return `${date.getDate().toString().padStart(2, "0")} ${date.toLocaleString(
    "default",
    {
      month: "short",
    },
  )} ${date.getFullYear()}`;
}
