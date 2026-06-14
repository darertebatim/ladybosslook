export interface MemoryFact {
  label: string;
  value: string;
  source: string; // integration slug
  trend?: "up" | "down" | "flat";
  delta?: string;
}

export interface MemoryDoc {
  title: string;
  kind: "PDF" | "Doc" | "Note";
  size: string;
  uploaded: string;
}

export const MEMORY_FACTS: MemoryFact[] = [
  { label: "MRR",              value: "$42,100",  source: "stripe",     trend: "up",   delta: "+6.2% MoM" },
  { label: "Active customers", value: "1,284",    source: "stripe",     trend: "up",   delta: "+38 wk" },
  { label: "Top SKU",          value: "Linen Throw · Sage", source: "shopify" },
  { label: "Lapsed VIPs",      value: "14",       source: "shopify",    trend: "up",   delta: "+3 wk" },
  { label: "IG followers",     value: "8,420",    source: "instagram",  trend: "up",   delta: "+312 / 7d" },
  { label: "Cash on hand",     value: "$812,000", source: "quickbooks", trend: "flat" },
  { label: "Runway",           value: "18 months", source: "quickbooks" },
  { label: "Refund rate",      value: "1.4%",     source: "stripe",     trend: "flat" },
];

export const MEMORY_DOCS: MemoryDoc[] = [
  { title: "Brand voice guide",        kind: "PDF",  size: "1.2 MB", uploaded: "12d ago" },
  { title: "FY26 plan",                kind: "Doc",  size: "84 KB",  uploaded: "1mo ago" },
  { title: "Founder weekly journal",   kind: "Note", size: "—",      uploaded: "Live" },
];

export const BUSINESS_PROFILE = {
  name: "Maven & Co.",
  tagline: "Heritage textiles, made in small batches.",
  founded: "2022",
  team: "6 people",
  stage: "Post-seed",
};