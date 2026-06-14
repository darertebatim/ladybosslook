/**
 * Memory buckets — the core mechanic of Aperture.
 *
 * Each bucket holds a category of business information that the AI uses to
 * personalize every conversation. Buckets are filled three ways:
 *   1. User fills directly (questionnaire on the bucket page)
 *   2. AI extracts facts after a chat (mocked in this demo)
 *   3. AI surfaces "gap" questions over time (mocked badge on home)
 *
 * Filled status is derived from how many questions have answers in
 * localStorage (see hooks/useBuckets).
 */

export type BucketSlug =
  | "basics"
  | "customers"
  | "revenue"
  | "marketing"
  | "goals"
  | "challenges";

export interface BucketQuestion {
  id: string;
  label: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}

export interface Bucket {
  slug: BucketSlug;
  index: string;         // "01", "02" ...
  title: string;
  blurb: string;         // short description on the home card
  longBlurb: string;     // shown on the bucket detail page
  glyph: string;         // ascii glyph rendered as a quiet mark
  questions: BucketQuestion[];
  aiSurfaced?: string;   // "AI noticed you haven't told me X yet"
}

export const BUCKETS: Bucket[] = [
  {
    slug: "basics",
    index: "01",
    title: "Business basics",
    blurb: "Who you are, what you sell, where, and how long.",
    longBlurb:
      "The foundation. Without this the AI can't tell a food truck from a law firm.",
    glyph: "◐",
    questions: [
      { id: "name", label: "Business name", placeholder: "e.g. Sara's Bakery" },
      { id: "industry", label: "What kind of business is it?", placeholder: "e.g. neighborhood bakery, online resale, mobile detailing" },
      { id: "location", label: "Where do you operate?", placeholder: "City, neighborhood, or 'online only'" },
      { id: "open_for", label: "How long have you been open?", placeholder: "e.g. 8 months" },
      { id: "team", label: "Who works in the business?", placeholder: "Just me, me + 1 partner, 3 part-time…" },
    ],
  },
  {
    slug: "customers",
    index: "02",
    title: "Customers",
    blurb: "Who buys from you and how they find you.",
    longBlurb:
      "The clearer this gets, the sharper every piece of advice — from pricing to ads.",
    glyph: "◓",
    questions: [
      { id: "who", label: "Who is your typical customer?", placeholder: "Age, lifestyle, why they need you", multiline: true },
      { id: "find_you", label: "How do most customers find you today?", placeholder: "Walk-in, Instagram, word of mouth, Google…" },
      { id: "typical_purchase", label: "What does a typical purchase look like?", placeholder: "e.g. $18 average, single item, one-time" },
      { id: "repeat", label: "Do customers come back? How often?" },
    ],
    aiSurfaced: "You mentioned 'mostly walk-ins' — do you know roughly what % are returning vs new?",
  },
  {
    slug: "revenue",
    index: "03",
    title: "Revenue",
    blurb: "How money comes in and what a typical week looks like.",
    longBlurb:
      "Not for accounting — just enough so the AI can sanity-check ideas against reality.",
    glyph: "◑",
    questions: [
      { id: "streams", label: "How do you make money?", placeholder: "Products, services, subscriptions, mixed…", multiline: true },
      { id: "weekly", label: "What does a typical week in revenue look like?", placeholder: "Range is fine — e.g. $800–$1,400" },
      { id: "best_seller", label: "What's your best seller?" },
      { id: "season", label: "Are there busy or slow seasons?" },
      { id: "pricing", label: "How did you set your prices?", placeholder: "Looked at competitors, guessed, copied a friend…" },
    ],
  },
  {
    slug: "marketing",
    index: "04",
    title: "Marketing",
    blurb: "Instagram, ads, website — what you've tried and what worked.",
    longBlurb:
      "Most owners over-explain what they don't do. Tell me what you actually do, even if it's tiny.",
    glyph: "◒",
    questions: [
      { id: "channels", label: "Where do you show up online?", placeholder: "Instagram, TikTok, Google, none…" },
      { id: "frequency", label: "How often do you post or promote?" },
      { id: "ads", label: "Are you running any paid ads?" },
      { id: "worked", label: "What's worked best so far?", multiline: true },
      { id: "stuck", label: "What feels stuck in your marketing?", multiline: true },
    ],
  },
  {
    slug: "goals",
    index: "05",
    title: "Goals",
    blurb: "Where you want to be in 6 to 12 months.",
    longBlurb:
      "Vague is fine. 'I want it to feel less stressful' is a goal.",
    glyph: "◔",
    questions: [
      { id: "six_months", label: "What would make the next 6 months feel like a win?", multiline: true },
      { id: "revenue_target", label: "Any revenue or income target in mind?" },
      { id: "lifestyle", label: "How do you want your week to feel?" },
    ],
  },
  {
    slug: "challenges",
    index: "06",
    title: "Challenges",
    blurb: "What's stuck right now and what you've already tried.",
    longBlurb:
      "The honest version. The AI works better when it knows what hasn't worked.",
    glyph: "◕",
    questions: [
      { id: "stuck_on", label: "What's the thing you're most stuck on right now?", multiline: true },
      { id: "tried", label: "What have you tried so far?", multiline: true },
      { id: "wish", label: "What do you wish someone would just tell you?", multiline: true },
    ],
  },
];

export function getBucket(slug: string): Bucket | undefined {
  return BUCKETS.find(b => b.slug === slug);
}