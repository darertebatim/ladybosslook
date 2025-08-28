import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    console.log(`Sending intro email to: ${email}`);

    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      throw new Error('Gmail SMTP credentials not configured');
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Build Your Courageous Character - LadyBoss Academy</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
          <div style="background: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: #667eea; font-weight: bold; font-size: 24px;">LB</span>
          </div>
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">LadyBoss Academy</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Empowering Persian Women Leaders</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #667eea10; color: #667eea; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
              🎯 Step 1: Rights & Boundaries
            </div>
            <h2 style="margin: 0 0 15px 0; font-size: 32px; font-weight: bold; color: #1a1a1a;">
              Build Your <span style="background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Courageous Character</span>
            </h2>
            <p style="font-size: 18px; color: #666; margin: 0; line-height: 1.5;">
              A powerful 20-minute course designed specifically for Persian immigrant women ready to establish their rights and set healthy boundaries.
            </p>
          </div>

          <!-- Video Preview -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center; border: 2px solid #e9ecef;">
            <div style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="font-size: 32px;">▶</span>
            </div>
            <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 20px;">Watch Your Free Course</h3>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Click below to access your exclusive training</p>
            <a href="https://hi.ladybosslook.com/video" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">
              🎬 Start Watching Now
            </a>
          </div>

          <!-- What You'll Learn -->
          <div style="margin: 30px 0;">
            <h3 style="color: #1a1a1a; font-size: 20px; margin-bottom: 20px; font-weight: bold;">What You'll Master in 20 Minutes:</h3>
            <div style="space-y: 12px;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; margin: 6px 12px 0 0; flex-shrink: 0;"></div>
                <span style="color: #333; font-size: 14px; line-height: 1.5;">Recognize your fundamental rights as an immigrant woman in personal and professional settings</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; margin: 6px 12px 0 0; flex-shrink: 0;"></div>
                <span style="color: #333; font-size: 14px; line-height: 1.5;">Master the art of saying "no" respectfully while maintaining your dignity and relationships</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; margin: 6px 12px 0 0; flex-shrink: 0;"></div>
                <span style="color: #333; font-size: 14px; line-height: 1.5;">Establish clear boundaries in your workplace communications and career advancement</span>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; margin: 6px 12px 0 0; flex-shrink: 0;"></div>
                <span style="color: #333; font-size: 14px; line-height: 1.5;">Communicate assertively while honoring your Persian heritage and cultural values</span>
              </div>
            </div>
          </div>

          <!-- Special Gift -->
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">🎁 Special Gift Waiting</h3>
            <p style="margin: 0 0 15px 0; opacity: 0.9; font-size: 14px;">After watching the video, send the secret code to WhatsApp for your exclusive gift!</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">برای گرفتن هدیه، اسم رمز را به واتسپ بفرستید</p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 40px 0;">
            <h3 style="color: #1a1a1a; font-size: 22px; margin-bottom: 15px;">Ready to Build Your Courage?</h3>
            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">Join thousands of Persian women who have transformed their lives</p>
            <a href="https://hi.ladybosslook.com/video" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin-bottom: 15px;">
              🚀 Access Your Course Now
            </a>
            <p style="color: #999; font-size: 12px; margin: 0;">This course is completely free and takes only 20 minutes</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">LadyBoss Academy</p>
          <p style="margin: 0; color: #999; font-size: 12px;">Empowering Persian immigrant women to lead with courage and confidence</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await client.send({
      from: gmailUser,
      to: email,
      subject: "🎯 Build Your Courageous Character - Free 20-Min Course for Persian Women",
      content: "Access your free Courageous Character course at: https://hi.ladybosslook.com/video",
      html: emailHtml,
    });

    await client.close();
    console.log('Introduction email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Introduction email sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error sending introduction email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);