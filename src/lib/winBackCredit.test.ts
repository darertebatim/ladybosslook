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
