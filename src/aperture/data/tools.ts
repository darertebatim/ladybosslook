/**
 * Curated catalog of common SMB tools — used by the Tools page so users
 * can flag what they use in one tap. Each entry maps to a memory fact
 * Aperture writes into the most relevant bucket.
 */
export type ApertureToolCategory =
  | "pos"
  | "accounting"
  | "marketing"
  | "ecommerce"
  | "booking"
  | "ops"
  | "comms";

export interface ApertureToolDef {
  slug: string;
  name: string;
  category: ApertureToolCategory;
  /** Bucket slug we write the fact into. */
  bucket_slug: string;
}

export const TOOL_CATEGORIES: { id: ApertureToolCategory; label: string; sub: string }[] = [
  { id: "pos",        label: "Point of sale",   sub: "Cash register, card readers, in-person payments" },
  { id: "accounting", label: "Accounting & money", sub: "Books, invoices, payroll" },
  { id: "marketing",  label: "Marketing & social", sub: "Where you post, send, advertise" },
  { id: "ecommerce",  label: "Online store",    sub: "Selling online" },
  { id: "booking",    label: "Booking & scheduling", sub: "Appointments, reservations" },
  { id: "ops",        label: "Operations",      sub: "Inventory, files, projects" },
  { id: "comms",      label: "Communication",   sub: "Email, messaging, support" },
];

export const TOOL_CATALOG: ApertureToolDef[] = [
  // POS
  { slug: "square",      name: "Square",      category: "pos", bucket_slug: "tools-systems" },
  { slug: "toast",       name: "Toast",       category: "pos", bucket_slug: "tools-systems" },
  { slug: "clover",      name: "Clover",      category: "pos", bucket_slug: "tools-systems" },
  { slug: "stripe-terminal", name: "Stripe Terminal", category: "pos", bucket_slug: "tools-systems" },
  // Accounting
  { slug: "quickbooks",  name: "QuickBooks",  category: "accounting", bucket_slug: "money-finance" },
  { slug: "xero",        name: "Xero",        category: "accounting", bucket_slug: "money-finance" },
  { slug: "wave",        name: "Wave",        category: "accounting", bucket_slug: "money-finance" },
  { slug: "stripe",      name: "Stripe",      category: "accounting", bucket_slug: "money-finance" },
  { slug: "paypal",      name: "PayPal",      category: "accounting", bucket_slug: "money-finance" },
  // Marketing
  { slug: "instagram",   name: "Instagram",   category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "tiktok",      name: "TikTok",      category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "facebook",    name: "Facebook",    category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "youtube",     name: "YouTube",     category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "google-business", name: "Google Business Profile", category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "mailchimp",   name: "Mailchimp",   category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "klaviyo",     name: "Klaviyo",     category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "meta-ads",    name: "Meta Ads",    category: "marketing", bucket_slug: "marketing-visibility" },
  { slug: "google-ads",  name: "Google Ads",  category: "marketing", bucket_slug: "marketing-visibility" },
  // E-commerce
  { slug: "shopify",     name: "Shopify",     category: "ecommerce", bucket_slug: "sales-conversion" },
  { slug: "etsy",        name: "Etsy",        category: "ecommerce", bucket_slug: "sales-conversion" },
  { slug: "amazon",      name: "Amazon",      category: "ecommerce", bucket_slug: "sales-conversion" },
  { slug: "woocommerce", name: "WooCommerce", category: "ecommerce", bucket_slug: "sales-conversion" },
  // Booking
  { slug: "calendly",    name: "Calendly",    category: "booking", bucket_slug: "operations" },
  { slug: "acuity",      name: "Acuity",      category: "booking", bucket_slug: "operations" },
  { slug: "opentable",   name: "OpenTable",   category: "booking", bucket_slug: "operations" },
  { slug: "resy",        name: "Resy",        category: "booking", bucket_slug: "operations" },
  // Ops
  { slug: "notion",      name: "Notion",      category: "ops", bucket_slug: "tools-systems" },
  { slug: "google-workspace", name: "Google Workspace", category: "ops", bucket_slug: "tools-systems" },
  { slug: "microsoft-365", name: "Microsoft 365", category: "ops", bucket_slug: "tools-systems" },
  { slug: "dropbox",     name: "Dropbox",     category: "ops", bucket_slug: "tools-systems" },
  { slug: "asana",       name: "Asana",       category: "ops", bucket_slug: "tools-systems" },
  { slug: "trello",      name: "Trello",      category: "ops", bucket_slug: "tools-systems" },
  // Comms
  { slug: "gmail",       name: "Gmail",       category: "comms", bucket_slug: "tools-systems" },
  { slug: "whatsapp-business", name: "WhatsApp Business", category: "comms", bucket_slug: "tools-systems" },
  { slug: "slack",       name: "Slack",       category: "comms", bucket_slug: "tools-systems" },
  { slug: "zoom",        name: "Zoom",        category: "comms", bucket_slug: "tools-systems" },
];

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