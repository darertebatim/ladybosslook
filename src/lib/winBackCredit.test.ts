import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { creditPerCharge, pickActiveCredit, winBackExpiry, parseWinBackCredits, paidUsdCents, hasUnconvertedForeignPayment } from './winBackCredit';

test('expires exactly 90 days after issue', () => {
  assert.equal(winBackExpiry(new Date('2026-11-04T00:00:00Z')), '2027-02-02T00:00:00.000Z');
});

test('applies the full credit on full payment', () => {
  assert.equal(creditPerCharge(19700, false, 94700), 19700);
});

test('splits the credit across 3 monthly payments', () => {
  assert.equal(creditPerCharge(19700, true, 34900), 6567);
});

test('ignores expired and redeemed credits', () => {
  const rows = [
    { id: 'a', amount: 19700, created_at: '2026-01-01', transaction_type: 'win_back_credit', description: JSON.stringify({ expires_at: '2026-04-01T00:00:00Z' }) },
    { id: 'b', amount: 29700, created_at: '2026-11-01', transaction_type: 'win_back_credit', description: JSON.stringify({ expires_at: '2027-01-30T00:00:00Z' }) },
    { id: 'r', amount: 0, created_at: '2026-11-02', transaction_type: 'win_back_redeemed', description: JSON.stringify({ grant_id: 'b' }) },
  ];
  assert.equal(pickActiveCredit(parseWinBackCredits(rows), undefined, Date.parse('2026-11-04')), null);
});

test('cannot be used on the program it was earned from', () => {
  const rows = [{ id: 'a', amount: 19700, created_at: '2026-11-01', transaction_type: 'win_back_credit', description: JSON.stringify({ program_slug: 'casigads', expires_at: '2027-01-30T00:00:00Z' }) }];
  const credits = parseWinBackCredits(rows);
  assert.equal(pickActiveCredit(credits, 'casigads', Date.parse('2026-11-04')), null);
  assert.equal(pickActiveCredit(credits, 'revenue', Date.parse('2026-11-04'))?.id, 'a');
});

test('CAD payments credit the face value paid (297 CAD gives 297), not the bank conversion', () => {
  const orders = [
    { amount: 29700, currency: 'cad', usd_amount: 20900 },
    { amount: 19700, currency: 'usd', usd_amount: null },
  ];
  assert.equal(paidUsdCents(orders), 49400);
  assert.equal(hasUnconvertedForeignPayment(orders), false);
});

test('currencies outside USD/CAD are never credited and are flagged', () => {
  const orders = [{ amount: 39700, currency: 'eur', usd_amount: null }];
  assert.equal(paidUsdCents(orders), 0);
  assert.equal(hasUnconvertedForeignPayment(orders), true);
});

test('Revenue full pay after 197 credit is 750; after 297 is 650', () => {
  assert.equal(94700 - creditPerCharge(19700, false, 94700), 75000);
  assert.equal(94700 - creditPerCharge(29700, false, 94700), 65000);
});

test('Revenue monthly 399 splits credit over 3 months', () => {
  assert.equal(creditPerCharge(19700, true, 39900), 6567);
  assert.equal(creditPerCharge(29700, true, 39900), 9900);
});

test('4-month $299 plan splits credit over 4 charges', () => {
  assert.equal(29900 - creditPerCharge(19700, true, 29900, 4), 24975);
  assert.equal(29900 - creditPerCharge(29700, true, 29900, 4), 22475);
});
