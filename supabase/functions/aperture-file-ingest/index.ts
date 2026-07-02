import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { corsHeaders, AI_GATEWAY, LITE_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";
import { getAllowedBuckets } from "../_shared/aperture-buckets.ts";

/**
 * aperture-file-ingest
 *
 * Body: { file_id: string }
 *
 * 1. Ensures the "aperture-files" private bucket exists.
 * 2. Downloads the file the user just uploaded.
 * 3. Extracts text (txt/md inline; PDF + images via Gemini vision).
 * 4. Asks the LLM to extract structured business facts and inserts them
 *    into aperture_memory_items as source = 'file_extracted'.
 */

async function extractText(
  file: Blob, name: string, mime: string, apiKey: string,
  usageCtx?: { supabase: any; userId: string },
): Promise<string | null> {
  const lower = name.toLowerCase();
  if (mime === "text/plain" || mime === "text/markdown" || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return await file.text();
  }
  // CSV — read as text.
  if (mime === "text/csv" || mime === "application/csv" || lower.endsWith(".csv")) {
    return await file.text();
  }
  // XLSX/XLS — parse all sheets to CSV text.
  if (
    lower.endsWith(".xlsx") || lower.endsWith(".xls") ||
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const wb = XLSX.read(buf, { type: "array" });
      const parts: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
        parts.push(`# Sheet: ${sheetName}\n${csv}`);
      }
      return parts.join("\n\n");
    } catch (e) {
      console.error("xlsx parse failed", e);
      return null;
    }
  }
  // For PDFs/images/docx — send to Gemini for OCR/extraction.
  const buf = new Uint8Array(await file.arrayBuffer());
  let b64 = "";
  const chunk = 8192;
  for (let i = 0; i < buf.length; i += chunk) b64 += String.fromCharCode(...buf.slice(i, i + chunk));
  b64 = btoa(b64);

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Extract ALL text from this document verbatim. Preserve structure. No commentary." },
        { role: "user", content: [
          { type: "text", text: `Extract everything readable from ${name}:` },
          { type: "image_url", image_url: { url: `data:${mime || "application/pdf"};base64,${b64}` } },
        ]},
      ],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (usageCtx) await logAiUsage(usageCtx.supabase, { userId: usageCtx.userId, fn: "aperture-file-ingest:ocr", model: "google/gemini-2.5-flash", usage: json?.usage });
  return json.choices?.[0]?.message?.content ?? null;
}

async function extractFacts(
  text: string, apiKey: string,
  allowed: Array<{ slug: string; title: string }>,
  usageCtx?: { supabase: any; userId: string },
): Promise<{ bucket_slug: string; content: string }[]> {
  if (allowed.length === 0) return [];
  const slugList = allowed.map(b => b.slug).join(", ");
  const allowedSet = new Set(allowed.map(b => b.slug));
  const catalog = allowed.map(b => `- ${b.slug} (${b.title})`).join("\n");
  const trimmed = text.slice(0, 30000);
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LITE_MODEL,
      messages: [
        { role: "system", content:
`Extract atomic business facts from the document. Return STRICT JSON:
{"facts":[{"bucket_slug":"<one of the allowed slugs below>","content":"<short factual statement, 1 sentence>"}]}
Allowed bucket slugs (use EXACTLY one of these — including industry buckets when relevant):
${catalog}
Rules:
- Only extract concrete facts the owner would recognize ("Charges $85 per session", "Open Tue–Sat 10–6", "Sells to brides aged 25–35").
- No fluff, no inferred opinions, no fabrications.
- Max 25 facts. Skip anything uncertain.
- If a fact fits an industry bucket better than a generic one, choose the industry bucket.
- Output ONLY the JSON object, no markdown.`
        },
        { role: "user", content: trimmed },
      ],
    }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (usageCtx) await logAiUsage(usageCtx.supabase, { userId: usageCtx.userId, fn: "aperture-file-ingest:facts", model: LITE_MODEL, usage: json?.usage });
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/```json\n?|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const facts = Array.isArray(parsed.facts) ? parsed.facts.slice(0, 25) : [];
    // Hard-filter to the allow-list — drop anything the model invented.
    return facts.filter((f: any) =>
      f && typeof f.bucket_slug === "string" && typeof f.content === "string"
      && allowedSet.has(f.bucket_slug.toLowerCase().trim())
    );
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(url, serviceKey);
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { file_id, chat_id = null } = await req.json();
    if (!file_id) return new Response(JSON.stringify({ error: "file_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Ensure bucket exists (idempotent).
    try {
      await admin.storage.createBucket("aperture-files", { public: false });
    } catch (_) { /* already exists */ }

    const { data: file } = await admin.from("aperture_files")
      .select("id,user_id,file_name,mime_type,storage_path,status")
      .eq("id", file_id).maybeSingle();
    if (!file || file.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: blob, error: dlErr } = await admin.storage.from("aperture-files").download(file.storage_path);
    if (dlErr || !blob) {
      await admin.from("aperture_files").update({ status: "failed", error_message: dlErr?.message ?? "download failed" }).eq("id", file_id);
      return new Response(JSON.stringify({ error: "download failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const usageCtx = { supabase: admin, userId: user.id };
    const text = await extractText(blob, file.file_name, file.mime_type ?? "", apiKey, usageCtx);
    if (!text) {
      await admin.from("aperture_files").update({ status: "failed", error_message: "could not read file" }).eq("id", file_id);
      return new Response(JSON.stringify({ error: "extraction failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const allowed = await getAllowedBuckets(admin, user.id);
    const facts = await extractFacts(text, apiKey, allowed, usageCtx);
    if (facts.length > 0) {
      const rows = facts.map(f => ({
        user_id: user.id,
        content: f.content,
        source: "file_extracted",
        bucket_slug: f.bucket_slug,
        source_file_id: file_id,
        chat_id: chat_id ?? null,
      }));
      await admin.from("aperture_memory_items").insert(rows as any);
    }

    await admin.from("aperture_files").update({
      status: "read",
      extracted_text: text.slice(0, 200000),
      extracted_fact_count: facts.length,
      error_message: null,
    }).eq("id", file_id);

    return new Response(JSON.stringify({ ok: true, fact_count: facts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("aperture-file-ingest error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});