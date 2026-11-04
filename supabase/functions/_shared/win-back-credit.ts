// Win-Your-Money-Back credit, stored in credit_transactions:
//  - grant:    transaction_type 'win_back_credit', amount = cents, description = JSON {program_slug, round_id, expires_at}
//  - redeemed: transaction_type 'win_back_redeemed', description = JSON {grant_id, session_id}
// Credit is valid 90 days from issue and is applied once, to a program other than the one it came from.

export const WIN_BACK_GRANT = 'win_back_credit';
export const WIN_BACK_REDEEMED = 'win_back_redeemed';
export const WIN_BACK_INSTALLMENTS = 3;

export interface ActiveWinBackCredit {
  id: string;
  amount: number;
  source_program_slug: string | null;
  expires_at: string;
}

const parse = (s: string | null) => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };

/** All account ids merged with this user (primary + aliases), so credit follows any linked email. */
export async function familyIds(supabase: any, userId: string): Promise<string[]> {
  try {
    const { data } = await supabase.rpc('account_family_ids', { _uid: userId });
    const ids = (data || []).map((r: any) => (typeof r === 'string' ? r : r.account_family_ids)).filter(Boolean);
    return [...new Set([userId, ...ids])];
  } catch {
    return [userId];
  }
}

export async function getWinBackRows(supabase: any, userId: string): Promise<any[]> {
  const ids = await familyIds(supabase, userId);
  const { data } = await supabase
    .from('credit_transactions')
    .select('id, amount, description, created_at, transaction_type')
    .in('user_id', ids)
    .in('transaction_type', [WIN_BACK_GRANT, WIN_BACK_REDEEMED]);
  return (data || []) as any[];
}

export async function getActiveWinBackCredit(
  supabase: any,
  userId: string,
  targetProgramSlug?: string,
): Promise<ActiveWinBackCredit | null> {
  const rows = await getWinBackRows(supabase, userId);
  const redeemed = new Set(
    rows.filter((r) => r.transaction_type === WIN_BACK_REDEEMED).map((r) => parse(r.description).grant_id),
  );
  const now = Date.now();
  const active = rows
    .filter((r) => r.transaction_type === WIN_BACK_GRANT && !redeemed.has(r.id) && r.amount > 0)
    .map((r) => {
      const d = parse(r.description);
      return {
        id: r.id,
        amount: r.amount,
        source_program_slug: d.program_slug ?? null,
        expires_at: d.expires_at || new Date(new Date(r.created_at).getTime() + 90 * 864e5).toISOString(),
      };
    })
    .filter((c) => new Date(c.expires_at).getTime() > now)
    .filter((c) => !targetProgramSlug || c.source_program_slug !== targetProgramSlug)
    .sort((a, b) => b.amount - a.amount);
  return active[0] || null;
}

/** Creates a Stripe coupon for the credit. Monthly plans get the credit split over 3 months. */
export async function createWinBackCoupon(
  stripe: any,
  credit: ActiveWinBackCredit,
  opts: { recurring: boolean; chargeAmount: number },
): Promise<string | null> {
  const perCharge = opts.recurring ? Math.round(credit.amount / WIN_BACK_INSTALLMENTS) : credit.amount;
  const amountOff = Math.min(perCharge, Math.max(0, opts.chargeAmount - 50));
  if (amountOff <= 0) return null;
  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: 'usd',
    name: 'Win-Your-Money-Back Credit',
    ...(opts.recurring
      ? { duration: 'repeating', duration_in_months: WIN_BACK_INSTALLMENTS }
      : { duration: 'once' }),
    max_redemptions: 1,
    metadata: { win_back_credit_id: credit.id },
  });
  return coupon.id;
}
