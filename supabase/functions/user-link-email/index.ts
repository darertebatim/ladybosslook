import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(RESEND_API_KEY);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildCodeEmail(code: string, lang: "fa" | "en") {
  const rtl = lang === "fa";
  const t = rtl
    ? {
        title: "کد تایید ایمیل خرید",
        intro:
          "برای اتصال این ایمیل به حساب کاربری‌تان در ریلو، کد زیر را در اپ وارد کنید.",
        note: "این کد تا ۱۰ دقیقه معتبر است. اگر شما درخواست نکرده‌اید، این ایمیل را نادیده بگیرید.",
      }
    : {
        title: "Your verification code",
        intro:
          "Enter this code in the Rilo app to link this email to your account.",
        note: "This code is valid for 10 minutes. If you didn't request it, you can ignore this email.",
      };

  return `<!DOCTYPE html>
<html dir="${rtl ? "rtl" : "ltr"}">
  <body style="margin:0;padding:24px;background:#FFF7F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;text-align:center;">
      <h1 style="margin:0 0 14px;font-size:22px;color:#2B1A12;">🔐 ${t.title}</h1>
      <p style="margin:0 0 22px;color:#4A3527;font-size:15px;line-height:1.7;">${t.intro}</p>
      <div style="display:inline-block;background:#FFF1E6;color:#F26B21;font-size:34px;font-weight:800;letter-spacing:10px;padding:16px 26px;border-radius:14px;">${code}</div>
      <p style="margin:22px 0 0;color:#7A5C4A;font-size:13px;line-height:1.7;">${t.note}</p>
    </div>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = (req.headers.get("Authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user?.id) {
      console.error("auth failed:", userErr?.message);
      return json({ error: "not_authenticated" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const lang: "fa" | "en" = body.lang === "fa" ? "fa" : "en";
    const email = String(body.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "invalid_email" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const currentEmail = (user.email || "").toLowerCase();

    if (action === "send-code") {
      if (!RESEND_API_KEY) return json({ error: "email_not_configured" }, 500);
      if (email === currentEmail) return json({ error: "same_email" }, 400);

      const { data: existingAlias } = await admin
        .from("account_email_aliases")
        .select("primary_user_id")
        .eq("email", email)
        .maybeSingle();

      if (existingAlias) {
        if (existingAlias.primary_user_id === user.id) {
          return json({ error: "already_linked" }, 400);
        }
        return json({ error: "claimed_by_other" }, 400);
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await sha256(`${user.id}:${email}:${code}`);

      // Invalidate older pending codes for this pair
      await admin
        .from("email_link_verifications")
        .delete()
        .eq("user_id", user.id)
        .eq("email", email)
        .is("consumed_at", null);

      const { error: insErr } = await admin
        .from("email_link_verifications")
        .insert({
          user_id: user.id,
          email,
          code_hash: codeHash,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      if (insErr) {
        console.error("insert verification failed:", insErr);
        return json({ error: "could_not_start" }, 500);
      }

      const { error: sendErr } = await resend.emails.send({
        from: "Ladyboss Academy <hi@ladybosslook.com>",
        to: [email],
        subject:
          lang === "fa"
            ? `کد تایید شما: ${code}`
            : `Your verification code: ${code}`,
        html: buildCodeEmail(code, lang),
      });

      if (sendErr) {
        console.error("Resend error:", sendErr);
        return json({ error: "could_not_send" }, 502);
      }

      return json({ success: true });
    }

    if (action === "verify-and-merge") {
      const code = String(body.code || "").trim();
      if (!/^\d{6}$/.test(code)) return json({ error: "invalid_code" }, 400);

      const { data: rows } = await admin
        .from("email_link_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("email", email)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      const record = rows?.[0];
      if (!record) return json({ error: "no_pending_code" }, 400);
      if (new Date(record.expires_at).getTime() < Date.now()) {
        return json({ error: "code_expired" }, 400);
      }
      if ((record.attempts ?? 0) >= 5) {
        return json({ error: "too_many_attempts" }, 429);
      }

      const codeHash = await sha256(`${user.id}:${email}:${code}`);
      if (codeHash !== record.code_hash) {
        await admin
          .from("email_link_verifications")
          .update({ attempts: (record.attempts ?? 0) + 1 })
          .eq("id", record.id);
        return json({ error: "wrong_code" }, 400);
      }

      await admin
        .from("email_link_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", record.id);

      // --- Merge (same logic as the admin merge tool) ---
      const { data: secondaryProfile } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      const secondaryId =
        secondaryProfile && secondaryProfile.id !== user.id
          ? secondaryProfile.id
          : null;

      let mergedOrders = 0;
      let mergedEnrollments = 0;
      let mergedSubscriptions = 0;

      const { data: ordersToTransfer } = await admin
        .from("orders")
        .select("id")
        .ilike("email", email);

      if (ordersToTransfer && ordersToTransfer.length > 0) {
        const { error: updErr } = await admin
          .from("orders")
          .update({ user_id: user.id })
          .ilike("email", email);
        if (!updErr) mergedOrders = ordersToTransfer.length;
      }

      if (secondaryId) {
        await admin
          .from("orders")
          .update({ user_id: user.id })
          .eq("user_id", secondaryId);

        const { data: enrollments } = await admin
          .from("course_enrollments")
          .select("id, program_slug, round_id")
          .eq("user_id", secondaryId);

        if (enrollments && enrollments.length > 0) {
          const { data: existing } = await admin
            .from("course_enrollments")
            .select("program_slug, round_id")
            .eq("user_id", user.id);

          const existingSet = new Set(
            (existing || []).map((e) => `${e.program_slug}-${e.round_id}`),
          );

          for (const en of enrollments) {
            const key = `${en.program_slug}-${en.round_id}`;
            if (!existingSet.has(key)) {
              const { error } = await admin
                .from("course_enrollments")
                .update({ user_id: user.id })
                .eq("id", en.id);
              if (!error) mergedEnrollments++;
            } else {
              await admin
                .from("course_enrollments")
                .delete()
                .eq("id", en.id);
            }
          }
        }

        const { data: subs } = await admin
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", secondaryId);

        if (subs && subs.length > 0) {
          const { data: primarySubs } = await admin
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", user.id);

          if (!primarySubs || primarySubs.length === 0) {
            const { error: subErr } = await admin
              .from("user_subscriptions")
              .update({ user_id: user.id })
              .eq("user_id", secondaryId);
            if (!subErr) mergedSubscriptions = subs.length;
          }
        }

        await admin
          .from("cart_items")
          .update({ user_id: user.id })
          .eq("user_id", secondaryId);

        await admin
          .from("account_email_aliases")
          .update({ primary_user_id: user.id })
          .eq("primary_user_id", secondaryId);
      }

      const { error: aliasError } = await admin
        .from("account_email_aliases")
        .upsert(
          {
            primary_user_id: user.id,
            email,
            merged_from_user_id: secondaryId,
            merged_by: user.id,
          },
          { onConflict: "email" },
        );

      if (aliasError) console.error("alias upsert failed:", aliasError);

      if (currentEmail) {
        await admin
          .from("account_email_aliases")
          .delete()
          .eq("email", currentEmail);
      }

      console.log(
        `Self-merge ${email} -> ${currentEmail}: orders=${mergedOrders}, enrollments=${mergedEnrollments}`,
      );

      return json({
        success: true,
        email,
        mergedOrders,
        mergedEnrollments,
        mergedSubscriptions,
      });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("user-link-email error:", e);
    return json({ error: String(e) }, 500);
  }
});
