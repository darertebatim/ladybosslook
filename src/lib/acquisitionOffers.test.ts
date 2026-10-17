import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { acquisitionOffer, resolveCartOffer, priceMatchesOffer } from '../../supabase/functions/_shared/acquisition-offers';

const presets = [
  { id: '19f39c6d-da41-4cc8-8002-af5ecae863f2', price_amount: 29700, stripe_price_id: 'price_standard' },
  { id: 'da436117-28ff-406b-8f5d-c5d67328792b', price_amount: 49700, stripe_price_id: 'price_vip' },
  { id: '4fc42a09-243d-4385-8560-89dbaee6994b', price_amount: 19700, stripe_price_id: 'price_early' },
];
test('Standard resolves the $297 catalog price', () => {
  assert.equal(acquisitionOffer('casigads', presets, 'standard')?.amount, 29700);
});
test('VIP resolves the $497 catalog price', () => {
  assert.equal(acquisitionOffer('casigads', presets, 'vip')?.amount, 49700);
});
test('early checkout retains the $197 offer', () => {
  assert.equal(resolveCartOffer('casigads', presets, 'offer:early')?.amount, 19700);
  assert.equal(resolveCartOffer('casigads', presets, 'offer:early')?.stripePriceId, 'price_early');
});
test('unsupported offers and other programs cannot use Acquisition prices', () => {
  assert.throws(() => resolveCartOffer('other', presets, 'offer:early'));
  assert.throws(() => resolveCartOffer('casigads', presets, 'offer:custom'));
  assert.throws(() => resolveCartOffer('casigads', [], 'offer:early'));
  assert.equal(resolveCartOffer('other', presets, 'monthly'), null);
});
test('checkout rejects mismatched, inactive, recurring or non-USD Stripe prices', () => {
  const offer = resolveCartOffer('casigads', presets, 'offer:early');
  assert.ok(offer);
  const price = { active: true, recurring: null, currency: 'usd', unit_amount: 19700 };
  assert.equal(priceMatchesOffer(price, offer), true);
  for (const override of [{ unit_amount: 49700 }, { active: false }, { recurring: {} }, { currency: 'cad' }]) {
    assert.equal(priceMatchesOffer({ ...price, ...override }, offer), false);
  }
});