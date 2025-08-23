import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
  name: string;
  city: string;
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, city, phone }: SubscribeRequest = await req.json();

    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");

    if (!mailchimpApiKey || !listId) {
      console.error("Missing Mailchimp API key or List ID");
      return new Response(
        JSON.stringify({ error: "Mailchimp configuration missing" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Extract datacenter from API key (e.g., us1, us2, etc.)
    const datacenter = mailchimpApiKey.split("-")[1];
    
    const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members`;

    console.log("Subscribing to Mailchimp:", { email, name, city, phone });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mailchimpApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: name,
          CITY: city,
          PHONE: phone,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mailchimp API error:", data);
      
      // Handle already subscribed case gracefully
      if (data.title === "Member Exists") {
        console.log("User already subscribed:", email);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Already subscribed",
            member_id: data.detail?.split("'")[1] || null
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: data.detail || "Failed to subscribe" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Successfully subscribed:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully subscribed",
        member_id: data.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in mailchimp-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);