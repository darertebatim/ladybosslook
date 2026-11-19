import assert from "node:assert/strict";
import { buildIgFreeNurtureHtml } from "./igfree-nurture-emails.ts";

const base = { name: "Sara", thankYouUrl: "https://ladybosslook.com/l/igfreewebinar/thankyou?x=1", calendarUrl: "https://cal.test", localTime: "Wednesday, November 25, 4:00 PM" };

Deno.test("day-after-signup email lists business types and links WhatsApp + prerequisite video", () => {
  const html = buildIgFreeNurtureHtml({ ...base, kind: "nurture1" });
  assert.ok(html.includes("wa.me/16265028538"));
  assert.ok(html.includes("/l/igfreewebinar/thankyou"));
  assert.ok(html.includes("حسابداران"));
});

Deno.test("day-before email shows local time, no-replay notice and calendar", () => {
  const html = buildIgFreeNurtureHtml({ ...base, kind: "nurture2" });
  assert.ok(html.includes("4:00 PM"));
  assert.ok(html.includes("https://cal.test"));
  assert.ok(html.includes("بازپخش نداره"));
});
