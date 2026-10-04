/** Builds a Calendly booking URL with the buyer's name and email pre-filled. */
export function buildBookingUrl(url: string, name?: string | null, email?: string | null): string {
  try {
    const u = new URL(url);
    if (name) u.searchParams.set('name', name);
    if (email) u.searchParams.set('email', email);
    return u.toString();
  } catch {
    return url;
  }
}
