export interface PlaybookStep {
  label: string;
  detail: string;
}

export interface Playbook {
  slug: string;
  index: string;             // "01", "02" — mono label
  title: string;
  summary: string;
  category: "Revenue" | "Marketing" | "Operations" | "Customer";
  sources: string[];         // integration slugs
  cadence: "Daily" | "Weekly" | "Monthly" | "On demand";
  lastRun?: string;          // "2h ago"
  suggested?: boolean;
  steps: PlaybookStep[];
  /** Pre-rendered draft output, used by the run view. */
  output: {
    headline: string;
    body: string;
    bullets?: string[];
  };
}

export const PLAYBOOKS: Playbook[] = [
  {
    slug: "weekly-revenue-digest",
    index: "01",
    title: "Weekly revenue digest",
    summary: "A founder-readable summary of revenue, plan mix, and refunds — every Monday at 7am.",
    category: "Revenue",
    sources: ["stripe", "quickbooks"],
    cadence: "Weekly",
    lastRun: "2h ago",
    suggested: true,
    steps: [
      { label: "Pull", detail: "Stripe charges + refunds for the last 7 days." },
      { label: "Reconcile", detail: "Match against QuickBooks deposits and flag deltas." },
      { label: "Compare", detail: "Week over week, plan over plan." },
      { label: "Draft", detail: "Write the founder digest in Aperture voice." },
    ],
    output: {
      headline: "Net revenue up 12% week over week.",
      body: "Net revenue this week is $48,210 — up 12% from last week. Pro plan drove $31,400 (+18%). 3 lapsed customers reactivated. Refund volume held flat at 1.4%.",
      bullets: [
        "Pro plan: $31,400 (+18%)",
        "Starter: $9,820 (+4%)",
        "Team: $6,990 (-2%)",
        "Refunds: 1.4% (flat)",
      ],
    },
  },
  {
    slug: "lapsed-customer-list",
    index: "02",
    title: "Lapsed customer list",
    summary: "Customers who used to buy weekly and haven't ordered in 21+ days, with a suggested win-back offer.",
    category: "Customer",
    sources: ["shopify", "stripe"],
    cadence: "Weekly",
    lastRun: "1d ago",
    steps: [
      { label: "Define", detail: "Customers with ≥4 orders in the last 90 days." },
      { label: "Find", detail: "No order in the last 21 days." },
      { label: "Score", detail: "Rank by lifetime value." },
      { label: "Draft", detail: "Personalized win-back email per cohort." },
    ],
    output: {
      headline: "14 lapsed VIPs — $4,180 LTV at risk.",
      body: "14 customers fit the lapsed-VIP profile. Top 3 alone account for $1,920 in lifetime value. Draft email proposes a 15% return offer with a 7-day window.",
    },
  },
  {
    slug: "instagram-post-from-data",
    index: "03",
    title: "Instagram post from this week's data",
    summary: "Turn the week's best business moment into a ready-to-post Instagram caption + image brief.",
    category: "Marketing",
    sources: ["stripe", "instagram", "shopify"],
    cadence: "Weekly",
    lastRun: "3d ago",
    suggested: true,
    steps: [
      { label: "Scan", detail: "Find this week's standout moment (top SKU, milestone, review)." },
      { label: "Frame", detail: "Pick the angle that resonates with your audience." },
      { label: "Draft", detail: "Caption + 3 hooks + image brief, in your brand voice." },
    ],
    output: {
      headline: "Top SKU hit 500 lifetime orders — story-worthy.",
      body: '"Five hundred. That\'s how many of you have made the Linen Throw part of your home." Caption ready. 3 hook variants. Image brief: flat-lay, natural light, kraft tag.',
    },
  },
  {
    slug: "daily-ops-pulse",
    index: "04",
    title: "Daily ops pulse",
    summary: "Inventory at risk, fulfillment delays, payment failures — surfaced before they become problems.",
    category: "Operations",
    sources: ["shopify", "stripe", "square"],
    cadence: "Daily",
    lastRun: "4h ago",
    steps: [
      { label: "Inventory", detail: "Flag SKUs with <7 days of cover." },
      { label: "Fulfillment", detail: "Orders unshipped >48h." },
      { label: "Payments", detail: "Failed charges + dunning status." },
    ],
    output: {
      headline: "2 SKUs under reorder threshold.",
      body: "Linen Throw (Sage) and Brass Hook Set are below your 7-day cover threshold. 3 orders sit unshipped past 48h. 1 payment failed — retry scheduled.",
    },
  },
  {
    slug: "monthly-board-update",
    index: "05",
    title: "Monthly board update",
    summary: "MRR, churn, cash position, top wins, and asks — formatted for your investors.",
    category: "Revenue",
    sources: ["stripe", "quickbooks"],
    cadence: "Monthly",
    lastRun: "12d ago",
    steps: [
      { label: "MRR", detail: "New, expansion, contraction, churn." },
      { label: "Cash", detail: "Runway at current burn." },
      { label: "Narrative", detail: "Three wins, one ask, one concern." },
    ],
    output: {
      headline: "MRR $42.1k · 18 months runway.",
      body: "MRR closed at $42,100 (+6.2% MoM). Net new $3,400. Churn 1.8%. Cash $812k, 18 months runway at current burn. Wins: Pro plan attach rate, new B2B logo. Ask: warm intros to operations leads at 50-500 person DTC brands.",
    },
  },
  {
    slug: "ads-spend-vs-revenue",
    index: "06",
    title: "Ads spend vs revenue",
    summary: "Did this week's ad spend actually drive revenue? With per-campaign ROAS and a recommendation.",
    category: "Marketing",
    sources: ["meta-ads", "stripe", "ga4"],
    cadence: "Weekly",
    lastRun: "5d ago",
    steps: [
      { label: "Spend", detail: "Meta + Google spend by campaign." },
      { label: "Attribute", detail: "Match against Stripe revenue + GA4 sessions." },
      { label: "Recommend", detail: "Cut, hold, or scale per campaign." },
    ],
    output: {
      headline: "ROAS 3.1x overall — one campaign to cut.",
      body: "Total spend $1,840 drove $5,710 in attributable revenue. 'Spring Linen' is at 4.8x — scale 25%. 'Brand Awareness' is at 0.6x — pause.",
    },
  },
];

export function getPlaybook(slug: string) {
  return PLAYBOOKS.find(p => p.slug === slug);
}