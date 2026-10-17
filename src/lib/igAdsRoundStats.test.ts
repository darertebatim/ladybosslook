import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { adSetPage, allocateRoundSpend, attributeEnrollments, attributeRevenue, autoEmailKind } from './igAdsRoundStats';

test('Automated email subjects map to the four webinar emails', () => {
  assert.equal(autoEmailKind('تایید ثبت‌نام: Instagram Ads'), 'signup');
  assert.equal(autoEmailKind('یادآوری وبینار اینستاگرام ادز + ویدیوی پیش‌نیاز 🌷'), 'reminder');
  assert.equal(autoEmailKind('امروز: جذب مشتری واقعی با تبلیغات اینستاگرام 🌷'), 'morning');
  assert.equal(autoEmailKind('وبینار در حال شروع است — همین حالا وارد شوید 🚀'), 'start');
  assert.equal(autoEmailKind('🎁 هدایای ویژه'), null);
});

test('Ad spend goes to the next session and same-day rounds split by sign-ups', () => {
  const spend = allocateRoundSpend(
    [
      { id: 'a', first_session_date: '2026-10-10T18:00:00Z', signups: 10 },
      { id: 'b', first_session_date: '2026-10-14T18:00:00Z', signups: 30 },
      { id: 'c', first_session_date: '2026-10-14T23:00:00Z', signups: 10 },
    ],
    [
      { date: '2026-10-09', spend: 50, page: 'igads' },
      { date: '2026-10-10', spend: 50, page: 'igads' },
      { date: '2026-10-12', spend: 100, page: 'igads' },
      { date: '2026-10-14', spend: 100, page: 'igads' },
    ],
    {},
  );
  assert.deepEqual(spend, { a: 100, b: 150, c: 50 });
});

test('Ad spend splits by landing page: Ali ad sets fund the rounds Ali promoted', () => {
  const spend = allocateRoundSpend(
    [
      { id: 'morning', first_session_date: '2026-10-20T18:00:00Z', signups: 50 },
      { id: 'evening', first_session_date: '2026-10-19T23:00:00Z', signups: 40 },
    ],
    [
      { date: '2026-10-17', spend: 100, page: 'igads' },
      { date: '2026-10-17', spend: 60, page: 'aliagads' },
      { date: '2026-10-18', spend: 80, page: 'aliagads' },
    ],
    { morning: ['igads'], evening: ['aliagads'] },
  );
  assert.deepEqual(spend, { morning: 100, evening: 140 });
});

test('Ad set names classify into the two landing pages', () => {
  assert.equal(adSetPage('IG Ads - Ali - Broad', 'Webinar'), 'aliagads');
  assert.equal(adSetPage('Generic Canada+USA', 'Webinar leads'), 'igads');
});

test('Acquisition revenue sums orders attributed to the latest round within 14 days', () => {
  const revenue = attributeRevenue(
    [
      { id: 'r1', first_session_date: '2026-10-01T18:00:00Z' },
      { id: 'r2', first_session_date: '2026-10-10T18:00:00Z' },
    ],
    { 'x@a.com': ['r1', 'r2'], 'y@a.com': ['r1'] },
    [
      { email: 'X@a.com', created_at: '2026-10-10T19:00:00Z', amount: 19700, usd_amount: null },
      { email: 'x@a.com', created_at: '2026-10-11T19:00:00Z', amount: 19700, usd_amount: 19700 },
      { email: 'y@a.com', created_at: '2026-10-30T19:00:00Z', amount: 19700, usd_amount: null },
    ],
  );
  assert.deepEqual(revenue, { r2: 394 });
});

test('Acquisition enrollments count unique people per round within 14 days', () => {
  const enrollments = attributeEnrollments(
    [
      { id: 'r1', first_session_date: '2026-10-01T18:00:00Z' },
      { id: 'r2', first_session_date: '2026-10-10T18:00:00Z' },
    ],
    { 'x@a.com': ['r1', 'r2'], 'y@a.com': ['r1'] },
    [
      { email: 'X@a.com', created_at: '2026-10-10T19:00:00Z' },
      { email: 'x@a.com', created_at: '2026-10-11T19:00:00Z' },
      { email: 'y@a.com', created_at: '2026-10-12T19:00:00Z' },
    ],
  );
  assert.deepEqual(enrollments, { r1: 1, r2: 1 });
});
