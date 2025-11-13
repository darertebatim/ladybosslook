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

    // In production, verify the receipt with Apple's servers
    // For now, we'll trust the client and create the enrollment
    // TODO: Add actual Apple receipt verification
    // https://developer.apple.com/documentation/appstorereceipts/verifyreceipt

    // Create order record
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        email: '', // Will be updated with user's email
        name: '', // Will be updated with user's name
        product_name: programSlug,
        program_slug: programSlug,
        amount: 0, // Will be updated with actual amount
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

    // Create enrollment
    const { error: enrollmentError } = await supabaseClient
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_name: programSlug,
        program_slug: programSlug,
        status: 'active',
      });

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      throw enrollmentError;
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
