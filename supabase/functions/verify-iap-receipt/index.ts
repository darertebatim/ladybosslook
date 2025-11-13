import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptVerificationRequest {
  receipt: string;
  transactionId: string;
  productId: string;
  programSlug: string;
  userId: string;
}

interface AppleReceiptResponse {
  status: number;
  receipt?: any;
  latest_receipt_info?: any[];
  pending_renewal_info?: any[];
}

const verifyReceiptWithApple = async (receipt: string, isProduction: boolean): Promise<AppleReceiptResponse> => {
  const verifyUrl = isProduction 
    ? 'https://buy.itunes.apple.com/verifyReceipt'
    : 'https://sandbox.itunes.apple.com/verifyReceipt';

  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
  
  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': sharedSecret, // Get from App Store Connect
      'exclude-old-transactions': true
    }),
  });

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { receipt, transactionId, productId, programSlug, userId }: ReceiptVerificationRequest = await req.json();

    console.log('Verifying IAP receipt:', { transactionId, productId, programSlug, userId });

    // Step 1: Verify receipt with Apple (if APPLE_SHARED_SECRET is configured)
    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    
    if (sharedSecret && receipt) {
      let appleResponse = await verifyReceiptWithApple(receipt, true);
      
      // If production verification returns 21007 (sandbox receipt), try sandbox
      if (appleResponse.status === 21007) {
        console.log('Production failed with 21007, trying sandbox...');
        appleResponse = await verifyReceiptWithApple(receipt, false);
      }

      // Check if verification was successful
      if (appleResponse.status !== 0) {
        console.error('Apple receipt verification failed:', appleResponse);
        return new Response(
          JSON.stringify({ 
            verified: false, 
            error: 'Receipt verification failed',
            appleStatus: appleResponse.status 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      console.log('Apple receipt verified successfully');
    } else {
      console.warn('APPLE_SHARED_SECRET not configured - skipping Apple verification');
    }

    // Step 2: Get program details
    const { data: programData, error: programError } = await supabaseClient
      .from('program_catalog')
      .select('title, price_amount, ios_product_id')
      .eq('slug', programSlug)
      .single();

    if (programError || !programData) {
      console.error('Program not found:', programError);
      throw new Error('Program not found');
    }

    // Step 3: Verify the product ID matches
    if (programData.ios_product_id !== productId) {
      console.error('Product ID mismatch:', { expected: programData.ios_product_id, received: productId });
      throw new Error('Product ID mismatch');
    }

    // Step 4: Get user details
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const userEmail = userData?.email || '';
    const userName = userData?.full_name || '';

    // Step 5: Check if order already exists (prevent duplicate processing)
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('stripe_session_id', transactionId)
      .maybeSingle();

    if (existingOrder) {
      console.log('Order already exists for this transaction:', transactionId);
      return new Response(
        JSON.stringify({
          verified: true,
          orderId: existingOrder.id,
          message: 'Purchase already processed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 6: Create order record
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        email: userEmail,
        name: userName,
        product_name: programData.title,
        program_slug: programSlug,
        amount: programData.price_amount,
        currency: 'usd',
        status: 'completed',
        payment_type: 'iap',
        stripe_session_id: transactionId,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    console.log('Order created:', orderData.id);

    // Step 7: Check if enrollment already exists
    const { data: existingEnrollment } = await supabaseClient
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('program_slug', programSlug)
      .maybeSingle();

    if (!existingEnrollment) {
      // Create enrollment
      const { error: enrollmentError } = await supabaseClient
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_name: programData.title,
          program_slug: programSlug,
          status: 'active',
        });

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError);
        throw enrollmentError;
      }

      console.log('Enrollment created for user:', userId);
    } else {
      console.log('Enrollment already exists:', existingEnrollment.id);
    }

    return new Response(
      JSON.stringify({
        verified: true,
        orderId: orderData.id,
        message: 'Purchase verified and enrollment created',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ verified: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
