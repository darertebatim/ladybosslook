import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Helper to find or create user by email
async function findOrCreateUser(supabase: any, email: string, name: string): Promise<string | null> {
  console.log('[WEBHOOK] Finding or creating user for email:', email);
  
  // First, check if user exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingProfile) {
    console.log('[WEBHOOK] Found existing user in profiles:', existingProfile.id);
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
      console.log('[WEBHOOK] User exists in auth, looking up by email...');
      
      // Search through auth users to find the one with this email
      let page = 1;
      const perPage = 1000;
      
      while (true) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        });

        if (listError || !users || users.length === 0) {
          console.error('[WEBHOOK] Could not find user in auth:', listError);
          break;
        }

        const foundUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (foundUser) {
          console.log('[WEBHOOK] Found existing user on page', page, ':', foundUser.id);
          return foundUser.id;
        }

        if (users.length < perPage) break;
        page++;
      }
      
      return null;
    }
    
    console.error('[WEBHOOK] Error creating user:', createError);
    return null;
  }

  console.log('[WEBHOOK] Created new user:', authData.user.id);
  return authData.user.id;
}

// Helper to apply auto-enrollment rules
async function applyAutoEnrollment(supabase: any, userId: string, programSlug: string, courseName: string): Promise<void> {
  console.log('[WEBHOOK] Checking auto-enrollment for program:', programSlug, 'user:', userId);
  
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
    console.log('[WEBHOOK] Enrollment already exists for user:', userId, 'program:', programSlug);
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
    console.log('[WEBHOOK] Using auto-enrollment round:', autoEnrollRule.round_id);
  }

  const { error: enrollmentError } = await supabase
    .from('course_enrollments')
    .insert(enrollmentData);

  if (enrollmentError) {
    console.error('[WEBHOOK] Error creating enrollment:', enrollmentError);
  } else {
    console.log('[WEBHOOK] Enrollment created successfully for user:', userId, 'program:', programSlug);
  }
}

// Helper to trigger Mailchimp subscription
async function triggerMailchimpSubscription(supabase: any, orderData: any, programSlug: string | null): Promise<void> {
  console.log('[WEBHOOK] Triggering Mailchimp subscription for:', orderData.email);
  
  try {
    let mailchimpProgramName = "General Purchase";
    let tags: string[] = ["paid_customer"];
    
    if (programSlug) {
      const { data: programConfig } = await supabase
        .from('program_catalog')
        .select('mailchimp_tags, mailchimp_program_name, title, price_amount, is_free_on_ios')
        .eq('slug', programSlug)
        .single();
      
      if (programConfig) {
        mailchimpProgramName = programConfig.mailchimp_program_name || programConfig.title || "General Purchase";
        
        // Determine paid vs free customer based on program price
        const isFree = programConfig.price_amount === 0 || programConfig.is_free_on_ios === true;
        const customerTypeTag = isFree ? "free_customer" : "paid_customer";
        
        // Combine customer type tag with program-specific tags
        const programTags = programConfig.mailchimp_tags || [];
        tags = [customerTypeTag, ...programTags.filter((t: string) => t !== 'paid_customer' && t !== 'free_customer')];
        
        console.log('[WEBHOOK] Program price:', programConfig.price_amount, 'is_free_on_ios:', programConfig.is_free_on_ios, '-> Tag:', customerTypeTag);
      }
    }
    
    const { error } = await supabase.functions.invoke('mailchimp-subscribe', {
      body: {
        email: orderData.email,
        name: orderData.name,
        city: orderData.billing_city || "",
        phone: orderData.phone || "",
        source: "webhook_purchase",
        workshop_name: mailchimpProgramName,
        purchase_amount: orderData.amount,
        purchase_date: new Date().toISOString(),
        payment_status: "paid",
        tags: tags,
        session_id: orderData.stripe_session_id
      }
    });

    if (error) {
      console.error('[WEBHOOK] Mailchimp subscription error:', error);
    } else {
      console.log('[WEBHOOK] Mailchimp subscription triggered successfully');
    }
  } catch (mailchimpError) {
    console.error('[WEBHOOK] Mailchimp subscription failed:', mailchimpError);
    // Don't fail the webhook if Mailchimp fails
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[WEBHOOK] Function started');
    
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
      console.error('[WEBHOOK] Signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[WEBHOOK] Event received:', event.type);

    // Handle checkout.session.completed (for both one-time and subscription initial payments)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('[WEBHOOK] Processing checkout session:', session.id, 'Mode:', session.mode);

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
      
      console.log('[WEBHOOK] Customer email:', customerEmail, 'Product:', productName, 'Program slug:', programSlug);
      
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

      if (existingOrder) {
        console.log('[WEBHOOK] Order already exists for session:', session.id);
        return new Response(JSON.stringify({ received: true, message: 'Order already exists' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find or create user
      let userId: string | null = null;
      if (customerEmail) {
        userId = await findOrCreateUser(supabase, customerEmail, customerName);
        console.log('[WEBHOOK] User ID for order:', userId);

        // Sync location data to profile (only update null fields)
        if (userId) {
          const profileUpdate: any = {};
          if (customerPhone) profileUpdate.phone = customerPhone;
          if (billingCity) profileUpdate.city = billingCity;
          if (billingState) profileUpdate.state = billingState;
          if (billingCountry) profileUpdate.country = billingCountry;

          if (Object.keys(profileUpdate).length > 0) {
            // Get current profile to check for null fields
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('phone, city, state, country')
              .eq('id', userId)
              .single();

            const updateData: any = {};
            if (!currentProfile?.phone && profileUpdate.phone) updateData.phone = profileUpdate.phone;
            if (!currentProfile?.city && profileUpdate.city) updateData.city = profileUpdate.city;
            if (!currentProfile?.state && profileUpdate.state) updateData.state = profileUpdate.state;
            if (!currentProfile?.country && profileUpdate.country) updateData.country = profileUpdate.country;

            if (Object.keys(updateData).length > 0) {
              const { error: profileError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

              if (profileError) {
                console.error('[WEBHOOK] Error updating profile location:', profileError);
              } else {
                console.log('[WEBHOOK] Profile location synced:', updateData);
              }
            }
          }
        }
      }

      // Create order record with user_id
      const orderData = {
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
        user_id: userId,
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert(orderData);

      if (orderError) {
        console.error('[WEBHOOK] Error creating order:', orderError);
        throw orderError;
      }

      console.log('[WEBHOOK] Order created successfully for session:', session.id, 'user_id:', userId);

      // Apply auto-enrollment if we have a user and program
      if (userId && programSlug) {
        await applyAutoEnrollment(supabase, userId, programSlug, productName);
      } else {
        console.log('[WEBHOOK] Skipping auto-enrollment: userId=', userId, 'programSlug=', programSlug);
      }

      // Trigger Mailchimp subscription
      if (customerEmail) {
        await triggerMailchimpSubscription(supabase, { ...orderData, email: customerEmail }, programSlug);
      }

      // Handle subscription checkout - create/update user_subscriptions
      if (session.mode === 'subscription' && session.metadata?.subscription === 'true' && userId) {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        
        console.log('[WEBHOOK] Processing subscription checkout for user:', userId, 'subscription:', subscriptionId);

        let trialEnd = null;
        let periodEnd = null;
        
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
          periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
        }

        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            status: trialEnd ? 'trial' : 'active',
            platform: 'stripe',
            stripe_subscription_id: subscriptionId || null,
            stripe_customer_id: customerId || null,
            expires_at: periodEnd,
            trial_ends_at: trialEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (subError) console.error('[WEBHOOK] Error creating user subscription:', subError);
        else console.log('[WEBHOOK] user_subscriptions created for user:', userId);
      }
    }

    // Handle invoice.paid (for recurring subscription payments)
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Skip the first invoice (already handled by checkout.session.completed)
      if (invoice.billing_reason === 'subscription_create') {
        console.log('[WEBHOOK] Skipping initial subscription invoice, already handled by checkout.session.completed');
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[WEBHOOK] Processing recurring invoice:', invoice.id, 'Reason:', invoice.billing_reason);

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
        console.error('[WEBHOOK] Error creating recurring order:', orderError);
      } else {
        console.log('[WEBHOOK] Recurring order created for invoice:', invoice.id, 'user_id:', userId);
      }
    }

    // Handle customer.subscription.created (set auto-cancellation if configured)
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('[WEBHOOK] Subscription created:', subscription.id);

      const autoCancelMonths = subscription.metadata?.auto_cancel_after_months;
      
      if (autoCancelMonths && parseInt(autoCancelMonths) > 0) {
        const months = parseInt(autoCancelMonths);
        // Calculate cancel_at timestamp (months from now)
        const cancelAt = Math.floor(Date.now() / 1000) + (months * 30 * 24 * 60 * 60);
        
        console.log('[WEBHOOK] Setting auto-cancellation for subscription:', subscription.id, 'Cancel at:', new Date(cancelAt * 1000).toISOString());

        try {
          await stripe.subscriptions.update(subscription.id, {
            cancel_at: cancelAt,
          });
          console.log('[WEBHOOK] Auto-cancellation set successfully for subscription:', subscription.id);
        } catch (err) {
          console.error('[WEBHOOK] Error setting auto-cancellation:', err.message);
        }
      }
    }

    // Handle customer.subscription.deleted (subscription cancelled or ended)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('[WEBHOOK] Subscription ended:', subscription.id, 'Status:', subscription.status);

      // Update user_subscriptions table
      const subUserId = subscription.metadata?.supabase_user_id;
      if (subUserId) {
        await supabase
          .from('user_subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('user_id', subUserId);
        console.log('[WEBHOOK] user_subscriptions marked expired for user:', subUserId);
      }

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
              console.error('[WEBHOOK] Error updating enrollment status:', enrollmentError);
            } else {
              console.log('[WEBHOOK] Enrollment marked as cancelled for user:', profile.id, 'program:', programSlug);
            }
          }
        }
      }
    }

    // Handle customer.subscription.updated (status changes, renewals)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const subUserId = subscription.metadata?.supabase_user_id;
      
      console.log('[WEBHOOK] Subscription updated:', subscription.id, 'Status:', subscription.status, 'User:', subUserId);

      if (subUserId) {
        let status = 'active';
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') status = 'cancelled';
        else if (subscription.status === 'past_due') status = 'expired';
        else if (subscription.status === 'trialing') status = 'trial';

        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: subUserId,
            status,
            platform: 'stripe',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
            expires_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) console.error('[WEBHOOK] Error upserting subscription:', error);
        else console.log('[WEBHOOK] user_subscriptions updated for user:', subUserId, 'status:', status);
      }
    }

    // Handle charge.refunded
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      
      console.log('[WEBHOOK] Processing refund for charge:', charge.id);

      // Get the payment intent
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent?.id;

      if (!paymentIntentId) {
        console.log('[WEBHOOK] No payment intent found for charge:', charge.id);
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
        console.log('[WEBHOOK] No session found for payment intent:', paymentIntentId);
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
        console.log('[WEBHOOK] No order found for session:', sessionId);
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
        console.error('[WEBHOOK] Error updating order:', updateError);
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
          console.error('[WEBHOOK] Error removing enrollment:', enrollmentError);
        } else {
          console.log('[WEBHOOK] Enrollment removed for user:', order.user_id);
        }
      }

      console.log('[WEBHOOK] Refund processed successfully for order:', order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
