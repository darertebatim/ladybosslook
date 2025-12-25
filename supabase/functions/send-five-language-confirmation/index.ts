import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
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
        sent: 0,
        failed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique emails
    const uniqueEmails = new Map<string, string>();
    for (const order of orders) {
      if (order.email && !uniqueEmails.has(order.email.toLowerCase())) {
        uniqueEmails.set(order.email.toLowerCase(), order.name || "");
      }
    }

    console.log(`Found ${uniqueEmails.size} unique Five Language customers`);

    const results = {
      sent: 0,
      failed: 0,
      emails: [] as string[],
      errors: [] as string[],
    };

    // Send emails
    for (const [email, name] of uniqueEmails) {
      try {
        const firstName = name.split(" ")[0] || "عزیزم";
        
        const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Tahoma', 'Arial', sans-serif; background-color: #f8f4ff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(128, 90, 213, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #805AD5 0%, #9F7AEA 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✨ پنج زبان زن قدرتمند ✨</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Five Language of Empowered Woman</p>
    </div>
    
    <!-- Farsi Content -->
    <div style="padding: 30px; direction: rtl; text-align: right;">
      <h2 style="color: #805AD5; margin: 0 0 20px 0;">سلام ${firstName} عزیزم! 💜</h2>
      
      <div style="background-color: #f0fff4; border-right: 4px solid #48BB78; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #276749; margin: 0; font-size: 16px;">
          ✅ <strong>پرداخت شما با موفقیت ثبت شد!</strong>
        </p>
      </div>
      
      <p style="color: #4a5568; line-height: 1.8; font-size: 15px;">
        خیلی خوشحالم که تصمیم گرفتی در این چالش شرکت کنی! 🎉
      </p>
      
      <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #805AD5; margin: 0 0 15px 0;">📋 اطلاعات چالش:</h3>
        <ul style="color: #4a5568; line-height: 2; padding-right: 20px; margin: 0;">
          <li>🌟 این یک چالش ۱۰ شب در کانال خصوصی تلگرام است</li>
          <li>📅 تاریخ شروع: <strong>۵ ژانویه ۲۰۲۶</strong></li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #0088cc 0%, #00a8e8 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">
          📱 برای دریافت لینک کانال خصوصی، لطفاً به تلگرام پیام بدهید:
        </p>
        <a href="https://t.me/ladybosslook" style="display: inline-block; background-color: #ffffff; color: #0088cc; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
          👉 t.me/ladybosslook
        </a>
      </div>
      
      <p style="color: #805AD5; font-size: 16px; margin-top: 25px;">
        با عشق و انرژی مثبت ❤️<br>
        <strong>رازیه</strong>
      </p>
    </div>
    
    <!-- Divider -->
    <div style="border-top: 2px dashed #e2e8f0; margin: 0 30px;"></div>
    
    <!-- English Content -->
    <div style="padding: 30px; direction: ltr; text-align: left;">
      <h2 style="color: #805AD5; margin: 0 0 20px 0;">Hello ${firstName}! 💜</h2>
      
      <div style="background-color: #f0fff4; border-left: 4px solid #48BB78; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #276749; margin: 0; font-size: 16px;">
          ✅ <strong>Your payment has been successfully confirmed!</strong>
        </p>
      </div>
      
      <p style="color: #4a5568; line-height: 1.8; font-size: 15px;">
        I'm so excited that you've decided to join this challenge! 🎉
      </p>
      
      <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #805AD5; margin: 0 0 15px 0;">📋 Challenge Details:</h3>
        <ul style="color: #4a5568; line-height: 2; padding-left: 20px; margin: 0;">
          <li>🌟 This is a 10-night challenge in a private Telegram channel</li>
          <li>📅 Start Date: <strong>January 5, 2026</strong></li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #0088cc 0%, #00a8e8 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">
          📱 To receive the private channel link, please message us on Telegram:
        </p>
        <a href="https://t.me/ladybosslook" style="display: inline-block; background-color: #ffffff; color: #0088cc; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
          👉 t.me/ladybosslook
        </a>
      </div>
      
      <p style="color: #805AD5; font-size: 16px; margin-top: 25px;">
        With love and positive energy ❤️<br>
        <strong>Razie</strong>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f7fafc; padding: 20px; text-align: center;">
      <p style="color: #a0aec0; margin: 0; font-size: 12px;">
        © 2025 Ladyboss Academy | Empowering Women Worldwide
      </p>
    </div>
    
  </div>
</body>
</html>
        `;

        const emailResponse = await resend.emails.send({
          from: "Razie - Ladyboss Academy <onboarding@resend.dev>",
          to: [email],
          subject: "✅ پرداخت شما با موفقیت انجام شد | Your Payment is Confirmed - Five Language",
          html: htmlContent,
        });

        console.log(`Email sent to ${email}:`, emailResponse);

        // Log to email_logs
        await supabase.from("email_logs").insert({
          recipient_email: email,
          status: "success",
          resend_id: (emailResponse as any)?.id || null,
        });

        results.sent++;
        results.emails.push(email);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${email}:`, emailError);
        
        // Log failure
        await supabase.from("email_logs").insert({
          recipient_email: email,
          status: "failed",
          error_message: emailError.message,
        });

        results.failed++;
        results.errors.push(`${email}: ${emailError.message}`);
      }
    }

    console.log("Email sending complete:", results);

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${results.sent} emails, ${results.failed} failed`,
      ...results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-five-language-confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
