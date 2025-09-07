import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
  name: string;
  city: string;
  phone: string;
  source?: string;
  workshop_name?: string;
  purchase_amount?: number;
  purchase_date?: string;
  payment_status?: string;
  tags?: string[];
}

// Rate limiting using in-memory store (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting - extract only the first IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIP = forwardedFor 
    ? forwardedFor.split(',')[0].trim()
    : req.headers.get("x-real-ip") || "unknown";

  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please try again later.",
        retryAfter: 60
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  let supabase: any = null;
  let formSubmissionId: string | null = null;

  try {
    const { 
      email, 
      name, 
      city, 
      phone, 
      source, 
      workshop_name, 
      purchase_amount, 
      purchase_date, 
      payment_status, 
      tags 
    }: SubscribeRequest = await req.json();

    // Initialize Supabase client for backup storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Store form submission as backup immediately
      try {
        const { data: formData, error: formError } = await supabase
          .from('form_submissions')
          .insert({
            email,
            name,
            city,
            phone,
            source: source || 'landing_page',
            user_agent: req.headers.get("user-agent"),
            ip_address: clientIP !== "unknown" ? clientIP : null,
            mailchimp_success: false
          })
          .select('id')
          .single();

        if (formError) {
          console.error("Error storing form submission:", formError);
        } else {
          formSubmissionId = formData?.id;
        console.log(`Form submission stored with ID: ${formSubmissionId}`);
        }
      } catch (backupError) {
        console.error("Backup storage failed:", backupError);
        // Continue with Mailchimp even if backup fails
      }
    }

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
    
    // Create MD5 hash of email for subscriber ID (required by Mailchimp API)
    const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const emailHash = Array.from(
      new Uint8Array(await crypto.crypto.subtle.digest("MD5", encoder.encode(email.toLowerCase())))
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;
    const tagsUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}/tags`;

    console.log("Subscribing/Updating Mailchimp member (admin access required to view details)");

    // Use retry mechanism for Mailchimp API call - Use PUT to create or update
    const { response, data } = await retryWithBackoff(async () => {
      const response = await fetch(memberUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${mailchimpApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: "subscribed",
          merge_fields: {
            FNAME: name,
            CITY: city,
            PHONE: phone, // Standard phone field - this should work for SMS if configured properly in Mailchimp
            ADDRESS: city, // Use city as address to satisfy Mailchimp requirement
            ...(workshop_name && { WORKSHOP: workshop_name }),
            ...(purchase_amount && { AMOUNT: purchase_amount }),
            ...(purchase_date && { PURCHDATE: new Date(purchase_date).toISOString().split('T')[0] }),
            ...(payment_status && { PAYSTATUS: payment_status }),
            ...(source && { SOURCE: source }),
          },
        }),
      });

      const data = await response.json();
      return { response, data };
    }, 3, 1000);

    // If member was created/updated successfully, add tags
    if (response.ok && tags && tags.length > 0) {
      console.log("Adding tags to member:", tags);
      try {
        const tagsResponse = await fetch(tagsUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${mailchimpApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tags: tags.map(tag => ({ name: tag, status: "active" }))
          }),
        });
        
        if (!tagsResponse.ok) {
          const tagsError = await tagsResponse.text();
          console.error("Error adding tags:", tagsError);
        } else {
          // Only try to parse JSON if response is OK
          try {
            const tagsData = await tagsResponse.json();
            console.log("Tags added successfully:", tagsData);
          } catch (jsonError) {
            console.log("Tags added successfully (no response body)");
          }
        }
      } catch (tagError) {
        console.error("Error adding tags:", tagError);
      }
    }

    if (!response.ok) {
      console.error("Mailchimp API error:", data);
      
      // Update backup record with error
      if (supabase && formSubmissionId) {
        try {
          await supabase
            .from('form_submissions')
            .update({ 
              mailchimp_error: JSON.stringify(data),
              mailchimp_success: false 
            })
            .eq('id', formSubmissionId);
        } catch (updateError) {
          console.error("Error updating form submission:", updateError);
        }
      }
      
      // Handle already subscribed case gracefully - but this shouldn't happen with PUT method
      if (data.title === "Member Exists") {
        console.log("Member updated successfully");
        
        // Update backup record as successful for existing members
        if (supabase && formSubmissionId) {
          try {
            await supabase
              .from('form_submissions')
              .update({ 
                mailchimp_success: true,
                mailchimp_error: "Member updated"
              })
              .eq('id', formSubmissionId);
          } catch (updateError) {
            console.error("Error updating form submission:", updateError);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Member updated successfully",
            member_id: data.id || emailHash,
            processingTime: Date.now() - startTime
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // For other errors, return failure but data is still saved in backup
      return new Response(
        JSON.stringify({ 
          error: data.detail || "Failed to subscribe",
          backup_saved: formSubmissionId ? true : false,
          processingTime: Date.now() - startTime
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Member created/updated successfully");

    // Update backup record as successful
    if (supabase && formSubmissionId) {
      try {
        await supabase
          .from('form_submissions')
          .update({ 
            mailchimp_success: true,
            mailchimp_error: null
          })
          .eq('id', formSubmissionId);
      } catch (updateError) {
        console.error("Error updating form submission:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully created/updated member",
        member_id: data.id || emailHash,
        processingTime: Date.now() - startTime
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in mailchimp-subscribe function:", error);
    
    // Update backup record with error if we have one
    if (supabase && formSubmissionId) {
      try {
        await supabase
          .from('form_submissions')
          .update({ 
            mailchimp_error: error.message,
            mailchimp_success: false
          })
          .eq('id', formSubmissionId);
      } catch (updateError) {
        console.error("Error updating form submission with error:", updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        backup_saved: formSubmissionId ? true : false,
        processingTime: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);