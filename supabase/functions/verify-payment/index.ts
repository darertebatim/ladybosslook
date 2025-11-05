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

      // Check if user account already exists
      logStep('Checking for existing user account', { email: customerEmail });
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      let userId = null;
      const existingUser = users?.find(u => u.email === customerEmail);
      
      if (existingUser) {
        logStep('Found existing user account', { userId: existingUser.id });
        userId = existingUser.id;
      } else {
        // Create new user account with email as password
        logStep('Creating new user account');
        
        const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password: customerEmail,
          email_confirm: true,
          user_metadata: {
            full_name: customerName,
            phone: customerPhone,
            city: billingCity
          }
        });

        if (signUpError) {
          logStep('Error creating user account', signUpError);
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
        }
      }
      
      // Get program info from payment intent metadata
      const paymentIntent = session.payment_intent;
      let programSlug = null;
      let programName = "Purchase";
      
      if (paymentIntent && typeof paymentIntent === 'object' && 'metadata' in paymentIntent) {
        programSlug = (paymentIntent as any).metadata?.program || null;
        
        // Map program slug to display name
        switch(programSlug) {
          case 'one-bilingual':
            programName = "Bilingual Power Class";
            break;
          case 'courageous-character':
            programName = "Courageous Character Course";
            break;
          case 'money-literacy':
            programName = "Money Literacy Program";
            break;
          case 'iqmoney':
            programName = "IQMoney Program";
            break;
          case 'empowered-ladyboss':
            programName = "Empowered Ladyboss Coaching";
            break;
          case 'business-startup':
            programName = "Business Startup Accelerator";
            break;
          case 'business-growth':
            programName = "Business Growth Accelerator";
            break;
          case 'ladyboss-vip':
            programName = "Ladyboss VIP Club";
            break;
          case 'connection-literacy':
            programName = "Connection Literacy Program";
            break;
          case 'instagram-growth':
            programName = "Instagram Growth Course";
            break;
          case 'private-coaching':
            programName = "Private Coaching Session";
            break;
          case 'empowered-woman-coaching':
            programName = "Empowered Woman Coaching";
            break;
          default:
            programName = session.line_items?.data[0]?.description || 'Purchase';
        }
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

      // Auto-enroll user in course if program is empowered-woman-coaching
      if (userId && programSlug === 'empowered-woman-coaching') {
        logStep('Auto-enrolling user in Empowered Woman Coaching');
        
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: userId,
            course_name: 'Empowered Woman Coaching',
            program_slug: programSlug,
            status: 'active'
          });

        if (enrollmentError) {
          logStep('Error creating enrollment', enrollmentError);
        } else {
          logStep('User enrolled successfully');
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
            
            // Map program to Mailchimp tags
            switch(program) {
              case 'one-bilingual':
                programName = "Bilingual Power Class";
                tags = ["one", "one_bilingual", "paid_class"];
                break;
              case 'courageous-character':
                programName = "Courageous Character Course";
                tags = ["ccc"];
                break;
              case 'money-literacy':
                programName = "Money Literacy Program";
                tags = ["money_literacy"];
                break;
              case 'iqmoney':
                programName = "IQMoney Program";
                tags = ["iqmoney"];
                break;
              case 'empowered-ladyboss':
                programName = "Empowered Ladyboss Coaching";
                tags = ["ladyboss_coaching_program"];
                break;
              case 'business-startup':
                programName = "Business Startup Accelerator";
                tags = ["bsac"];
                break;
              case 'business-growth':
                programName = "Business Growth Accelerator";
                tags = ["bgac"];
                break;
              case 'ladyboss-vip':
                programName = "Ladyboss VIP Club";
                tags = ["vip_club"];
                break;
              case 'connection-literacy':
                programName = "Connection Literacy Program";
                tags = ["connection_literacy"];
                break;
              case 'instagram-growth':
                programName = "Instagram Growth Course";
                tags = ["instagram_course"];
                break;
              case 'private-coaching':
                programName = "Private Coaching Session";
                tags = ["private_session"];
                break;
              case 'empowered-woman-coaching':
                programName = "Empowered Woman Coaching";
                tags = ["ewc"];
                break;
              default:
                programName = "General Purchase";
                tags = ["paid_customer"];
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