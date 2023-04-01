export interface Commit {
  date: Date;
  msg: string;
}

export interface CalendarEvent {
  start: Date;
  end: Date;
  durationMillis: number;
}
