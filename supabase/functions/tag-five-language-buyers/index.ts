import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MD5 hash function for Mailchimp subscriber hash
async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY")!;
    const mailchimpListId = Deno.env.get("MAILCHIMP_LIST_ID")!;

    if (!mailchimpApiKey || !mailchimpListId) {
      throw new Error("Missing Mailchimp configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin verified, fetching Five Language customers...");

    // Get unique emails from orders for Five-Language program
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("email, name")
      .eq("program_slug", "Five-Language")
      .in("status", ["paid", "completed"]);

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No Five Language customers found",
        tagged: 0,
        failed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique emails
    const uniqueEmails = new Set<string>();
    for (const order of orders) {
      if (order.email) {
        uniqueEmails.add(order.email.toLowerCase().trim());
      }
    }

    console.log(`Found ${uniqueEmails.size} unique Five Language customers`);

    // Get Mailchimp datacenter from API key
    const datacenter = mailchimpApiKey.split("-").pop();
    const mailchimpBaseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;
    const authString = btoa(`anystring:${mailchimpApiKey}`);

    const results = {
      tagged: 0,
      failed: 0,
      notFound: 0,
      alreadyTagged: 0,
      emails: [] as string[],
      errors: [] as string[],
    };

    // Add tag to each subscriber
    for (const email of uniqueEmails) {
      try {
        const subscriberHash = await md5(email);
        
        // First, check if member exists
        const checkResponse = await fetch(
          `${mailchimpBaseUrl}/lists/${mailchimpListId}/members/${subscriberHash}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!checkResponse.ok) {
          if (checkResponse.status === 404) {
            console.log(`Member not found in Mailchimp: ${email}`);
            results.notFound++;
            results.errors.push(`${email}: Not found in Mailchimp`);
            continue;
          }
          throw new Error(`Failed to check member: ${checkResponse.status}`);
        }

        const memberData = await checkResponse.json();
        const existingTags = memberData.tags?.map((t: any) => t.name) || [];
        
        if (existingTags.includes("five_language")) {
          console.log(`Already tagged: ${email}`);
          results.alreadyTagged++;
          results.emails.push(email);
          continue;
        }

        // Add the five_language tag
        const tagResponse = await fetch(
          `${mailchimpBaseUrl}/lists/${mailchimpListId}/members/${subscriberHash}/tags`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tags: [
                { name: "five_language", status: "active" },
                { name: "paid_customer", status: "active" }
              ]
            }),
          }
        );

        if (!tagResponse.ok) {
          const errorText = await tagResponse.text();
          throw new Error(`Failed to add tag: ${tagResponse.status} - ${errorText}`);
        }

        console.log(`Successfully tagged: ${email}`);
        results.tagged++;
        results.emails.push(email);

      } catch (error: any) {
        console.error(`Failed to tag ${email}:`, error);
        results.failed++;
        results.errors.push(`${email}: ${error.message}`);
      }
    }

    console.log("Tagging complete:", results);

    return new Response(JSON.stringify({
      success: true,
      message: `Tagged ${results.tagged} members, ${results.alreadyTagged} already tagged, ${results.notFound} not found, ${results.failed} failed`,
      ...results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in tag-five-language-buyers:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
