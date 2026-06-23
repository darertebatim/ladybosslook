import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Aperture MCP server — exposes a user's Aperture memory pool to any
 * MCP-compatible AI (Claude.ai, ChatGPT, etc.) via JSON-RPC over HTTP.
 *
 * Auth: Bearer <apt_...> token from public.aperture_mcp_tokens.
 * Methods: initialize, tools/list, tools/call.
 * Tools: get_memory, search_memory, add_fact, update_fact.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function rpc(id: any, result?: any, error?: any) {
  const body: any = { jsonrpc: "2.0", id: id ?? null };
  if (error) body.error = error;
  else body.result = result;
  return new Response(JSON.stringify(body), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const TOOL_DEFINITIONS = [
  {
    name: "get_memory",
    description:
      "Retrieve facts from this user's Aperture business memory. Call at the start of every conversation to load business context.",
    inputSchema: {
      type: "object",
      properties: {
        bucket: { type: "string", description: "Optional bucket slug filter (e.g. money, customers, products)." },
        limit: { type: "number", description: "Max facts (default 100, max 500)." },
      },
    },
  },
  {
    name: "search_memory",
    description: "Keyword search across the user's business memory.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Natural language search query." },
        limit: { type: "number", description: "Max results (default 20)." },
      },
    },
  },
  {
    name: "add_fact",
    description:
      "Write a new business fact into the user's Aperture memory. Only call when the user has clearly stated new information.",
    inputSchema: {
      type: "object",
      required: ["fact", "bucket"],
      properties: {
        fact: { type: "string", description: "The business fact in plain language." },
        bucket: { type: "string", description: "Bucket slug (e.g. basics, customers, products, money, goals, team)." },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Confidence level. Default high.",
        },
      },
    },
  },
  {
    name: "update_fact",
    description:
      "Record a correction. Writes a NEW timestamped entry — never deletes the old fact.",
    inputSchema: {
      type: "object",
      required: ["original_fact_summary", "corrected_fact", "bucket"],
      properties: {
        original_fact_summary: { type: "string" },
        corrected_fact: { type: "string" },
        bucket: { type: "string" },
      },
    },
  },
];

const READ_TOOLS = ["get_memory", "search_memory"];
const WRITE_TOOLS = ["add_fact", "update_fact"];

async function getTokenRow(token: string) {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await admin
    .from("aperture_mcp_tokens")
    .select("id, user_id, scopes, name, revoked")
    .eq("token", token)
    .maybeSingle();
  if (error || !data || data.revoked) return null;
  // Fire-and-forget last_used update.
  admin
    .from("aperture_mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});
  return data;
}

function confidenceToNumeric(c?: string) {
  if (c === "low") return 0.4;
  if (c === "medium") return 0.7;
  return 0.95;
}

async function handleGetMemory(admin: any, userId: string, input: any) {
  const limit = Math.min(Math.max(Number(input?.limit) || 100, 1), 500);
  let q = admin
    .from("aperture_memory_items")
    .select("id, content, bucket_slug, source, confidence, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (input?.bucket) q = q.eq("bucket_slug", input.bucket);
  const { data, error } = await q;
  if (error) throw error;
  return {
    fact_count: data?.length ?? 0,
    facts: (data ?? []).map((f: any) => ({
      id: f.id,
      fact: f.content,
      bucket: f.bucket_slug,
      source: f.source,
      added: f.created_at,
    })),
  };
}

async function handleSearchMemory(admin: any, userId: string, input: any) {
  const query = String(input?.query ?? "").trim();
  if (!query) return { results: [] };
  const limit = Math.min(Math.max(Number(input?.limit) || 20, 1), 100);
  const { data, error } = await admin
    .from("aperture_memory_items")
    .select("id, content, bucket_slug, source, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .ilike("content", `%${query.replace(/[%_]/g, "")}%`)
    .limit(limit);
  if (error) throw error;
  return {
    results: (data ?? []).map((f: any) => ({
      id: f.id,
      fact: f.content,
      bucket: f.bucket_slug,
      source: f.source,
      added: f.created_at,
    })),
  };
}

async function handleAddFact(admin: any, userId: string, input: any, tokenName: string) {
  const fact = String(input?.fact ?? "").trim();
  const bucket = String(input?.bucket ?? "").trim();
  if (!fact || !bucket) throw new Error("fact and bucket are required");
  const { error } = await admin.from("aperture_memory_items").insert({
    user_id: userId,
    content: fact,
    bucket_slug: bucket,
    source: "mcp_extracted",
    confidence: confidenceToNumeric(input?.confidence),
    is_active: true,
    metadata: { added_by: tokenName },
  });
  if (error) throw error;
  return { success: true, message: "Fact added to Aperture memory." };
}

async function handleUpdateFact(admin: any, userId: string, input: any, tokenName: string) {
  const orig = String(input?.original_fact_summary ?? "").trim();
  const corrected = String(input?.corrected_fact ?? "").trim();
  const bucket = String(input?.bucket ?? "").trim();
  if (!corrected || !bucket) throw new Error("corrected_fact and bucket are required");
  const { error } = await admin.from("aperture_memory_items").insert({
    user_id: userId,
    content: `[CORRECTION] ${corrected} (replaces: ${orig})`,
    bucket_slug: bucket,
    source: "mcp_extracted",
    confidence: 0.95,
    is_active: true,
    metadata: { correction: true, added_by: tokenName, replaces_summary: orig },
  });
  if (error) throw error;
  return { success: true, message: "Correction written to Aperture memory." };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const tokenRow = await getTokenRow(token);
  if (!tokenRow) {
    return new Response(JSON.stringify({ error: "Invalid or revoked token" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const method = body?.method;
  const id = body?.id ?? null;

  if (method === "initialize") {
    return rpc(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "aperture-memory", version: "1.0.0" },
    });
  }

  if (method === "notifications/initialized") {
    return new Response(null, { status: 204, headers: cors });
  }

  const scopes: string[] = tokenRow.scopes ?? ["read"];
  const canWrite = scopes.includes("write");

  if (method === "tools/list") {
    const tools = canWrite
      ? TOOL_DEFINITIONS
      : TOOL_DEFINITIONS.filter((t) => READ_TOOLS.includes(t.name));
    return rpc(id, { tools });
  }

  if (method === "tools/call") {
    const name = body?.params?.name;
    const args = body?.params?.arguments ?? {};
    if (WRITE_TOOLS.includes(name) && !canWrite) {
      return rpc(id, undefined, {
        code: -32600,
        message: "Write scope not granted for this token.",
      });
    }
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      let result: any;
      if (name === "get_memory") result = await handleGetMemory(admin, tokenRow.user_id, args);
      else if (name === "search_memory") result = await handleSearchMemory(admin, tokenRow.user_id, args);
      else if (name === "add_fact") result = await handleAddFact(admin, tokenRow.user_id, args, tokenRow.name);
      else if (name === "update_fact") result = await handleUpdateFact(admin, tokenRow.user_id, args, tokenRow.name);
      else throw new Error(`Unknown tool: ${name}`);
      return rpc(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (err: any) {
      return rpc(id, undefined, { code: -32000, message: String(err?.message ?? err) });
    }
  }

  return rpc(id, undefined, { code: -32601, message: "Method not found" });
});