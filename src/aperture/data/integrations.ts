export type IntegrationStatus = "live" | "syncing" | "off" | "beta" | "soon";

export interface Integration {
  slug: string;
  name: string;
  category: "Payments" | "Commerce" | "Social" | "CRM" | "Analytics" | "Accounting" | "Ads";
  color: string;
  status: IntegrationStatus;
  /** Headline metric Aperture surfaces from this source. */
  signal?: string;
  /** Last sync, expressed as "Nm ago" / "Nh ago". */
  lastSync?: string;
}

export const INTEGRATIONS: Integration[] = [
  { slug: "stripe",      name: "Stripe",      category: "Payments",   color: "#635BFF", status: "live",    signal: "$48,210 net this wk",      lastSync: "2m ago" },
  { slug: "square",      name: "Square",      category: "Payments",   color: "#3B6CF6", status: "live",    signal: "184 in-person sales",      lastSync: "4m ago" },
  { slug: "shopify",     name: "Shopify",     category: "Commerce",   color: "#95BF47", status: "live",    signal: "62 orders today",          lastSync: "1m ago" },
  { slug: "quickbooks",  name: "QuickBooks",  category: "Accounting", color: "#2CA01C", status: "live",    signal: "Books reconciled",         lastSync: "8m ago" },
  { slug: "instagram",   name: "Instagram",   category: "Social",     color: "#E1306C", status: "live",    signal: "+312 followers · 7d",      lastSync: "12m ago" },
  { slug: "ga4",         name: "GA4",         category: "Analytics",  color: "#F9AB00", status: "live",    signal: "2.1k sessions today",      lastSync: "3m ago" },
  { slug: "salesforce",  name: "Salesforce",  category: "CRM",        color: "#00A1E0", status: "syncing", signal: "Backfilling 14 days",      lastSync: "syncing" },
  { slug: "hubspot",     name: "HubSpot",     category: "CRM",        color: "#FF7A59", status: "off",     signal: "Not connected",            lastSync: "—" },
  { slug: "meta-ads",    name: "Meta Ads",    category: "Ads",        color: "#1877F2", status: "beta",    signal: "$1,840 spend · 7d",        lastSync: "9m ago" },
];

export function getIntegration(slug: string) {
  return INTEGRATIONS.find(i => i.slug === slug);
}