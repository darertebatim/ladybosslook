export type TimedWebinarKind = 'onehour' | 'start';

/** First top-of-hour run during local 9 AM on the session date (East/West). */
export function morningIn(session: Date, tz: string): Date | null {
  const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: tz });
  const hourFormat = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' });
  const day = dateFormat.format(session);
  for (let h = -48; h <= 0; h++) {
    const t = new Date(session.getTime() + h * 3600_000);
    t.setUTCMinutes(0, 0, 0);
    if (Number(hourFormat.format(t)) === 9 && dateFormat.format(t) === day) return t;
  }
  return null;
}

export function webinarSendAt(session: string | Date, kind: TimedWebinarKind): Date {
  const start = new Date(session).getTime();
  return new Date(start - (kind === 'onehour' ? 60 * 60_000 : 0));
}

/** Never send early; allow only a small processing-delay window. */
export function webinarSendIsDue(session: string | Date, kind: TimedWebinarKind, now: number): boolean {
  const due = webinarSendAt(session, kind).getTime();
  return Number.isFinite(due) && now >= due && now < due + 5 * 60_000;
}