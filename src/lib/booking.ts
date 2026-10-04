// Builds a Calendly link with the student's details pre-filled and a Rilo tracking tag
// so bookings sync back to the right program and account.
export function buildBookingUrl(
  url: string,
  name?: string | null,
  email?: string | null,
  programSlug?: string | null,
  userId?: string | null,
): string {
  try {
    const u = new URL(url);
    if (name) u.searchParams.set('name', name);
    if (email) u.searchParams.set('email', email);
    if (programSlug) {
      u.searchParams.set('utm_campaign', 'rilo');
      u.searchParams.set('utm_content', programSlug);
    }
    if (userId) u.searchParams.set('utm_term', userId);
    return u.toString();
  } catch {
    return url;
  }
}
