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
  session_id?: string;
}

// Enhanced rate limiting with burst capacity for high traffic scenarios
const rateLimitStore = new Map<string, { count: number; resetTime: number; burstCount: number; burstResetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 50; // 50 requests per minute per IP (increased for high traffic)
const BURST_LIMIT_WINDOW = 10000; // 10 seconds for burst detection
const BURST_LIMIT_MAX = 15; // 15 requests per 10 seconds burst limit

// Performance monitoring
const performanceMetrics = new Map<string, number>();
let totalRequests = 0;
let successfulRequests = 0;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT_WINDOW,
      burstCount: 1,
      burstResetTime: now + BURST_LIMIT_WINDOW
    });
    return true;
  }
  
  // Check burst limit (short-term)
  if (now > userLimit.burstResetTime) {
    userLimit.burstCount = 1;
    userLimit.burstResetTime = now + BURST_LIMIT_WINDOW;
  } else {
    userLimit.burstCount++;
    if (userLimit.burstCount > BURST_LIMIT_MAX) {
      console.log(`Burst limit exceeded for IP: ${ip} (${userLimit.burstCount}/${BURST_LIMIT_MAX})`);
      return false;
    }
  }
  
  // Check regular rate limit
  if (userLimit.count >= RATE_LIMIT_MAX) {
    console.log(`Rate limit exceeded for IP: ${ip} (${userLimit.count}/${RATE_LIMIT_MAX})`);
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Cleanup old rate limit entries to prevent memory leaks
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [ip, limit] of rateLimitStore.entries()) {
    if (now > limit.resetTime && now > limit.burstResetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Log performance metrics
function logPerformanceMetrics(): void {
  totalRequests++;
  console.log(`Performance metrics - Total: ${totalRequests}, Success rate: ${(successfulRequests/totalRequests*100).toFixed(2)}%`);
  
  if (totalRequests % 100 === 0) {
    console.log(`Rate limit store size: ${rateLimitStore.size} entries`);
    cleanupRateLimitStore();
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatPhoneForSMS(phone: string): string {
  if (!phone) return phone;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If it already starts with country code (11 digits starting with 1), just add +
  if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    return `+${cleanPhone}`;
  }
  
  // If it's a 10-digit US number, add +1
  if (cleanPhone.length === 10) {
    return `+1${cleanPhone}`;
  }
  
  // If it's already formatted with + or other country codes, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default to US format if we can't determine
  return `+1${cleanPhone}`;
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
  logPerformanceMetrics();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting - extract only the first IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIP = forwardedFor 
    ? forwardedFor.split(',')[0].trim()
    : req.headers.get("x-real-ip") || "unknown";

  // Check rate limit with enhanced burst protection
  if (!checkRateLimit(clientIP)) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please try again later.",
        retryAfter: 60,
        processingTime: Date.now() - startTime
      }),
      {
        status: 429,
        headers: { 
          "Content-Type": "application/json", 
          "Retry-After": "60",
          ...corsHeaders 
        },
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
      tags,
      session_id 
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

    console.log("Mailchimp API Key exists:", !!mailchimpApiKey);
    console.log("Mailchimp List ID exists:", !!listId);
    console.log("Processing subscription for:", email);

    if (!mailchimpApiKey || !listId) {
      console.error("Missing Mailchimp API key or List ID");
      console.error("API Key present:", !!mailchimpApiKey);
      console.error("List ID present:", !!listId);
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
    console.log("Extracted datacenter:", datacenter);
    
    // Create MD5 hash of email for subscriber ID (required by Mailchimp API)
    const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const emailHash = Array.from(
      new Uint8Array(await crypto.crypto.subtle.digest("MD5", encoder.encode(email.toLowerCase())))
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;
    const tagsUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}/tags`;

    console.log("Member URL:", memberUrl);
    console.log("Email hash:", emailHash);
    console.log("Subscribing/Updating Mailchimp member for:", email);
    console.log("Phone number being sent:", phone);

    // STEP 1: Create/update member with basic info (no SMS fields initially)
    console.log("STEP 1: Creating/updating member with basic info");
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
            PHONE: phone, // Only regular phone field first
            ADDRESS: city, // Use city as address to satisfy Mailchimp requirement
            ...(workshop_name && { WORKSHOP: workshop_name }),
            ...(purchase_amount && { AMOUNT: purchase_amount }),
            ...(purchase_date && { PURCHDATE: new Date(purchase_date).toISOString().split('T')[0] }),
            ...(payment_status && { PAYSTATUS: payment_status }),
            ...(source && { SOURCE: source }),
            ...(session_id && { SESSIONID: session_id }),
            ...(session_id && { THANKURL: `https://hi.ladybosslook.com/payment-success?session_id=${session_id}` }),
          },
          marketing_permissions: [
            {
              marketing_permission_id: "email",
              enabled: true
            }
          ],
        }),
      });

      const data = await response.json();
      console.log("STEP 1 - Mailchimp API Response status:", response.status);
      console.log("STEP 1 - Mailchimp API Response data:", JSON.stringify(data));
      return { response, data };
    }, 3, 1000);

    // STEP 2: Update member with SMS phone field and SMS marketing consent
    if (response.ok && phone) {
      console.log("STEP 2: Updating member with SMS phone field");
      const formattedSmsPhone = formatPhoneForSMS(phone);
      console.log(`Formatting phone for SMS: ${phone} → ${formattedSmsPhone}`);
      
      try {
        const smsResponse = await fetch(memberUrl, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${mailchimpApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merge_fields: {
              SMSPHONE: formattedSmsPhone, // Format phone for SMS field
            },
            marketing_permissions: [
              {
                marketing_permission_id: "email",
                enabled: true
              },
              {
                marketing_permission_id: "sms",
                enabled: true
              }
            ],
          }),
        });

        const smsData = await smsResponse.json();
        console.log("STEP 2 - SMS update Response status:", smsResponse.status);
        console.log("STEP 2 - SMS update Response data:", JSON.stringify(smsData));
        
        // Log final merge fields to debug SMS phone field
        if (smsData.merge_fields) {
          console.log("Final merge fields:", smsData.merge_fields);
          console.log("Final PHONE field:", smsData.merge_fields.PHONE);
          console.log("Final SMSPHONE field:", smsData.merge_fields.SMSPHONE);
        }
      } catch (smsError) {
        console.error("STEP 2 failed - SMS phone update error:", smsError);
      }
    }

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
        
        console.log("Tags response status:", tagsResponse.status);
        
        // Handle response - Mailchimp tags API sometimes returns empty body on success
        if (tagsResponse.status === 204) {
          console.log("Tags added successfully (no content response)");
        } else if (tagsResponse.ok) {
          try {
            const tagsData = await tagsResponse.json();
            console.log("Tags added successfully with data:", tagsData);
          } catch (parseError) {
            console.log("Tags added successfully (empty response body)");
          }
        } else {
          try {
            const tagsData = await tagsResponse.json();
            console.error("Error adding tags:", tagsData);
          } catch (parseError) {
            console.error("Error adding tags - status:", tagsResponse.status, "Unable to parse response");
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
        successfulRequests++;
        
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
        
        const processingTime = Date.now() - startTime;
        console.log(`Member update processed in ${processingTime}ms`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Member updated successfully",
            member_id: data.id || emailHash,
            processingTime
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
    successfulRequests++;

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

    const processingTime = Date.now() - startTime;
    console.log(`Request processed successfully in ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully created/updated member",
        member_id: data.id || emailHash,
        processingTime
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in mailchimp-subscribe function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
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
        errorName: error.name,
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