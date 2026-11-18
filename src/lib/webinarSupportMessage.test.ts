import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildWebinarSupportMessage, buildWebinarThankYouUrl } from "./webinarSupportMessage";

test("thank-you link preserves the registrant's exact round and email", () => {
  assert.equal(
    buildWebinarThankYouUrl("/l/igfreewebinar", "round-123", "ali@example.com"),
    "https://ladybosslook.com/l/igfreewebinar/thankyou?round=round-123&email=ali%40example.com",
  );
});

test("WhatsApp message includes identity, round, both session times, and thank-you link", () => {
  const message = buildWebinarSupportMessage({
    title: "وبینار رایگان افزایش مشتری ۲۰۲۷",
    name: "Ali",
    email: "ali@example.com",
    roundNumber: 2,
    roundName: "Evening",
    localDateTime: "4:00 PM, Wednesday\n(America/Vancouver), November 18, 2026",
    losAngelesDateTime: "Wed, Nov 18, 2026, 4:00 PM PT",
    thankYouUrl: "https://ladybosslook.com/l/igfreewebinar/thankyou?round=round-123&email=ali%40example.com",
  });

  assert.match(message, /نام: Ali/);
  assert.match(message, /ایمیل: ali@example\.com/);
  assert.doesNotMatch(message, /شهر:/);
  assert.match(message, /دور: 2 — Evening/);
  assert.match(message, /زمان جلسه به وقت من: 4:00 PM, Wednesday — \(America\/Vancouver\), November 18, 2026/);
  assert.match(message, /زمان جلسه به وقت لس‌آنجلس: Wed, Nov 18, 2026, 4:00 PM PT/);
  assert.ok(message.includes("https://ladybosslook.com/l/igfreewebinar/thankyou?round=round-123&email=ali%40example.com"));
});
