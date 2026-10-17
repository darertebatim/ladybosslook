export type TimedWebinarKind = 'onehour' | 'start';

export function webinarSendAt(session: string | Date, kind: TimedWebinarKind): Date {
  const start = new Date(session).getTime();
  return new Date(start - (kind === 'onehour' ? 60 * 60_000 : 0));
}

/** Never send early; allow only a small processing-delay window. */
export function webinarSendIsDue(session: string | Date, kind: TimedWebinarKind, now: number): boolean {
  const due = webinarSendAt(session, kind).getTime();
  return Number.isFinite(due) && now >= due && now < due + 5 * 60_000;
}