import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing Mailchimp integration for Courageous Character Workshop');

    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Use real email and phone for proper Mailchimp testing
    // Fake emails get cleaned by Mailchimp and SMS needs real numbers
    const timestamp = Date.now();
    const uniqueId = `test_${timestamp}`;
    
    const testData = {
      email: "ladybosslookshop@gmail.com", // Real email that won't be filtered
      name: `Lady Boss Look Shop ${uniqueId}`,
      city: "Irvine",
      phone: "9495723730", // Real phone for SMS testing
      source: "workshop_test",
      workshop_name: "Courageous Character Workshop",
      purchase_amount: 9700, // $97 in cents (correct price)
      purchase_date: new Date().toISOString(),
      payment_status: "paid",
      tags: ["workshop_courageous_character", "test_customer"]
    };

    console.log('Sending test subscription with random data:', testData);

    const mailchimpResponse = await supabase.functions.invoke('mailchimp-subscribe', {
      body: testData
    });

    console.log('Mailchimp test subscription result:', mailchimpResponse);

    return new Response(JSON.stringify({
      success: true,
      message: "Test subscription sent to Mailchimp",
      testData: testData,
      mailchimpResponse: mailchimpResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in test-mailchimp function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});