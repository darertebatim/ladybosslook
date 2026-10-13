/** Wraps a Google Calendar URL in our tracking redirect (internal stats only). */
export function trackedCalUrl(
  gcalUrl: string,
  page: string,
  roundId?: string | null,
  email?: string | null,
): string {
  if (!gcalUrl) return gcalUrl;
  const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-click`;
  const p = new URLSearchParams({ to: gcalUrl, p: page.slice(0, 40) });
  if (roundId) p.set("r", roundId);
  if (email) p.set("e", email);
  return `${base}?${p.toString()}`;
}
