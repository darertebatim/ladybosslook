import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { morningIn, webinarSendAt, webinarSendIsDue } from './webinar-timing.ts';

const session = '2026-10-19T23:00:00Z';
test('Eastern morning sends at exactly 9 AM, displayed as 6 AM Pacific, not 6:20', () => {
  assert.equal(morningIn(new Date(session), 'America/New_York')?.toISOString(), '2026-10-19T13:00:00.000Z');
});
test('Pacific morning sends at exactly 9 AM, not 9:20', () => {
  assert.equal(morningIn(new Date(session), 'America/Los_Angeles')?.toISOString(), '2026-10-19T16:00:00.000Z');
});
test('morning schedule respects winter daylight-saving changes', () => {
  const winter = new Date('2026-11-09T23:00:00Z');
  assert.equal(morningIn(winter, 'America/New_York')?.toISOString(), '2026-11-09T14:00:00.000Z');
  assert.equal(morningIn(winter, 'America/Los_Angeles')?.toISOString(), '2026-11-09T17:00:00.000Z');
});
test('one-hour email is exactly 60 minutes before Round 23, never 40 minutes early', () => {
  assert.equal(webinarSendAt(session, 'onehour').toISOString(), '2026-10-19T22:00:00.000Z');
  assert.equal(webinarSendIsDue(session, 'onehour', Date.parse('2026-10-19T21:20:00Z')), false);
  assert.equal(webinarSendIsDue(session, 'onehour', Date.parse('2026-10-19T21:59:59Z')), false);
  assert.equal(webinarSendIsDue(session, 'onehour', Date.parse('2026-10-19T22:00:00Z')), true);
});
test('Starting now is due at the exact session start, never earlier', () => {
  assert.equal(webinarSendAt(session, 'start').toISOString(), '2026-10-19T23:00:00.000Z');
  assert.equal(webinarSendIsDue(session, 'start', Date.parse('2026-10-19T22:20:00Z')), false);
  assert.equal(webinarSendIsDue(session, 'start', Date.parse('2026-10-19T22:59:59Z')), false);
  assert.equal(webinarSendIsDue(session, 'start', Date.parse(session)), true);
});
test('rescheduling a round moves both deadlines and stale calls cannot send', () => {
  const moved = '2026-10-20T18:00:00Z';
  assert.equal(webinarSendAt(moved, 'onehour').toISOString(), '2026-10-20T17:00:00.000Z');
  assert.equal(webinarSendIsDue(moved, 'start', Date.parse(session)), false);
  assert.equal(webinarSendIsDue(session, 'start', Date.parse('2026-10-19T23:05:00Z')), false);
});