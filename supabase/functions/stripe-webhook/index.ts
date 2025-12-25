import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Helper to find or create user by email
async function findOrCreateUser(supabase: any, email: string, name: string): Promise<string | null> {
  console.log('Finding or creating user for email:', email);
  
  // First, check if user exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingProfile) {
    console.log('Found existing user in profiles:', existingProfile.id);
    return existingProfile.id;
  }

  // Try to create user in auth
  const tempPassword = crypto.randomUUID();
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  if (createError) {
    // User might already exist in auth but not in profiles
    if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
      console.log('User exists in auth, looking up by email...');
      
      // Search through auth users to find the one with this email
      let page = 1;
      const perPage = 1000;
      
      while (true) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        });

        if (listError || !users || users.length === 0) {
          console.error('Could not find user in auth:', listError);
          break;
        }

        const foundUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (foundUser) {
          console.log('Found existing user on page', page, ':', foundUser.id);
          return foundUser.id;
        }

        if (users.length < perPage) break;
        page++;
      }
      
      return null;
    }
    
    console.error('Error creating user:', createError);
    return null;
  }

  console.log('Created new user:', authData.user.id);
  return authData.user.id;
}

// Helper to apply auto-enrollment rules
async function applyAutoEnrollment(supabase: any, userId: string, programSlug: string, courseName: string): Promise<void> {
  console.log('Checking auto-enrollment for program:', programSlug, 'user:', userId);
  
  // Get auto-enrollment rule for this program
  const { data: autoEnrollRule } = await supabase
    .from('program_auto_enrollment')
    .select('round_id')
    .eq('program_slug', programSlug)
    .single();

  // Check if enrollment already exists
  const { data: existingEnrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('program_slug', programSlug)
    .single();

  if (existingEnrollment) {
    console.log('Enrollment already exists for user:', userId, 'program:', programSlug);
    return;
  }

  // Create enrollment
  const enrollmentData: any = {
    user_id: userId,
    course_name: courseName,
    program_slug: programSlug,
    status: 'active',
  };

  if (autoEnrollRule) {
    enrollmentData.round_id = autoEnrollRule.round_id;
    console.log('Using auto-enrollment round:', autoEnrollRule.round_id);
  }

  const { error: enrollmentError } = await supabase
    .from('course_enrollments')
    .insert(enrollmentData);

  if (enrollmentError) {
    console.error('Error creating enrollment:', enrollmentError);
  } else {
    console.log('Enrollment created successfully for user:', userId, 'program:', programSlug);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('No signature provided');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } else {
        // For testing without signature verification
        event = JSON.parse(body);
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook event received:', event.type);

    // Handle checkout.session.completed (for both one-time and subscription initial payments)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing checkout session:', session.id, 'Mode:', session.mode);

      // Get customer details
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || '';
      const customerPhone = session.customer_details?.phone || null;

      // Get billing details
      const billingCity = session.customer_details?.address?.city || null;
      const billingState = session.customer_details?.address?.state || null;
      const billingCountry = session.customer_details?.address?.country || null;

      // Get payment details
      const amount = session.amount_total || 0;
      const currency = session.currency || 'usd';
      
      // Get product name and program slug from metadata
      let productName = session.metadata?.product_name || 'Unknown Product';
      const programSlug = session.metadata?.program_slug || session.metadata?.program || null;
      const paymentType = session.metadata?.payment_type || session.mode;
      
      console.log('Customer email:', customerEmail, 'Product:', productName, 'Program slug:', programSlug);
      
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

      if (existingOrder) {
        console.log('Order already exists for session:', session.id);
        return new Response(JSON.stringify({ received: true, message: 'Order already exists' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find or create user
      let userId: string | null = null;
      if (customerEmail) {
        userId = await findOrCreateUser(supabase, customerEmail, customerName);
        console.log('User ID for order:', userId);
      }

      // Create order record with user_id
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          billing_city: billingCity,
          billing_state: billingState,
          billing_country: billingCountry,
          amount,
          currency,
          status: 'completed',
          product_name: productName,
          program_slug: programSlug,
          payment_type: paymentType,
          user_id: userId, // Now linking user to order
        });

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully for session:', session.id, 'user_id:', userId);

      // Apply auto-enrollment if we have a user and program
      if (userId && programSlug) {
        await applyAutoEnrollment(supabase, userId, programSlug, productName);
      } else {
        console.log('Skipping auto-enrollment: userId=', userId, 'programSlug=', programSlug);
      }
    }

    // Handle invoice.paid (for recurring subscription payments)
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Skip the first invoice (already handled by checkout.session.completed)
      if (invoice.billing_reason === 'subscription_create') {
        console.log('Skipping initial subscription invoice, already handled by checkout.session.completed');
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Processing recurring invoice:', invoice.id, 'Reason:', invoice.billing_reason);

      const customerEmail = invoice.customer_email || '';
      const customerName = invoice.customer_name || '';
      const amount = invoice.amount_paid || 0;
      const currency = invoice.currency || 'usd';

      // Get subscription metadata
      let programSlug: string | null = null;
      let productName = 'Subscription Payment';

      if (invoice.subscription) {
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        programSlug = subscription.metadata?.program || null;
        productName = subscription.metadata?.product_name || 'Subscription Payment';
      }

      // Find user by email
      let userId: string | null = null;
      if (customerEmail) {
        userId = await findOrCreateUser(supabase, customerEmail, customerName);
      }

      // Create order record for recurring payment
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: invoice.id, // Use invoice ID for recurring payments
          email: customerEmail,
          name: customerName,
          amount,
          currency,
          status: 'completed',
          product_name: `${productName} (Recurring)`,
          program_slug: programSlug,
          payment_type: 'subscription_recurring',
          user_id: userId,
        });

      if (orderError) {
        console.error('Error creating recurring order:', orderError);
      } else {
        console.log('Recurring order created for invoice:', invoice.id, 'user_id:', userId);
      }
    }

    // Handle customer.subscription.created (set auto-cancellation if configured)
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('Subscription created:', subscription.id);

      const autoCancelMonths = subscription.metadata?.auto_cancel_after_months;
      
      if (autoCancelMonths && parseInt(autoCancelMonths) > 0) {
        const months = parseInt(autoCancelMonths);
        // Calculate cancel_at timestamp (months from now)
        const cancelAt = Math.floor(Date.now() / 1000) + (months * 30 * 24 * 60 * 60);
        
        console.log('Setting auto-cancellation for subscription:', subscription.id, 'Cancel at:', new Date(cancelAt * 1000).toISOString());

        try {
          await stripe.subscriptions.update(subscription.id, {
            cancel_at: cancelAt,
          });
          console.log('Auto-cancellation set successfully for subscription:', subscription.id);
        } catch (err) {
          console.error('Error setting auto-cancellation:', err.message);
        }
      }
    }

    // Handle customer.subscription.deleted (subscription cancelled or ended)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('Subscription ended:', subscription.id, 'Status:', subscription.status);

      const programSlug = subscription.metadata?.program || null;
      
      if (programSlug) {
        // Get customer email from Stripe
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
        
        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = (customer as Stripe.Customer).email;

        if (customerEmail) {
          // Find user by email and remove enrollment
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single();

          if (profile) {
            const { error: enrollmentError } = await supabase
              .from('course_enrollments')
              .update({ status: 'cancelled' })
              .eq('user_id', profile.id)
              .eq('program_slug', programSlug);

            if (enrollmentError) {
              console.error('Error updating enrollment status:', enrollmentError);
            } else {
              console.log('Enrollment marked as cancelled for user:', profile.id, 'program:', programSlug);
            }
          }
        }
      }
    }

    // Handle charge.refunded
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      
      console.log('Processing refund for charge:', charge.id);

      // Get the payment intent
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent?.id;

      if (!paymentIntentId) {
        console.log('No payment intent found for charge:', charge.id);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the checkout session for this payment intent
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });

      if (sessions.data.length === 0) {
        console.log('No session found for payment intent:', paymentIntentId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sessionId = sessions.data[0].id;

      // Find the order
      const { data: order } = await supabase
        .from('orders')
        .select('id, user_id, program_slug')
        .eq('stripe_session_id', sessionId)
        .single();

      if (!order) {
        console.log('No order found for session:', sessionId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update order as refunded
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refunded: true,
          refunded_at: new Date().toISOString(),
          refund_amount: charge.amount_refunded,
          status: 'refunded',
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      // Remove course enrollments if user_id and program_slug exist
      if (order.user_id && order.program_slug) {
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .delete()
          .eq('user_id', order.user_id)
          .eq('program_slug', order.program_slug);

        if (enrollmentError) {
          console.error('Error removing enrollment:', enrollmentError);
        } else {
          console.log('Enrollment removed for user:', order.user_id);
        }
      }

      console.log('Refund processed successfully for order:', order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
