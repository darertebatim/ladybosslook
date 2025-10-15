import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

console.log('🚀 Edge function initialized');
console.log('🔑 Resend API Key exists:', !!RESEND_API_KEY);
console.log('🔑 Supabase URL exists:', !!supabaseUrl);

if (!RESEND_API_KEY) {
  console.error('🚨 CRITICAL: RESEND_API_KEY is not set!');
}

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnnouncementEmailRequest {
  announcementId: string;
  title: string;
  message: string;
  targetCourse?: string;
  badge?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📨 [${requestId}] NEW REQUEST - ${new Date().toISOString()}`);
  console.log(`🌐 [${requestId}] Method: ${req.method}`);
  console.log(`🌐 [${requestId}] URL: ${req.url}`);
  
  if (req.method === "OPTIONS") {
    console.log(`✅ [${requestId}] CORS preflight - returning 200`);
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any = null;
  
  try {
    // Parse and log request body
    const rawBody = await req.text();
    console.log(`📦 [${requestId}] Raw request body length: ${rawBody.length} bytes`);
    
    try {
      requestBody = JSON.parse(rawBody);
      console.log(`📋 [${requestId}] Parsed request body:`, JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error(`❌ [${requestId}] Failed to parse JSON:`, parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    // Validate required fields
    const { announcementId, title, message, targetCourse, badge } = requestBody as AnnouncementEmailRequest;
    
    if (!announcementId || !title || !message) {
      console.error(`❌ [${requestId}] Missing required fields:`, {
        hasAnnouncementId: !!announcementId,
        hasTitle: !!title,
        hasMessage: !!message
      });
      throw new Error('Missing required fields: announcementId, title, or message');
    }
    
    console.log(`✅ [${requestId}] Request validation passed`);
    console.log(`📝 [${requestId}] Announcement: "${title}"`);
    console.log(`🎯 [${requestId}] Target course: ${targetCourse || 'ALL USERS'}`);
    console.log(`🏷️  [${requestId}] Badge: ${badge || 'none'}`);
    
    if (!RESEND_API_KEY) {
      console.error(`🚨 [${requestId}] RESEND_API_KEY is not configured`);
      throw new Error('Email service not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`✅ [${requestId}] Supabase client created`);

    // Get target users based on course enrollment
    let userEmails: string[] = [];
    
    if (targetCourse) {
      console.log(`🔍 [${requestId}] Querying enrollments for course: "${targetCourse}"`);
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('course_name', targetCourse)
        .eq('status', 'active');
      
      if (enrollError) {
        console.error(`❌ [${requestId}] Enrollment query error:`, enrollError);
        throw enrollError;
      }
      
      console.log(`📊 [${requestId}] Found ${enrollments?.length || 0} active enrollments`);
      const userIds = enrollments?.map(e => e.user_id) || [];
      
      if (userIds.length > 0) {
        console.log(`👥 [${requestId}] Fetching profiles for ${userIds.length} users`);
        
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .in('id', userIds)
          .not('email', 'is', null);
        
        if (profileError) {
          console.error(`❌ [${requestId}] Profile query error:`, profileError);
          throw profileError;
        }
        
        userEmails = profiles?.map(p => p.email).filter(email => email) || [];
        console.log(`✅ [${requestId}] Retrieved ${userEmails.length} valid emails`);
        console.log(`📧 [${requestId}] Email list:`, userEmails);
      } else {
        console.log(`⚠️  [${requestId}] No active enrollments found for this course`);
      }
    } else {
      console.log(`🔍 [${requestId}] Fetching ALL user profiles`);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .not('email', 'is', null);
      
      if (profileError) {
        console.error(`❌ [${requestId}] Profile query error:`, profileError);
        throw profileError;
      }
      
      userEmails = profiles?.map(p => p.email).filter(email => email) || [];
      console.log(`✅ [${requestId}] Retrieved ${userEmails.length} total user emails`);
      console.log(`📧 [${requestId}] Email list:`, userEmails);
    }

    if (userEmails.length === 0) {
      console.log(`⚠️  [${requestId}] No users to notify - returning success`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No users to notify",
          stats: { total: 0, successful: 0, failed: 0 }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`📧 [${requestId}] Starting email send to ${userEmails.length} recipients`);

    // Send emails and track results
    const emailResults = await Promise.allSettled(
      userEmails.map(async (email) => {
        console.log(`📤 [${requestId}] Sending to: ${email}`);
        
        try {
          const result = await resend.emails.send({
            from: "Support Ladyboss <support@ladybosslook.com>",
            to: [email],
            subject: `${badge ? `[${badge}] ` : ''}${title}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
                    .message { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0;">${title}</h1>
                    </div>
                    <div class="content">
                      ${badge ? `<span class="badge">${badge}</span>` : ''}
                      <div class="message">
                        ${message.replace(/\n/g, '<br>')}
                      </div>
                      ${targetCourse ? `<p><strong>Course:</strong> ${targetCourse}</p>` : ''}
                      <a href="https://ladybosslook.com/dashboard" class="button">View in Dashboard</a>
                      <div class="footer">
                        <p>This announcement was sent to you based on your course enrollment.</p>
                        <p>© ${new Date().getFullYear()} Ladybosslook Academy. All rights reserved.</p>
                        <p><a href="https://ladybosslook.com" style="color: #667eea; text-decoration: none;">ladybosslook.com</a></p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
          
          console.log(`✅ [${requestId}] Email sent to ${email}:`, result);
          
          // Log to email_logs table
          await supabase.from('email_logs').insert({
            announcement_id: announcementId,
            recipient_email: email,
            status: 'success',
            resend_id: result.data?.id
          });
          
          return { email, success: true, result };
        } catch (error: any) {
          console.error(`❌ [${requestId}] Failed to send to ${email}:`, error);
          
          // Log failure to email_logs table
          await supabase.from('email_logs').insert({
            announcement_id: announcementId,
            recipient_email: email,
            status: 'failed',
            error_message: error.message
          });
          
          throw error;
        }
      })
    );

    const successful = emailResults.filter(r => r.status === 'fulfilled').length;
    const failed = emailResults.filter(r => r.status === 'rejected').length;

    console.log(`\n📊 [${requestId}] EMAIL SUMMARY:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📧 Total: ${userEmails.length}`);
    
    if (failed > 0) {
      const failedEmails = emailResults
        .filter(r => r.status === 'rejected')
        .map((r: any) => r.reason);
      console.log(`   ⚠️  Failed emails:`, failedEmails);
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails sent to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`,
        stats: { total: userEmails.length, successful, failed }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error(`\n🚨 [${requestId}] CRITICAL ERROR:`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`   Full error:`, error);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        requestId: requestId,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);