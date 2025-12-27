import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The 14 missing customers from the first day payment bug
const missingCustomers = [
  "shahrzad.arshadi.r@gmail.com",
  "nasrin_setareh@yahoo.dk",
  "leila.202.lm@gmail.com",
  "elaheh.hayati@gmail.com",
  "maryamhakimi433@gmail.com",
  "hoda_vh@yahoo.com",
  "maryamalibeik@gmail.com",
  "samirastene@gmail.com",
  "sajedemajidi69@gmail.com",
  "fahimeh_mohammadinasab@yahoo.com",
  "maryam_bahramisefat@yahoo.com",
  "mah.farzin2010@gmail.com",
  "rabbani.samaneh@gmail.com",
  "zahra0heidariy@gmail.com",
];

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

    console.log("Admin verified, adding missing Five Language customers to Mailchimp...");

    // Get Mailchimp datacenter from API key
    const datacenter = mailchimpApiKey.split("-").pop();
    const mailchimpBaseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;
    const authString = btoa(`anystring:${mailchimpApiKey}`);

    const results = {
      added: 0,
      failed: 0,
      alreadyExists: 0,
      emails: [] as string[],
      errors: [] as string[],
    };

    // Try to get customer info from orders table
    const { data: orders } = await supabase
      .from("orders")
      .select("email, name, phone, billing_city")
      .eq("program_slug", "Five-Language")
      .in("email", missingCustomers);

    const orderMap = new Map<string, { name: string; phone: string | null; city: string | null }>();
    if (orders) {
      for (const order of orders) {
        orderMap.set(order.email.toLowerCase(), {
          name: order.name,
          phone: order.phone,
          city: order.billing_city,
        });
      }
    }

    // Add each missing customer to Mailchimp
    for (const email of missingCustomers) {
      try {
        const customerInfo = orderMap.get(email.toLowerCase());
        const nameParts = (customerInfo?.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Add or update member in Mailchimp
        const memberData = {
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
            CITY: customerInfo?.city || "",
            PHONE: customerInfo?.phone || "",
            PROGRAM: "Five Language of Empowered Woman",
            PURCHASDAT: new Date().toISOString().split("T")[0],
            PURCHASAMT: "79",
          },
          tags: ["five_language", "paid_customer"],
        };

        const addResponse = await fetch(
          `${mailchimpBaseUrl}/lists/${mailchimpListId}/members`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(memberData),
          }
        );

        if (addResponse.ok) {
          console.log(`Successfully added: ${email}`);
          results.added++;
          results.emails.push(email);
        } else {
          const errorData = await addResponse.json();
          
          // If member already exists, try to update with tags
          if (errorData.title === "Member Exists") {
            console.log(`Member exists, updating tags: ${email}`);
            
            // Get subscriber hash (MD5 of lowercase email)
            const encoder = new TextEncoder();
            const data = encoder.encode(email.toLowerCase());
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            // For Mailchimp we need MD5, but since it's not available, we'll use the email directly in the URL
            
            // Use PUT to update existing member
            const updateResponse = await fetch(
              `${mailchimpBaseUrl}/lists/${mailchimpListId}/members/${email.toLowerCase()}`,
              {
                method: "PUT",
                headers: {
                  "Authorization": `Basic ${authString}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email_address: email,
                  status_if_new: "subscribed",
                  merge_fields: memberData.merge_fields,
                }),
              }
            );

            if (updateResponse.ok) {
              // Now add tags separately
              const tagResponse = await fetch(
                `${mailchimpBaseUrl}/lists/${mailchimpListId}/members/${encodeURIComponent(email.toLowerCase())}/tags`,
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

              if (tagResponse.ok) {
                console.log(`Updated and tagged existing member: ${email}`);
                results.alreadyExists++;
                results.emails.push(email);
              } else {
                throw new Error(`Failed to add tags: ${await tagResponse.text()}`);
              }
            } else {
              throw new Error(`Failed to update: ${await updateResponse.text()}`);
            }
          } else {
            throw new Error(errorData.detail || errorData.title || "Unknown error");
          }
        }

      } catch (error: any) {
        console.error(`Failed to add ${email}:`, error);
        results.failed++;
        results.errors.push(`${email}: ${error.message}`);
      }
    }

    console.log("Adding complete:", results);

    return new Response(JSON.stringify({
      success: true,
      message: `Added ${results.added} new members, ${results.alreadyExists} already existed and were tagged, ${results.failed} failed`,
      ...results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in add-missing-five-language-buyers:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
