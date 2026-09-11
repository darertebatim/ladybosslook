import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    // Verify admin authentication
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error(`❌ [${requestId}] No authorization header provided`);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error(`❌ [${requestId}] Invalid authentication:`, authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      console.error(`❌ [${requestId}] User ${user.id} is not an admin`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`✅ [${requestId}] Admin user verified: ${user.id}`);
    
    // Parse and log request body
    const rawBody = await req.text();
    console.log(`📦 [${requestId}] Raw request body length: ${rawBody.length} bytes`);
    
    try {
      requestBody = JSON.parse(rawBody);
      console.log(`📋 [${requestId}] Parsed request body:`, JSON.stringify(requestBody, null, 2));
    } catch (parseError: any) {
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

    // Get target users based on course enrollment
    let userEmails: string[] = [];
    
    if (targetCourse) {
      console.log(`🔍 [${requestId}] Querying enrollments for course: "${targetCourse}"`);
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('program_slug', targetCourse)
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
          const isRtl = /[؀-ۿ]/.test(message + title);
          const dir = isRtl ? 'rtl' : 'ltr';
          const messageHtml = message
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
          const ctaLabel = isRtl ? 'باز کردن اپ ریلو' : 'Open the Rilo App';
          const ctaSub = isRtl
            ? 'این پیام را می‌توانید داخل اپ ببینید و پاسخ دهید'
            : 'You can read and reply to this message inside the app';
          const unsubUrl = `https://ladybosslook.com/unsubscribe?email=${encodeURIComponent(email)}`;
          const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${isRtl ? 'fa' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF7ED;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#FDBA74 0%,#F97316 100%);border-radius:20px 20px 0 0;padding:28px 24px;text-align:center;">
      <div style="color:#fff;font-size:26px;font-weight:800;letter-spacing:0.5px;">Rilo</div>
      <div style="color:#fff;opacity:0.9;font-size:13px;margin-top:4px;">Ladybosslook Academy</div>
    </div>
    <!-- Content -->
    <div style="background:#ffffff;padding:28px 24px;border-radius:0 0 20px 20px;box-shadow:0 2px 12px rgba(249,115,22,0.08);">
      ${badge ? `<div style="display:inline-block;background:#F97316;color:#fff;padding:4px 14px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:14px;">${badge}</div>` : ''}
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.4;color:#1c1917;">${title}</h1>
      <div style="background:#FFF7ED;border-radius:14px;padding:20px;font-size:17px;line-height:1.9;color:#292524;border-${isRtl ? 'right' : 'left'}:4px solid #F97316;">
        ${messageHtml}
      </div>
      ${targetCourse ? `<p style="font-size:14px;color:#78716c;margin:16px 0 0;"><strong>${isRtl ? 'دوره' : 'Program'}:</strong> ${targetCourse}</p>` : ''}
      <div style="text-align:center;margin-top:26px;">
        <a href="https://ladybosslook.com/app" style="display:inline-block;background:linear-gradient(135deg,#FB923C,#EA580C);color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:16px;font-weight:700;">${ctaLabel}</a>
        <p style="font-size:14px;color:#78716c;margin:12px 0 0;">${ctaSub}</p>
        <p style="font-size:13px;margin:10px 0 0;"><a href="https://ladybosslook.com/dashboard/chat" style="color:#F97316;text-decoration:none;">${isRtl ? '💬 پاسخ در چت پشتیبانی' : '💬 Reply in Support Chat'}</a></p>
      </div>
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:20px;color:#a8a29e;font-size:12px;line-height:1.8;">
      <p style="margin:4px 0;">© ${new Date().getFullYear()} Ladybosslook LLC · <a href="https://ladybosslook.com" style="color:#F97316;text-decoration:none;">ladybosslook.com</a></p>
      <p style="margin:4px 0;"><a href="${unsubUrl}" style="color:#a8a29e;text-decoration:underline;">${isRtl ? 'لغو اشتراک ایمیل‌ها' : 'Unsubscribe from emails'}</a></p>
    </div>
  </div>
</body>
</html>`;
          const result = await resend.emails.send({
            from: "Rilo (Ladybosslook) <support@ladybosslook.com>",
            to: [email],
            subject: `${badge ? `[${badge}] ` : ''}${title}`,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            html,
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