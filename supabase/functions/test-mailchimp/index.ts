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

    // Generate random test data for each test
    const randomId = Math.random().toString(36).substring(2, 15);
    const randomPhone = `949${Math.floor(Math.random() * 9000000) + 1000000}`;
    
    const testData = {
      email: `test${randomId}@testdomain.com`,
      name: `Test User ${randomId}`,
      city: "Online",
      phone: randomPhone,
      source: "workshop_test",
      workshop_name: "Courageous Character Workshop",
      purchase_amount: 4700, // $47 in cents
      purchase_date: new Date().toISOString(),
      payment_status: "paid",
      tags: ["workshop_courageous_character"]
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