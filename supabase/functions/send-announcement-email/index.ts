import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

console.log('Edge function initialized');
console.log('Resend API Key exists:', !!RESEND_API_KEY);
console.log('Supabase URL exists:', !!supabaseUrl);

if (!RESEND_API_KEY) {
  console.error('CRITICAL: RESEND_API_KEY is not set!');
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
  console.log('Function invoked - Method:', req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting announcement email processing...');
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { announcementId, title, message, targetCourse, badge }: AnnouncementEmailRequest = await req.json();
    
    console.log(`Processing announcement email: ${title}, target: ${targetCourse || 'all'}`);

    // Get target users based on course enrollment
    let userEmails: string[] = [];
    
    if (targetCourse) {
      console.log(`Querying enrollments for course: ${targetCourse}`);
      
      // Get users enrolled in specific course
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('course_name', targetCourse)
        .eq('status', 'active');
      
      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        throw enrollError;
      }
      
      console.log(`Found ${enrollments?.length || 0} enrollments`);
      const userIds = enrollments?.map(e => e.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .in('id', userIds);
        
        if (profileError) {
          console.error('Error fetching profiles:', profileError);
          throw profileError;
        }
        
        userEmails = profiles?.map(p => p.email).filter(email => email) || [];
        console.log(`Retrieved ${userEmails.length} user emails`);
      } else {
        console.log('No enrollments found for this course');
      }
    } else {
      // Get all users
      console.log('Fetching all user profiles');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email');
      
      if (profileError) {
        console.error('Error fetching all profiles:', profileError);
        throw profileError;
      }
      
      userEmails = profiles?.map(p => p.email).filter(email => email) || [];
      console.log(`Retrieved ${userEmails.length} total user emails`);
    }

    console.log(`Sending announcement to ${userEmails.length} users`);

    if (userEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send emails
    const emailPromises = userEmails.map(email => 
      resend.emails.send({
        from: "Razie Mah <support@ladybosslook.com>",
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
                  <a href="https://9d54663c-1af5-4066-9ceb-1723206ae5f8.lovableproject.com/dashboard" class="button">View in Dashboard</a>
                  <div class="footer">
                    <p>This announcement was sent to you based on your course enrollment.</p>
                    <p>© ${new Date().getFullYear()} Razie Mah. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails sent to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`,
        stats: { total: userEmails.length, successful, failed }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending announcement emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
