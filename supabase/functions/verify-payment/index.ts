import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

// Generate cryptographically secure random password
const generateSecurePassword = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { sessionId } = requestBody;

    // Input validation
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string');
    }

    // Validate session ID format (basic Stripe session ID validation)
    if (!sessionId.startsWith('cs_') || sessionId.length < 20 || sessionId.length > 200) {
      throw new Error('Invalid session ID format');
    }

    // Sanitize session ID
    const sanitizedSessionId = sessionId.trim();

    logStep('Function started', { sessionId: sanitizedSessionId });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');
    logStep('Stripe key verified');

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase with service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    logStep('Retrieving checkout session from Stripe');

    // Retrieve the checkout session from Stripe with expanded data
    const session = await stripe.checkout.sessions.retrieve(sanitizedSessionId, {
      expand: ['line_items', 'customer', 'payment_intent']
    });

    logStep('Payment verification completed', { 
      sessionId: sanitizedSessionId, 
      paymentStatus: session.payment_status 
    });

    // Only create order record if payment was successful
    let orderDetails = null;
    if (session.payment_status === 'paid') {
      logStep('Payment successful, creating order record');
      
      // Extract customer details from the session
      const customer = session.customer;
      const customerEmail = session.customer_details?.email || (customer as any)?.email || 'unknown@example.com';
      const customerName = session.customer_details?.name || (customer as any)?.name || 'Customer';
      const customerPhone = session.customer_details?.phone || (customer as any)?.phone;
      const billingCity = session.customer_details?.address?.city || (customer as any)?.address?.city || "";

      // Try to create user account first, handle existing user gracefully
      logStep('Attempting to create or retrieve user account', { email: customerEmail });
      
      let userId = null;
      
      // Try to create new user account with secure random password
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: generateSecurePassword(),
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
          phone: customerPhone,
          city: billingCity
        }
      });

      if (signUpError) {
        // If user already exists, retrieve the existing user
        if (signUpError.message.includes('already been registered') || signUpError.message.includes('email_exists')) {
          logStep('User already exists, querying database for user ID');
          
          // Query the profiles table to get the user_id by email
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single();
          
          if (profileError || !profile) {
            logStep('Profile not found, trying auth query', { profileError });
            // If profile not found, the user might exist in auth but not profiles
            // In this case, we'll need to list users but with email filter if possible
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            
            if (listError) {
              throw new Error(`Failed to retrieve existing user: ${listError.message}`);
            }
            
            const existingUser = users?.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
            
            if (existingUser) {
              userId = existingUser.id;
              logStep('Found existing user in auth.users', { userId });
            } else {
              throw new Error('User exists but could not be found in database or auth');
            }
          } else {
            userId = profile.id;
            logStep('Found existing user in profiles table', { userId });
          }
        } else {
          logStep('Error creating user account', signUpError);
          throw new Error(`Failed to create user account: ${signUpError.message}`);
        }
      } else if (newUser.user) {
        userId = newUser.user.id;
        logStep('User account created', { userId });

        // Send password reset email so user can set their own password
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: customerEmail,
          options: {
            redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || ''}/dashboard`
          }
        });

        if (resetError) {
          logStep('Error sending password reset email', resetError);
        } else {
          logStep('Password reset email sent');
        }
      } else {
        throw new Error('User creation failed - no user returned');
      }
      
      // Ensure userId is set before proceeding
      if (!userId) {
        throw new Error('User ID is required to create order');
      }
      
      // Get program info from payment intent metadata
      const paymentIntent = session.payment_intent;
      let programSlug = null;
      let programName = "Purchase";
      
      if (paymentIntent && typeof paymentIntent === 'object' && 'metadata' in paymentIntent) {
        programSlug = (paymentIntent as any).metadata?.program || null;
        
        // Get program name from database
        const { data: programData } = await supabase
          .from('program_catalog')
          .select('mailchimp_program_name, title')
          .eq('slug', programSlug)
          .single();
        
        programName = programData?.mailchimp_program_name || programData?.title || session.line_items?.data[0]?.description || 'Purchase';
      }
      
      // Create order record with user_id and program info
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          stripe_session_id: sanitizedSessionId,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: 'paid',
          product_name: programName,
          program_slug: programSlug
        })
        .select()
        .single();

      if (orderError) {
        logStep('Error creating order record', orderError);
      } else {
        orderDetails = newOrder;
        logStep('Order record created', { orderId: newOrder.id });
      }

      // Check for auto-enrollment rules
      if (userId && programSlug) {
        logStep('Checking for auto-enrollment rules', { programSlug });
        
        const { data: autoEnrollRule, error: autoEnrollError } = await supabase
          .from('program_auto_enrollment')
          .select('round_id, program_rounds(round_name, program_slug)')
          .eq('program_slug', programSlug)
          .single();

        if (!autoEnrollError && autoEnrollRule) {
          logStep('Auto-enrollment rule found', { roundId: autoEnrollRule.round_id });
          
          // Get program details
          const { data: programData } = await supabase
            .from('program_catalog')
            .select('title')
            .eq('slug', programSlug)
            .single();

          const courseName = programData?.title || programSlug;
          
          const { error: enrollmentError } = await supabase
            .from('course_enrollments')
            .insert({
              user_id: userId,
              course_name: courseName,
              program_slug: programSlug,
              round_id: autoEnrollRule.round_id,
              status: 'active'
            });

          if (enrollmentError) {
            logStep('Error creating auto-enrollment', enrollmentError);
          } else {
            logStep('User auto-enrolled successfully', { 
              programSlug, 
              roundId: autoEnrollRule.round_id 
            });
          }
        } else {
          logStep('No auto-enrollment rule found for this program');
        }
      }

      // If payment successful, subscribe to Mailchimp with workshop details
      if (orderDetails) {
        logStep('Attempting Mailchimp subscription with workshop details');
        try {
          // Extract city from billing address if available
          const billingCity = session.customer_details?.address?.city || 
                             (customer as any)?.address?.city || 
                             "";
          
          // Get program from payment intent metadata
          const paymentIntent = session.payment_intent;
          let programName = "Unknown Program";
          let tags: string[] = [];
          
          // Extract program metadata from payment intent
          if (paymentIntent && typeof paymentIntent === 'object' && 'metadata' in paymentIntent) {
            const program = (paymentIntent as any).metadata?.program;
            
            // Get Mailchimp configuration from database
            const { data: programConfig } = await supabase
              .from('program_catalog')
              .select('mailchimp_tags, mailchimp_program_name, title')
              .eq('slug', program)
              .single();
            
            if (programConfig) {
              programName = programConfig.mailchimp_program_name || programConfig.title || "General Purchase";
              tags = programConfig.mailchimp_tags || ["paid_customer"];
            } else {
              programName = "General Purchase";
              tags = ["paid_customer"];
              console.log(`Program ${program} not found in catalog, using default tags`);
            }
          }
          
          const mailchimpResponse = await supabase.functions.invoke('mailchimp-subscribe', {
            body: {
              email: orderDetails.email,
              name: orderDetails.name,
              city: billingCity,
              phone: orderDetails.phone || "",
              source: "workshop_purchase",
              workshop_name: programName,
              purchase_amount: orderDetails.amount,
              purchase_date: new Date().toISOString(),
              payment_status: "paid",
              tags: tags,
              session_id: sanitizedSessionId
            }
          });
          logStep('Mailchimp subscription result', mailchimpResponse);
        } catch (mailchimpError) {
          logStep('Mailchimp subscription failed', mailchimpError);
          // Don't fail the entire response if Mailchimp fails
        }
      }
    }

    const response = {
      success: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
      orderDetails: orderDetails
    };

    logStep('Returning response', response);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in verify-payment', { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});