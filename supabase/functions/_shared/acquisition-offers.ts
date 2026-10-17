export type AcquisitionOfferKey = 'standard' | 'vip' | 'early';

// Stable catalog preset IDs let administrators change amounts/Stripe prices together.
const PRESET_IDS: Record<AcquisitionOfferKey, string> = {
  standard: '19f39c6d-da41-4cc8-8002-af5ecae863f2',
  vip: 'da436117-28ff-406b-8f5d-c5d67328792b',
  early: '4fc42a09-243d-4385-8560-89dbaee6994b',
};

export interface AcquisitionOffer {
  key: AcquisitionOfferKey;
  amount: number;
  stripePriceId: string;
}

export function acquisitionOffer(slug: string, presets: unknown, key: AcquisitionOfferKey): AcquisitionOffer | null {
  if (slug !== 'casigads' || !Array.isArray(presets)) return null;
  const preset = presets.find((p) => p?.id === PRESET_IDS[key]);
  if (!preset || !Number.isSafeInteger(preset.price_amount) || preset.price_amount <= 0
    || typeof preset.stripe_price_id !== 'string' || !preset.stripe_price_id.startsWith('price_')) return null;
  return { key, amount: preset.price_amount, stripePriceId: preset.stripe_price_id };
}

export function resolveCartOffer(slug: string, presets: unknown, option: unknown): AcquisitionOffer | null {
  if (typeof option !== 'string' || !option.startsWith('offer:')) return null;
  const key = option.slice(6);
  if (key !== 'standard' && key !== 'vip' && key !== 'early') throw new Error('Invalid purchase offer');
  const offer = acquisitionOffer(slug, presets, key);
  if (!offer) throw new Error('This purchase offer is unavailable. Please select it again.');
  return offer;
}

export function offerLabel(key: AcquisitionOfferKey): string {
  return key === 'vip' ? 'VIP — Profile Analysis' : key === 'early' ? 'Standard — Early Bird' : 'Standard';
}

export function priceMatchesOffer(price: { active: boolean; recurring?: unknown; currency: string; unit_amount: number | null }, offer: AcquisitionOffer): boolean {
  return price.active && !price.recurring && price.currency === 'usd' && price.unit_amount === offer.amount;
}