import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

serve(async (_req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase env vars", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const candidates = [
    // August 2025 - 6 paid + 1 refunded (all $29)
    {
      email: "roya.doost@icloud.com",
      name: "Roya Doost",
      amount: 2900,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug28_royadoost",
      created_at: "2025-08-28T10:23:00Z",
      refunded: false,
      refunded_at: null as string | null,
      refund_amount: null as number | null,
    },
    {
      email: "yalda.momeni92@gmail.com",
      name: "Yalda Momeni",
      amount: 2900,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug27_yalda",
      created_at: "2025-08-27T18:04:00Z",
      refunded: false,
      refunded_at: null,
      refund_amount: null,
    },
    {
      email: "ava.karami24@gmail.com",
      name: "Ava Karami",
      amount: 2900,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug26_ava",
      created_at: "2025-08-26T17:01:00Z",
      refunded: false,
      refunded_at: null,
      refund_amount: null,
    },
    {
      email: "ramakiphonex2021@gmail.com",
      name: "Rama",
      amount: 2900,
      currency: "usd",
      status: "refunded",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug26_rama_refunded",
      created_at: "2025-08-26T16:37:00Z",
      refunded: true,
      refunded_at: "2025-09-03T00:23:47Z",
      refund_amount: 2900,
    },
    {
      email: "dmorshedi@icloud.com",
      name: "D Morshedi",
      amount: 2900,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug26_dmorshedi",
      created_at: "2025-08-26T15:29:00Z",
      refunded: false,
      refunded_at: null,
      refund_amount: null,
    },
    {
      email: "nahid_talebi45@yahoo.com",
      name: "Nahid Talebi",
      amount: 2900,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug25_nahid",
      created_at: "2025-08-25T19:09:00Z",
      refunded: false,
      refunded_at: null,
      refund_amount: null,
    },
    {
      email: "razie8254@gmail.com",
      name: "Razie",
      amount: 2900,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_aug25_razie",
      created_at: "2025-08-25T08:55:00Z",
      refunded: false,
      refunded_at: null,
      refund_amount: null,
    },
    // September 22, 2025 - $250 payment
    {
      email: "kh08.mohammad@gmail.com",
      name: "Unknown",
      amount: 25000,
      currency: "usd",
      status: "paid",
      product_name: "Unknown Product",
      stripe_session_id: "manual_backfill_sept22_250",
      created_at: "2025-09-22T01:26:19Z",
      refunded: false,
      refunded_at: null,
      refund_amount: null,
    },
  ];

  const ids = candidates.map((c) => c.stripe_session_id);

  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("stripe_session_id")
    .in("stripe_session_id", ids);

  if (existingError) {
    console.error(existingError);
    return new Response("Error checking existing orders", { status: 500 });
  }

  const existingIds = new Set((existing || []).map((r: any) => r.stripe_session_id));
  const toInsert = candidates.filter((c) => !existingIds.has(c.stripe_session_id));

  if (toInsert.length === 0) {
    return new Response(JSON.stringify({ inserted: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: insertError } = await supabase.from("orders").insert(toInsert);

  if (insertError) {
    console.error(insertError);
    return new Response("Error inserting backfill orders", { status: 500 });
  }

  return new Response(JSON.stringify({ inserted: toInsert.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
