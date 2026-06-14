/**
 * Playbooks & quick prompts — the "what to work on" library.
 *
 * In the real product these are surfaced contextually by the AI based on what's
 * in the user's memory buckets. In the demo, we tag each one with the buckets
 * it draws from + a stage hint, and the home page filters to the most relevant.
 */

import type { BucketSlug } from "./buckets";

export type ActionKind = "playbook" | "prompt";
export type ActionCategory =
  | "Marketing"
  | "Sales"
  | "Pricing"
  | "Customers"
  | "Operations"
  | "Mindset";

export interface PlaybookStep {
  prompt: string;          // AI's question to the user
  exampleAnswer?: string;  // example to make demo readable
}

export interface ApertureAction {
  slug: string;
  kind: ActionKind;
  category: ActionCategory;
  title: string;
  blurb: string;           // 1-line description
  why: string;             // why we're suggesting this (personalized voice)
  duration: string;        // e.g. "2 min" or "10 min"
  needs: BucketSlug[];     // buckets it pulls from
  steps?: PlaybookStep[];  // for playbooks
  output?: string;         // for quick prompts — sample output preview
}

export const ACTIONS: ApertureAction[] = [
  {
    slug: "why-repeat-customers-arent-coming-back",
    kind: "playbook",
    category: "Customers",
    title: "Why aren't your repeat customers coming back?",
    blurb: "Walk through what you know about returners and find one fix to test this week.",
    why: "You said most sales are walk-ins with low repeat rate — this is usually the cheapest growth lever for a bakery in month 8.",
    duration: "8 min",
    needs: ["basics", "customers", "revenue"],
    steps: [
      { prompt: "Roughly what % of last month's sales were repeat customers?", exampleAnswer: "Maybe 15–20%, hard to say." },
      { prompt: "When someone buys for the first time, what (if anything) do you do to bring them back?", exampleAnswer: "Nothing really — they pay and leave." },
      { prompt: "What do your best returning customers have in common?", exampleAnswer: "They live nearby and come on weekends." },
      { prompt: "If you could only do ONE thing this week to bring a first-timer back, what feels easiest?", exampleAnswer: "A little card with a code maybe." },
    ],
  },
  {
    slug: "pricing-sanity-check",
    kind: "playbook",
    category: "Pricing",
    title: "Are you pricing your products correctly?",
    blurb: "A quick pressure-test on whether your top sellers are leaving money on the table.",
    why: "You set prices by looking at competitors. That's a common trap when your costs and audience are different.",
    duration: "10 min",
    needs: ["basics", "revenue", "customers"],
    steps: [
      { prompt: "What's your single best-selling item, and what do you charge for it?" },
      { prompt: "What does it cost you to make / deliver one (rough number is fine)?" },
      { prompt: "When customers buy it, do they ever flinch at the price, or accept it instantly?" },
      { prompt: "If you raised it by $1, what's the worst that could happen?" },
    ],
  },
  {
    slug: "first-instagram-month",
    kind: "playbook",
    category: "Marketing",
    title: "Plan your first real month on Instagram",
    blurb: "Three posts a week, no overthinking, built around what you actually sell.",
    why: "Marketing bucket is mostly empty and you said it 'feels stuck'. Let's start with the smallest possible plan.",
    duration: "12 min",
    needs: ["basics", "marketing"],
    steps: [
      { prompt: "What are the 3 things you'd most want a stranger to know about your business?" },
      { prompt: "Pick one type of post you can commit to: behind-the-scenes, customer reactions, or product close-ups." },
      { prompt: "Best time of week for you to spend 20 minutes filming?" },
    ],
  },
  {
    slug: "fix-a-slow-week",
    kind: "playbook",
    category: "Sales",
    title: "Fix a slow week",
    blurb: "Something to actually do — not generic 'post more' advice.",
    why: "You mentioned this week is slower than usual. Let's find the 1 lever you can pull in 48 hours.",
    duration: "6 min",
    needs: ["basics", "customers", "revenue"],
    steps: [
      { prompt: "How slow are we talking — 20% down, half, almost zero?" },
      { prompt: "Anything different about this week (weather, holiday, you doing less)?" },
      { prompt: "Who are the 5 people most likely to buy from you in the next 3 days?" },
    ],
  },
  {
    slug: "instagram-caption",
    kind: "prompt",
    category: "Marketing",
    title: "Write an Instagram caption",
    blurb: "A caption for your next post, in your voice — not corporate-AI tone.",
    why: "You post once a week. Captions are usually the bottleneck.",
    duration: "1 min",
    needs: ["basics", "marketing", "customers"],
    output:
      "Quiet Saturday morning at the bakery. The cardamom buns just came out — they always sell out by 11. If you're in the neighborhood, you know what to do. 🥐",
  },
  {
    slug: "follow-up-message",
    kind: "prompt",
    category: "Customers",
    title: "Draft a follow-up to a quiet customer",
    blurb: "A short, warm DM to someone who used to buy and stopped.",
    why: "Most owners feel weird sending these. The AI can write the version you'd actually send.",
    duration: "1 min",
    needs: ["basics", "customers"],
    output:
      "Hi Mariam! Realized I haven't seen you in a few weeks — hope everything's good. We have a new orange cake starting tomorrow, thought of you. No pressure, just wanted to say hi.",
  },
  {
    slug: "weekly-priorities",
    kind: "prompt",
    category: "Mindset",
    title: "What should I focus on this week?",
    blurb: "Three priorities based on everything I know about your business right now.",
    why: "The 'where do I even start' question, but answered specifically for you.",
    duration: "1 min",
    needs: ["basics", "goals", "challenges"],
    output:
      "1. Ship one Instagram post about the cardamom buns (your proven seller). 2. Send 5 follow-up DMs to quiet repeat customers. 3. Decide if you're raising the bun price to $5 — your cost math says yes.",
  },
  {
    slug: "raise-prices-script",
    kind: "prompt",
    category: "Pricing",
    title: "Tell customers you're raising prices",
    blurb: "A short, confident note that doesn't apologize.",
    why: "You said you've been wanting to raise prices for 3 months but freeze up.",
    duration: "2 min",
    needs: ["basics", "customers"],
    output:
      "Small heads-up: starting next Monday, our cardamom buns are going up to $5. Costs went up, and I want to keep using the good butter. Thanks for understanding — it means I get to keep doing this.",
  },
];

export function getAction(slug: string): ApertureAction | undefined {
  return ACTIONS.find(a => a.slug === slug);
}