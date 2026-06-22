import type { BucketScore } from "./pickFallbackBucket";

/**
 * Entry-point-aware opener composer. The brief calls for three distinct
 * openers so the user can tell "this builds my profile" from "this is
 * just a chat with Aperture":
 *
 *   A. memory_general    → frames as profile-building, bucket chips
 *   B. bucket_specific   → references bucket + most recent confirmed
 *                          fact, or falls back to designed opening Q
 *   C. general_chat      → static neutral opener (handled in the hook)
 *
 * Composed client-side from already-loaded data so creating a chat is
 * still one round trip.
 */

export interface RecentFact {
  content: string;
  source: string;
}

export function composeMemoryGeneralOpener(
  pickedBucket: { title: string },
  topRanked: BucketScore[],
): string {
  // Chip set = the same top-N from the §4 scorer. Each chip's label IS
  // the user's reply text — tapping "Money & Finance" tells the AI which
  // bucket the user wants to dig into next.
  const chips = topRanked.slice(0, 4).map(b => b.title);
  if (!chips.includes(pickedBucket.title)) chips.unshift(pickedBucket.title);
  const uniqueChips = Array.from(new Set(chips)).slice(0, 5);
  const chipBlock = [
    "[OPTIONS]",
    ...uniqueChips.map(c => `- ${c}`),
    "- Something else",
    "[/OPTIONS]",
  ].join("\n");

  const body =
    `Let's fill in a bit more about your business. I was thinking we could ` +
    `look at **${pickedBucket.title}** next — but what's been on your mind?`;

  return `${body}\n\n${chipBlock}`;
}

export function composeBucketSpecificOpener(
  bucket: { title: string },
  /** Most recent active fact with source = user_confirmed | chat_extracted | ai_extracted | bucket_answer.
   *  Guesses (ai_inferred_pre_onboarding) are excluded — we never quote an
   *  unconfirmed guess back as if the user said it. */
  recentConfirmedFact: RecentFact | null,
  /** Fallback when no confirmed facts exist yet — the bucket's first
   *  designed question prompt (lowest sort_order). */
  designedOpeningQuestion: string | null,
): string {
  if (recentConfirmedFact) {
    const snippet = recentConfirmedFact.content.trim().slice(0, 160);
    return (
      `Let's go deeper on **${bucket.title}**.\n\n` +
      `Last time you mentioned "${snippet}". ` +
      `What's changed there, or what's on your mind about it now?`
    );
  }
  if (designedOpeningQuestion) {
    return (
      `Let's open up **${bucket.title}**.\n\n${designedOpeningQuestion}`
    );
  }
  return (
    `Let's open up **${bucket.title}**. Tell me whatever feels most ` +
    `useful — I'll pull the right thread from there.`
  );
}