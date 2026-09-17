import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: unknown) =>
  console.log(`[IMPORT-STRIPE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Require an authenticated admin caller
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const days: number = Math.min(Math.max(Number(body?.days) || 180, 1), 730);
    const dryRun: boolean = body?.dryRun === true;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' });

    const since = Math.floor(Date.now() / 1000) - days * 86400;
    log('Scanning Stripe charges', { days, dryRun });

    // Collect all succeeded charges in range
    const charges: Stripe.Charge[] = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < 40; page++) {
      const res: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
        created: { gte: since },
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        expand: ['data.balance_transaction', 'data.invoice'],
      });
      charges.push(...res.data);
      if (!res.has_more || res.data.length === 0) break;
      startingAfter = res.data[res.data.length - 1].id;
    }
    log('Charges fetched', { count: charges.length });

    // Load every existing order reference so we never duplicate
    const existingRefs = new Set<string>();
    for (let from = 0; from < 20000; from += 1000) {
      const { data } = await supabase
        .from('orders')
        .select('stripe_session_id')
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      data.forEach((r: any) => r.stripe_session_id && existingRefs.add(r.stripe_session_id));
      if (data.length < 1000) break;
    }
    log('Existing orders loaded', { count: existingRefs.size });

    const imported: any[] = [];
    const skipped: any[] = [];

    for (const charge of charges) {
      if (charge.status !== 'succeeded') continue;

      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null;
      const invoice: any = charge.invoice && typeof charge.invoice !== 'string' ? charge.invoice : null;
      const invoiceId = invoice?.id ?? (typeof charge.invoice === 'string' ? charge.invoice : null);

      // Every id this payment could already be recorded under
      const refs: string[] = [charge.id];
      if (paymentIntentId) refs.push(paymentIntentId);
      if (invoiceId) refs.push(invoiceId);

      // Checkout sessions store cs_... ids
      let sessionId: string | null = null;
      if (paymentIntentId) {
        try {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
          sessionId = sessions.data[0]?.id ?? null;
          if (sessionId) refs.push(sessionId);
        } catch (_) { /* ignore */ }
      }

      if (refs.some((r) => existingRefs.has(r))) {
        skipped.push({ charge: charge.id, reason: 'already recorded' });
        continue;
      }

      // Resolve product / program info
      let productName = charge.description || 'Stripe Payment';
      let programSlug: string | null = null;
      let paymentType = 'payment';

      if (invoiceId) {
        paymentType = 'subscription_recurring';
        const inv = invoice ?? await stripe.invoices.retrieve(invoiceId);
        const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            programSlug = sub.metadata?.program || sub.metadata?.program_slug || null;
            productName = `${sub.metadata?.product_name || inv.lines?.data?.[0]?.description || 'Subscription Payment'} (Recurring)`;
          } catch (_) { /* ignore */ }
        } else if (inv.lines?.data?.[0]?.description) {
          productName = inv.lines.data[0].description;
        }
      } else if (paymentIntentId) {
        try {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          programSlug = pi.metadata?.program || pi.metadata?.program_slug || null;
          productName = pi.metadata?.product_name || pi.description || productName;
        } catch (_) { /* ignore */ }
      }

      const bt: any = charge.balance_transaction && typeof charge.balance_transaction !== 'string'
        ? charge.balance_transaction
        : null;
      const usdAmount = bt && (bt.currency || '').toLowerCase() === 'usd' ? bt.amount : null;
      const usdRate = bt?.exchange_rate ?? null;

      const email = (charge.billing_details?.email || charge.receipt_email || '').toLowerCase().trim();
      const name = charge.billing_details?.name || '';

      // Link to an existing account when we can (account email or payment alias)
      let userId: string | null = null;
      if (email) {
        const { data: profile } = await supabase
          .from('profiles').select('id').ilike('email', email).maybeSingle();
        if (profile) userId = profile.id;
        if (!userId) {
          const { data: alias } = await supabase
            .from('account_email_aliases').select('primary_user_id').eq('email', email).maybeSingle();
          if (alias) userId = alias.primary_user_id;
        }
      }

      const row = {
        stripe_session_id: sessionId || invoiceId || charge.id,
        email: email || 'unknown@example.com',
        name,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.refunded ? 'refunded' : 'paid',
        product_name: productName,
        program_slug: programSlug,
        payment_type: paymentType,
        user_id: userId,
        usd_amount: usdAmount,
        usd_exchange_rate: usdRate,
        refunded: charge.refunded,
        refund_amount: charge.amount_refunded || null,
        billing_city: charge.billing_details?.address?.city || null,
        billing_state: charge.billing_details?.address?.state || null,
        billing_country: charge.billing_details?.address?.country || null,
        created_at: new Date(charge.created * 1000).toISOString(),
      };

      if (dryRun) {
        imported.push(row);
        continue;
      }

      const { error: insertError } = await supabase.from('orders').insert(row);
      if (insertError) {
        log('Insert failed', { charge: charge.id, error: insertError.message });
        skipped.push({ charge: charge.id, reason: insertError.message });
      } else {
        existingRefs.add(row.stripe_session_id);
        imported.push({
          charge: charge.id,
          email: row.email,
          amount: row.amount,
          currency: row.currency,
          product_name: row.product_name,
          created_at: row.created_at,
          payment_type: row.payment_type,
        });
      }
    }

    log('Done', { scanned: charges.length, imported: imported.length, skipped: skipped.length });

    return new Response(JSON.stringify({
      scanned: charges.length,
      imported: imported.length,
      skipped: skipped.length,
      dryRun,
      details: imported.slice(0, 100),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[IMPORT-STRIPE] ERROR', error?.message);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
