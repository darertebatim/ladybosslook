import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-MAILCHIMP-CITIES] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
    const mailchimpListId = Deno.env.get('MAILCHIMP_LIST_ID');

    if (!mailchimpApiKey) throw new Error('MAILCHIMP_API_KEY not found');
    if (!mailchimpListId) throw new Error('MAILCHIMP_LIST_ID not found');

    // Extract datacenter from API key
    const datacenter = mailchimpApiKey.split('-')[1];
    if (!datacenter) throw new Error('Invalid Mailchimp API key format');

    logStep("Mailchimp credentials verified", { datacenter });

    // Define the updates needed
    const updates = [
      {
        email: 'faribanaseh@gmail.com',
        city: 'Calgary, Alberta'
      },
      {
        email: 'yeganehkh80@gmail.com', 
        city: 'Ankara'
      }
    ];

    const results = [];

    for (const update of updates) {
      try {
        logStep(`Processing update for ${update.email}`, { city: update.city });

        // Generate email hash for Mailchimp member ID
        const emailHash = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              'MD5',
              new TextEncoder().encode(update.email.toLowerCase())
            )
          )
        ).map(b => b.toString(16).padStart(2, '0')).join('');

        logStep(`Email hash generated for ${update.email}`, { hash: emailHash });

        // Update member city in Mailchimp
        const updateUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members/${emailHash}`;
        
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${mailchimpApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merge_fields: {
              CITY: update.city
            }
          }),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          logStep(`Update failed for ${update.email}`, { 
            status: updateResponse.status, 
            error: errorText 
          });
          results.push({
            email: update.email,
            success: false,
            error: `HTTP ${updateResponse.status}: ${errorText}`
          });
          continue;
        }

        const updateData = await updateResponse.json();
        logStep(`Successfully updated ${update.email}`, { city: update.city });
        
        results.push({
          email: update.email,
          success: true,
          city: update.city,
          mailchimpResponse: updateData
        });

      } catch (error) {
        logStep(`Error updating ${update.email}`, error);
        results.push({
          email: update.email,
          success: false,
          error: error.message
        });
      }
    }

    logStep("All updates completed", { results });

    return new Response(JSON.stringify({
      success: true,
      message: 'City updates completed',
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in update-mailchimp-cities', { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});