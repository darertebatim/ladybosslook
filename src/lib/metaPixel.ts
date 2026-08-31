// Meta Pixel conversion event helpers.
// The base pixel is initialized in index.html; route PageViews in MetaPixelTracker.tsx.

type PixelParams = Record<string, any>;

function fire(event: string, params?: PixelParams, eventID?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    const fbq = window.fbq as (...args: any[]) => void;
    if (eventID) fbq("track", event, params, { eventID });
    else fbq("track", event, params);
  } catch {
    // no-op
  }
}

function fireCustom(event: string, params?: PixelParams, eventID?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    const fbq = window.fbq as (...args: any[]) => void;
    if (eventID) fbq("trackCustom", event, params, { eventID });
    else fbq("trackCustom", event, params);
  } catch {
    // no-op
  }
}

/** Custom per-webinar lead events for Meta Ads optimization (e.g. "IGAdsFreeLead"). */
export function trackCustomLead(event: string, params?: PixelParams, eventID?: string) {
  fireCustom(event, params, eventID);
}

/** Top-of-funnel interest (email captured, not a full registration). */
export function trackLead(params?: PixelParams, eventID?: string) {
  fire("Lead", params, eventID);
}

/** Completed a registration/signup form. */
export function trackCompleteRegistration(params?: PixelParams, eventID?: string) {
  fire("CompleteRegistration", params, eventID);
}

/** Reached a purchase/enrollment. */
export function trackPurchase(params?: PixelParams, eventID?: string) {
  fire("Purchase", params, eventID);
}

/** Started checkout. */
export function trackInitiateCheckout(params?: PixelParams, eventID?: string) {
  fire("InitiateCheckout", params, eventID);
}
