import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test database connection
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    let dbHealthy = false;
    let dbLatency = 0;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const dbStartTime = Date.now();
      
      try {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('id')
          .limit(1);
        
        dbLatency = Date.now() - dbStartTime;
        dbHealthy = !error;
      } catch (dbError) {
        console.error("Database health check failed:", dbError);
        dbLatency = Date.now() - dbStartTime;
      }
    }

    // Check Mailchimp API connectivity
    let mailchimpHealthy = false;
    let mailchimpLatency = 0;
    
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");
    
    if (mailchimpApiKey && listId) {
      const datacenter = mailchimpApiKey.split("-")[1];
      const mailchimpStartTime = Date.now();
      
      try {
        const response = await fetch(`https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${mailchimpApiKey}`,
          },
        });
        
        mailchimpLatency = Date.now() - mailchimpStartTime;
        mailchimpHealthy = response.ok;
      } catch (mailchimpError) {
        console.error("Mailchimp health check failed:", mailchimpError);
        mailchimpLatency = Date.now() - mailchimpStartTime;
      }
    }

    const totalResponseTime = Date.now() - startTime;
    const overallHealthy = dbHealthy && mailchimpHealthy;

    const healthStatus = {
      status: overallHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: {
        database: {
          healthy: dbHealthy,
          latency: dbLatency
        },
        mailchimp: {
          healthy: mailchimpHealthy,
          latency: mailchimpLatency
        }
      },
      memory: {
        used: (Deno.memoryUsage?.() || 0) / 1024 / 1024, // MB
      }
    };

    console.log("Health check completed:", healthStatus);

    return new Response(
      JSON.stringify(healthStatus),
      {
        status: overallHealthy ? 200 : 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Health check error:", error);
    
    return new Response(
      JSON.stringify({ 
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);