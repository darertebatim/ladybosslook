import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Starting Mailchimp amount fix...");
    
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!mailchimpApiKey || !listId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    // Initialize Supabase client with service role for database access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all CCW orders with amount 9700 (in cents)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('email, name, amount, product_name')
      .eq('product_name', 'Courageous Character Course')
      .eq('amount', 9700);

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`Found ${orders?.length || 0} orders to fix`);

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No orders found with incorrect amount",
          updated: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const datacenter = mailchimpApiKey.split("-")[1];
    const results = [];

    // Update each member in Mailchimp
    for (const order of orders) {
      try {
        console.log(`Updating ${order.email}...`);
        
        // Create MD5 hash of email
        const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
        const encoder = new TextEncoder();
        const emailHash = Array.from(
          new Uint8Array(await crypto.crypto.subtle.digest("MD5", encoder.encode(order.email.toLowerCase())))
        ).map(b => b.toString(16).padStart(2, '0')).join('');

        const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;

        const response = await fetch(memberUrl, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${mailchimpApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merge_fields: {
              AMOUNT: "97.00" // Fixed amount as string
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✓ Updated ${order.email} successfully`);
          results.push({
            email: order.email,
            success: true,
            newAmount: "97.00"
          });
        } else {
          const errorData = await response.json();
          console.error(`✗ Failed to update ${order.email}:`, errorData);
          results.push({
            email: order.email,
            success: false,
            error: errorData.detail || errorData.title
          });
        }
      } catch (error) {
        console.error(`✗ Error updating ${order.email}:`, error);
        results.push({
          email: order.email,
          success: false,
          error: (error as Error).message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${orders.length} updated successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Updated ${successCount} out of ${orders.length} records`,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in fix-mailchimp-amounts:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error).message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
