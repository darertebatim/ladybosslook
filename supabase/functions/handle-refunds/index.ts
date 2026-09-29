import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[HANDLE-REFUNDS] Starting refund check');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get all paid orders
    let onlyInvoices = false;
    let onlyIds: string[] | null = null;
    try { const b = await req.json(); onlyInvoices = !!b?.only_invoices; onlyIds = Array.isArray(b?.ids) ? b.ids : null; } catch (_) {}
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, email, stripe_session_id, product_name, user_id, payment_type')
      .in('status', ['paid', 'completed']);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: 'No paid orders to check' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`[HANDLE-REFUNDS] Checking ${orders.length} orders`);

    const refundedOrders = [];
    const debug: any[] = [];

    // Check each order for refunds
    for (const order of orders) {
      if (!order.stripe_session_id) continue;
      if (onlyIds && !onlyIds.includes(order.stripe_session_id)) continue;
      if (onlyInvoices && !order.stripe_session_id.startsWith('in_')) continue;

      try {
        let piId: string | null = null;
        const isInvoice = order.stripe_session_id.startsWith('in_');
        if (isInvoice) {
          const invoice = await stripe.invoices.retrieve(order.stripe_session_id);
          piId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id ?? null;
        } else {
          const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
          if (session.payment_intent) {
            piId = session.payment_intent as string;
          } else if (session.invoice) {
            const invoice = await stripe.invoices.retrieve(session.invoice as string);
            piId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id ?? null;
          }
        }

        if (!piId && onlyIds) debug.push({ id: order.stripe_session_id, pi: null });
        if (!piId && isInvoice) console.log(`[HANDLE-REFUNDS] INVOICE ${order.stripe_session_id} has no payment intent`);
        if (piId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
          const latestCharge: any = paymentIntent.latest_charge;
          (paymentIntent as any).amount_refunded = latestCharge?.amount_refunded ?? 0;
          if (onlyIds) debug.push({ id: order.stripe_session_id, pi: piId, status: paymentIntent.status, charge: latestCharge?.id, refunded: latestCharge?.amount_refunded });
          if (isInvoice) console.log(`[HANDLE-REFUNDS] INVOICE ${order.stripe_session_id} ${order.email} pi=${piId} refunded=${latestCharge?.amount_refunded}`);
          
          
          console.log(`[HANDLE-REFUNDS] Checking order ${order.id}, PI status: ${paymentIntent.status}, amount_refunded: ${paymentIntent.amount_received || 0}`);
          
          // Only treat as refunded when the FULL amount was refunded.
          const amountRefunded = paymentIntent.amount_refunded ?? 0;
          const amountTotal = paymentIntent.amount ?? 0;
          const isFullRefund = amountRefunded > 0 && amountRefunded >= amountTotal;
          const isPartialRefund = amountRefunded > 0 && !isFullRefund;

          if (isPartialRefund) {
            console.log(`[HANDLE-REFUNDS] Partial refund (${amountRefunded}/${amountTotal}) for order ${order.id} — keeping enrollment`);
            await supabase
              .from('orders')
              .update({ status: 'partially_refunded', refund_amount: amountRefunded })
              .eq('id', order.id);
          }

          if (isFullRefund) {
            console.log(`[HANDLE-REFUNDS] Found refunded order: ${order.id}, email: ${order.email}`);
            refundedOrders.push(order);

            // Update order status
            await supabase
              .from('orders')
              .update({ status: 'refunded', refunded: true, refund_amount: amountRefunded, refunded_at: new Date().toISOString() })
              .eq('id', order.id);

            // Remove enrollment
            if (order.user_id && order.payment_type !== 'subscription_recurring') {
              await supabase
                .from('course_enrollments')
                .delete()
                .eq('user_id', order.user_id)
                .eq('course_name', order.product_name);
            }


            // Remove Mailchimp tag
            try {
              const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
              const listId = Deno.env.get('MAILCHIMP_LIST_ID');
              
              if (mailchimpApiKey && listId) {
                const dc = mailchimpApiKey.split('-')[1];
                const emailHash = await crypto.subtle.digest(
                  'MD5',
                  new TextEncoder().encode(order.email.toLowerCase())
                ).then(buf => 
                  Array.from(new Uint8Array(buf))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
                );

                const tagName = order.product_name.toLowerCase().replace(/\s+/g, '_');
                
                await fetch(
                  `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}/tags`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${mailchimpApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      tags: [{ name: tagName, status: 'inactive' }]
                    }),
                  }
                );
                console.log(`[HANDLE-REFUNDS] Removed Mailchimp tag for ${order.email}`);
              }
            } catch (mailchimpError: any) {
              console.error('[HANDLE-REFUNDS] Mailchimp error:', mailchimpError);
            }
          }
        }
      } catch (stripeError: any) {
        console.error(`[HANDLE-REFUNDS] Error checking order ${order.id}:`, stripeError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      refundedCount: refundedOrders.length,
      debug,
      refundedOrders: refundedOrders.map(o => ({ email: o.email, product: o.product_name }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[HANDLE-REFUNDS] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
