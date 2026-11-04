// Mirrors supabase/functions/_shared/win-back-credit.ts (credit stored in credit_transactions).
export const WIN_BACK_GRANT = 'win_back_credit';
export const WIN_BACK_REDEEMED = 'win_back_redeemed';
export const WIN_BACK_VALID_DAYS = 90;
export const WIN_BACK_INSTALLMENTS = 3;

export interface WinBackRow {
  id: string;
  amount: number;
  description: string | null;
  created_at: string;
  transaction_type: string;
}

export interface WinBackCredit {
  id: string;
  amount: number;
  program_slug: string | null;
  round_id: string | null;
  expires_at: string;
  redeemed: boolean;
}

const parse = (s: string | null): any => {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
};

export function winBackExpiry(issuedAt: Date = new Date()): string {
  return new Date(issuedAt.getTime() + WIN_BACK_VALID_DAYS * 86400000).toISOString();
}

export function parseWinBackCredits(rows: WinBackRow[]): WinBackCredit[] {
  const redeemed = new Set(
    rows.filter((r) => r.transaction_type === WIN_BACK_REDEEMED).map((r) => parse(r.description).grant_id),
  );
  return rows
    .filter((r) => r.transaction_type === WIN_BACK_GRANT)
    .map((r) => {
      const d = parse(r.description);
      return {
        id: r.id,
        amount: r.amount,
        program_slug: d.program_slug ?? null,
        round_id: d.round_id ?? null,
        expires_at: d.expires_at || winBackExpiry(new Date(r.created_at)),
        redeemed: redeemed.has(r.id),
      };
    });
}

/** Best unused, unexpired credit usable on targetSlug (never on the program it was earned from). */
export function pickActiveCredit(credits: WinBackCredit[], targetSlug?: string, now = Date.now()): WinBackCredit | null {
  return credits
    .filter((c) => !c.redeemed && c.amount > 0 && new Date(c.expires_at).getTime() > now)
    .filter((c) => !targetSlug || c.program_slug !== targetSlug)
    .sort((a, b) => b.amount - a.amount)[0] ?? null;
}

/** Discount per charge: full credit once, or split over 3 monthly charges. */
export function creditPerCharge(credit: number, recurring: boolean, charge: number): number {
  const per = recurring ? Math.round(credit / WIN_BACK_INSTALLMENTS) : credit;
  return Math.max(0, Math.min(per, charge - 50));
}

export interface PaidOrderRow {
  amount: number | null;
  currency: string | null;
  usd_amount: number | null;
}

/** Currencies priced 1:1 (197 USD = 197 CAD), so credit uses the face value paid. */
export const FACE_VALUE_CURRENCIES = ['usd', 'cad'];
const isFaceValue = (c: string | null) => FACE_VALUE_CURRENCIES.includes((c || 'usd').toLowerCase());

/**
 * Credit in cents = face value paid (197 USD or 197 CAD both give 197).
 * Other currencies count 0 and are flagged for review.
 */
export function paidUsdCents(orders: PaidOrderRow[]): number {
  return orders.reduce((sum, o) => sum + (isFaceValue(o.currency) ? (o.amount ?? 0) : 0), 0);
}

/** True when any order is in a currency outside the 1:1 USD/CAD pricing. */
export function hasUnconvertedForeignPayment(orders: PaidOrderRow[]): boolean {
  return orders.some((o) => !isFaceValue(o.currency));
}
