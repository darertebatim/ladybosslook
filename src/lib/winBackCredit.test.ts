import { describe, it, expect } from 'vitest';
import { creditPerCharge, pickActiveCredit, winBackExpiry, parseWinBackCredits } from './winBackCredit';

describe('win-back credit', () => {
  it('expires exactly 90 days after issue', () => {
    const issued = new Date('2026-11-04T00:00:00Z');
    expect(winBackExpiry(issued)).toBe('2027-02-02T00:00:00.000Z');
  });

  it('applies the full credit on full payment', () => {
    expect(creditPerCharge(19700, false, 94700)).toBe(19700);
  });

  it('splits the credit across 3 monthly payments', () => {
    expect(creditPerCharge(19700, true, 34900)).toBe(6567);
  });

  it('ignores expired and redeemed credits', () => {
    const rows = [
      { id: 'a', amount: 19700, created_at: '2026-01-01', transaction_type: 'win_back_credit', description: JSON.stringify({ expires_at: '2026-04-01T00:00:00Z' }) },
      { id: 'b', amount: 29700, created_at: '2026-11-01', transaction_type: 'win_back_credit', description: JSON.stringify({ expires_at: '2027-01-30T00:00:00Z' }) },
      { id: 'r', amount: 0, created_at: '2026-11-02', transaction_type: 'win_back_redeemed', description: JSON.stringify({ grant_id: 'b' }) },
    ];
    expect(pickActiveCredit(parseWinBackCredits(rows), undefined, Date.parse('2026-11-04'))).toBeNull();
  });

  it('cannot be used on the program it was earned from', () => {
    const rows = [{ id: 'a', amount: 19700, created_at: '2026-11-01', transaction_type: 'win_back_credit', description: JSON.stringify({ program_slug: 'casigads', expires_at: '2027-01-30T00:00:00Z' }) }];
    const credits = parseWinBackCredits(rows);
    expect(pickActiveCredit(credits, 'casigads', Date.parse('2026-11-04'))).toBeNull();
    expect(pickActiveCredit(credits, 'revenue', Date.parse('2026-11-04'))?.id).toBe('a');
  });
});
