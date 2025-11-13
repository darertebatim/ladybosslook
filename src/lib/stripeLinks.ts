/**
 * Stripe Payment Links Mapping
 * Maps program slugs to their Stripe payment checkout URLs
 */

export const stripePaymentLinks: Record<string, string> = {
  'courageous-character-course': 'https://buy.stripe.com/8x25kC8bL4T87J559n9Ve02',
  'cca-fa': 'https://buy.stripe.com/8x25kC8bL4T87J559n9Ve02',
  // Add more program payment links here as needed
};

/**
 * Get Stripe payment link for a program
 * @param programSlug - The program slug
 * @returns The Stripe payment link with success/cancel URLs, or null if not found
 */
export const getStripePaymentLink = (programSlug: string): string | null => {
  const baseLink = stripePaymentLinks[programSlug];
  
  if (!baseLink) {
    console.error(`No Stripe payment link found for program: ${programSlug}`);
    return null;
  }

  // Add success and cancel URLs
  const successUrl = encodeURIComponent(`${window.location.origin}/payment-success`);
  const cancelUrl = encodeURIComponent(`${window.location.origin}/app/store`);
  
  return `${baseLink}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
};
