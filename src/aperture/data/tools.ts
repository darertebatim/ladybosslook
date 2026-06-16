/**
 * Display order & metadata for category groups in the Tools picker.
 * Tool rows themselves live in the `aperture_tools` DB table — each tool
 * is tagged with one or more of these category labels.
 */
export interface ApertureToolCategoryGroup {
  label: string;
  sub: string;
  bucket_slug: string;
}

export const TOOL_CATEGORY_GROUPS: ApertureToolCategoryGroup[] = [
  { label: "Accounting",          sub: "Books, invoices, payroll",                    bucket_slug: "money-finance" },
  { label: "Payments",            sub: "How customers pay you",                       bucket_slug: "money-finance" },
  { label: "E-commerce",          sub: "Selling online",                              bucket_slug: "sales-conversion" },
  { label: "Marketing & Social",  sub: "Where you post, send, advertise",             bucket_slug: "marketing-visibility" },
  { label: "Email & CRM",         sub: "Lists, sequences, customer data",             bucket_slug: "marketing-visibility" },
  { label: "Scheduling",          sub: "Appointments, reservations",                  bucket_slug: "tools-systems" },
  { label: "Communication",       sub: "How you talk to customers and team",          bucket_slug: "tools-systems" },
  { label: "Productivity",        sub: "Docs, files, projects, meetings",             bucket_slug: "tools-systems" },
  { label: "HR & People",         sub: "Payroll, hiring, team",                       bucket_slug: "tools-systems" },
  { label: "AI",                  sub: "Tools using AI in your workflow",             bucket_slug: "tools-systems" },
  { label: "Design",              sub: "Visuals, branding, video",                    bucket_slug: "tools-systems" },
  { label: "Website & Domain",    sub: "Where your site lives",                       bucket_slug: "tools-systems" },
  { label: "Industry-specific",   sub: "Specialty tools for your line of work",       bucket_slug: "tools-systems" },
];

export function bucketForCategory(category: string): string {
  return TOOL_CATEGORY_GROUPS.find((g) => g.label === category)?.bucket_slug ?? "tools-systems";
}

/** Future live integrations — surface only, not wired yet. */
export interface ApertureIntegrationDef {
  slug: string;
  name: string;
  blurb: string;
}

export const INTEGRATIONS: ApertureIntegrationDef[] = [
  { slug: "instagram",       name: "Instagram",            blurb: "Posts, reels, engagement, follower growth" },
  { slug: "google-business", name: "Google Business Profile", blurb: "Searches, calls, direction requests, reviews" },
  { slug: "shopify",         name: "Shopify",              blurb: "Orders, top products, conversion, abandoned carts" },
  { slug: "square",          name: "Square",               blurb: "Sales by item, hour-of-day, repeat customers" },
  { slug: "stripe",          name: "Stripe",               blurb: "MRR, churn, payouts, refunds" },
  { slug: "quickbooks",      name: "QuickBooks",           blurb: "Revenue, expenses, profit, cash on hand" },
  { slug: "calendly",        name: "Calendly",             blurb: "Bookings, no-shows, busiest slots" },
  { slug: "gmail",           name: "Gmail",                blurb: "Customer threads, response time, repeat asks" },
];