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
    const { data: prof } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
    const email = (prof?.email || '').toLowerCase();
    let { data: hit } = await supabase.from('account_email_aliases').select('primary_user_id')
      .eq('merged_from_user_id', userId).limit(1);
    if (!hit?.length && email) {
      ({ data: hit } = await supabase.from('account_email_aliases').select('primary_user_id').ilike('email', email).limit(1));
    }
    const pid = hit?.[0]?.primary_user_id || userId;
    const { data: rows } = await supabase.from('account_email_aliases').select('merged_from_user_id, email').eq('primary_user_id', pid);
    const ids = new Set<string>([userId, pid]);
    (rows || []).forEach((r: any) => r.merged_from_user_id && ids.add(r.merged_from_user_id));
    const aliasEmails = (rows || []).map((r: any) => (r.email || '').toLowerCase()).filter(Boolean);
    if (aliasEmails.length) {
      const { data: ps } = await supabase.from('profiles').select('id').in('email', aliasEmails);
      (ps || []).forEach((p: any) => ids.add(p.id));
    }
    return [...ids];
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

/** Creates a Stripe coupon for the credit. Monthly plans get the credit split over the plan's installments. */
export async function createWinBackCoupon(
  stripe: any,
  credit: ActiveWinBackCredit,
  opts: { recurring: boolean; chargeAmount: number; installments?: number },
): Promise<string | null> {
  const months = Math.max(1, opts.installments || WIN_BACK_INSTALLMENTS);
  const perCharge = opts.recurring ? Math.round(credit.amount / months) : credit.amount;
  const amountOff = Math.min(perCharge, Math.max(0, opts.chargeAmount - 50));
  if (amountOff <= 0) return null;
  // USD and CAD are priced 1:1, so the same face value comes off in either checkout currency.
  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: 'usd',
    currency_options: { cad: { amount_off: amountOff } },
    name: 'Win-Your-Money-Back Credit',
    ...(opts.recurring
      ? { duration: 'repeating', duration_in_months: months }
      : { duration: 'once' }),
    max_redemptions: 1,
    metadata: { win_back_credit_id: credit.id },
  });
  return coupon.id;
}
