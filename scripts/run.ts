import { parseIcs, printDay } from "./parseIcs";
import * as fs from "fs";
import * as path from "path";
import { parseGitLog } from "./parseGitLog";
import { CalendarEvent, Commit } from "./types";

const MINUTES_PER_DOT = 15;

function main() {
  const icsData = fs.readFileSync("./data/calendar.ics", "utf-8");
  const gitLogData = fs.readFileSync("./data/gitlog.txt", "utf-8");

  const calendarEvents = parseIcs(icsData);
  const gitLog = parseGitLog(gitLogData);

  const result = combine(calendarEvents, gitLog);
  if (process.env.DEBUG) {
    console.log("git log", gitLog);
    console.log("calendar", calendarEvents);
    console.log("result", result);
  }

  let output = "";
  for (const [day, entries] of result) {
    output += "\n";
    output += printDay(new Date(day));
    output += "\n";
    for (const entry of entries) {
      output += printLine(entry);
      output += "\n";
    }
  }

  console.log(output);
}
main();

function printLine(line: DeliveredIncrement) {
  const task = line.task.padEnd(35);
  return `${task} ${dots(line.durationMinutes)}`;
}

function dots(durationMinutes: number): string {
  const totalDots = Math.round(durationMinutes / MINUTES_PER_DOT);
  return ".".repeat(totalDots).replace(/.{4}/g, "$& ");
}
type DeliveredIncrement = {
  task: string; // determine from commit msg
  finished: Date; // determine from commit time
  started: Date; // sum all time within events in the timespan between the previous git commit until this commit
  durationMinutes: number;
};
function getFirstEventStart(events: Map<number, CalendarEvent[]>) {
  for (const key of events.keys()) {
    const eventsForDate = events.get(key);
    if (eventsForDate && eventsForDate.length > 0) {
      return eventsForDate[0].start;
    }
  }
  return new Date(0);
}
function combine(
  events: Map<number, CalendarEvent[]>,
  log: Commit[],
): Map<number, DeliveredIncrement[]> {
  const result = new Map<number, DeliveredIncrement[]>();

  let previousCommitDate: Date | null = null;

  for (const commit of log) {
    const durationMinutes = sumEventTimeBetween(
      events,
      previousCommitDate ?? getFirstEventStart(events),
      commit.date,
    );
    const deliveredIncrement: DeliveredIncrement = {
      task: commit.msg,
      finished: commit.date,
      started: previousCommitDate ?? getFirstEventStart(events),
      durationMinutes,
    };
    const commitDate = getDayStart(commit.date).getTime();
    if (!result.has(commitDate)) {
      result.set(commitDate, []);
    }
    result.get(commitDate)!.push(deliveredIncrement);

    previousCommitDate = commit.date;
  }

  return result;
}

function sumEventTimeBetween(
  events: Map<number, CalendarEvent[]>,
  start: Date,
  end: Date,
): number {
  let totalDuration = 0;

  for (const [date, eventsOnDate] of events) {
    for (const event of eventsOnDate) {
      // calculate the overlap between the event and the specified range
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      const rangeStart = start.getTime();
      const rangeEnd = end.getTime();
      const overlapStart = Math.max(eventStart, rangeStart);
      const overlapEnd = Math.min(eventEnd, rangeEnd);
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);

      // add the overlap duration to the total duration
      totalDuration += overlapDuration;
    }
  }

  return totalDuration / 1000 / 60;
}

function getDayStart(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function printEvents(events: Map<number, CalendarEvent[]>) {
  let output = "";

  for (const [date, evts] of events.entries()) {
    output += printDay(new Date(date));
    output += "\n";

    for (const event of evts) {
      output += printEvent(event);
      output += "\n";
    }
  }

  return output;
}

function printEvent(event: CalendarEvent) {
  const startString = event.start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endString = event.end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `* ${startString} - ${endString}`;
}
