import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { email } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Checking Mailchimp member status for:', email);

    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");

    if (!mailchimpApiKey || !listId) {
      console.error("Missing Mailchimp API key or List ID");
      return new Response(JSON.stringify({ error: "Mailchimp configuration missing" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Extract datacenter from API key
    const datacenter = mailchimpApiKey.split("-")[1];
    
    // Create MD5 hash of email for subscriber ID
    const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const emailHash = Array.from(
      new Uint8Array(await crypto.crypto.subtle.digest("MD5", encoder.encode(email.toLowerCase())))
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;

    console.log('Checking member at URL:', memberUrl);

    const response = await fetch(memberUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mailchimpApiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    console.log('Mailchimp member check response:', response.status, JSON.stringify(data));

    if (response.status === 404) {
      return new Response(JSON.stringify({
        exists: false,
        message: "Member not found in Mailchimp list",
        email: email
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: "Failed to check member status",
        details: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    return new Response(JSON.stringify({
      exists: true,
      member: {
        email: data.email_address,
        status: data.status,
        merge_fields: data.merge_fields,
        tags: data.tags || [],
        subscribed_at: data.timestamp_opt,
        last_changed: data.last_changed
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in check-mailchimp-member function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});