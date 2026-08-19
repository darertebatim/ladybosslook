import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' });

    const { data: pending, error } = await supabase
      .from('orders')
      .select('id, amount, currency, stripe_session_id, usd_amount')
      .is('usd_amount', null)
      .limit(300);
    if (error) throw error;

    let converted = 0, skipped = 0;
    const errors: string[] = [];

    for (const order of pending ?? []) {
      const cur = (order.currency || 'usd').toLowerCase();
      if (cur === 'usd') {
        await supabase.from('orders').update({ usd_amount: order.amount, usd_exchange_rate: 1 }).eq('id', order.id);
        converted++;
        continue;
      }
      if (!order.stripe_session_id) { skipped++; continue; }
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
          expand: ['payment_intent.latest_charge.balance_transaction'],
        }) as any;
        const bt = session?.payment_intent?.latest_charge?.balance_transaction;
        if (bt && (bt.currency || '').toLowerCase() === 'usd') {
          await supabase.from('orders').update({
            usd_amount: bt.amount,
            usd_exchange_rate: bt.exchange_rate ?? null,
          }).eq('id', order.id);
          converted++;
        } else {
          skipped++;
        }
      } catch (e: any) {
        errors.push(`${order.id}: ${e.message}`);
        skipped++;
      }
    }

    return new Response(JSON.stringify({ processed: pending?.length ?? 0, converted, skipped, errors: errors.slice(0, 5) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
