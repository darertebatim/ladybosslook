import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * aperture-onboarding-research
 *
 * After Quick Onboarding collects business_name + website + instagram,
 * this fetches public content from each, asks the model to extract
 * crisp facts, and writes them into aperture_memory_items as
 * source='ai_extracted'.
 *
 * Request body:
 *   Bulk mode (Quick Onboarding):
 *     { website?: string, instagram?: string, businessName?: string }
 *   Targeted mode (single source refetch, used by Tools > Source detail):
 *     { source: "website"|"instagram", url: string, businessName?: string, userPrompt?: string }
 * Auth: bearer token of the user (writes are scoped to user.id).
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Invalid token" }, 401);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI gateway not configured" }, 500);

    const body = await req.json();
    const { website, instagram, businessName, source, url, userPrompt } = body ?? {};
    const targeted = source === "website" || source === "instagram";
    const effWebsite = targeted && source === "website" ? url : website;
    const effInstagram = targeted && source === "instagram" ? url : instagram;
    if (!effWebsite && !effInstagram) {
      return json({ ok: true, written: 0, skipped: "no urls" });
    }

    const sources: { label: string; url: string; text: string; meta?: Record<string, unknown> }[] = [];
    if (effWebsite) {
      const baseUrl = normalizeUrl(effWebsite);
      // Pull og:meta + visible text from the homepage, then try common
      // marketing pages so SPAs don't come back empty.
      const homepage = await fetchWebsiteRich(baseUrl);
      const extras: string[] = [];
      for (const path of ["/about", "/about-us", "/services", "/work-with-me", "/coaching"]) {
        try {
          const u = new URL(path, baseUrl).toString();
          const t = await fetchAsText(u);
          if (t && t.length > 200) extras.push(`## ${path}\n${t.slice(0, 2000)}`);
        } catch { /* ignore */ }
      }
      const combined = [homepage, ...extras].filter(Boolean).join("\n\n");
      if (combined.trim().length > 40) {
        sources.push({ label: "website", url: effWebsite, text: combined });
      }
    }
    if (effInstagram) {
      const handle = String(effInstagram)
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/.*$/, "")
        .trim();
      const igUrl = `https://www.instagram.com/${handle}/`;
      // Try profile page first (mobile UA pulls richer og: meta), then search snippets,
      // then embed. Instagram often blocks Supabase IPs and returns only a login shell.
      let t = await fetchInstagramMeta(igUrl);
      if (!t) {
        t = await fetchInstagramSearchSnippet(handle);
      }
      if (!t) {
        const embedUrl = `https://www.instagram.com/${handle}/embed/`;
        t = await fetchAsText(embedUrl, true);
      }
      if (t && !isInstagramBoilerplate(t)) sources.push({ label: "instagram", url: igUrl, text: t, meta: { handle } });
    }

    if (sources.length === 0) {
      return json({ ok: true, written: 0, skipped: "fetch failed" });
    }

    // Persist raw snapshot per source for the Source detail sheet.
    for (const s of sources) {
      await supabase.from("aperture_source_snapshots").upsert({
        user_id: user.id,
        source_kind: s.label,
        url: s.url,
        raw_text: s.text.slice(0, 20000),
        meta: s.meta ?? {},
        fetched_at: new Date().toISOString(),
      } as any, { onConflict: "user_id,source_kind" });
    }

    const corpus = sources
      .map(s => `# ${s.label.toUpperCase()} (${s.url})\n${s.text.slice(0, 6000)}`)
      .join("\n\n");

    const systemPrompt = `You extract a short list of crisp, factual statements about a small business from raw scraped web/IG text. Each fact must be true based on the source text, brief (<= 24 words), specific, and non-redundant. Skip generic marketing fluff. If the source text is mostly a login wall or empty, return an empty list.`;
    const focusLine = userPrompt
      ? `\n\nThe user specifically asked: "${String(userPrompt).slice(0, 240)}". Prefer facts that answer that.`
      : "";
    const aiUserPrompt = `Business name (claimed): ${businessName ?? "(unknown)"}${focusLine}\n\nReturn JSON of the shape:\n{\n  "items": [\n    { "bucket": "<one of: basics|story|customers|products|sales|marketing|money|vision|tools|team|operations|partners|competitors>", "fact": "<concise fact>" }\n  ]\n}\nOnly return valid JSON. Max 12 items.\n\n=== SOURCE ===\n${corpus}\n=== END SOURCE ===`;

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: aiUserPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: `AI gateway error: ${t.slice(0, 300)}` }, 500);
    }
    const aiJson = await aiRes.json();
    await logAiUsage(supabase, { userId: user.id, fn: "aperture-onboarding-research", model: DEFAULT_MODEL, usage: aiJson?.usage });
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { items?: { bucket: string; fact: string }[] } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const VALID = new Set([
      "basics","story","customers","products","sales","marketing","money",
      "vision","tools","team","operations","partners","competitors",
    ]);
    const items = (parsed.items ?? []).filter(
      i => i && typeof i.fact === "string" && i.fact.trim() && VALID.has(i.bucket),
    );

    // Deterministic safety net: if Instagram was blocked but search-result snippets
    // reveal clear public profile facts, keep the user from seeing an empty review.
    for (const s of sources.filter(s => s.label === "instagram")) {
      const fallbackFacts = instagramFallbackFacts(s.text, String(s.meta?.handle ?? ""));
      for (const fact of fallbackFacts) {
        if (!items.some(i => i.fact.toLowerCase() === fact.toLowerCase())) {
          items.push({ bucket: "marketing", fact });
        }
      }
    }

    let written = 0;
    // Tag each extracted fact with a source-scoped question_key so the
    // Source detail sheet can filter facts that came from this source.
    const sourceTag = sources[0]?.label ?? "ai";
    let seq = 0;
    for (const it of items) {
      const slugFact = it.fact.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
      const questionKey = `${sourceTag}__${slugFact || `fact_${++seq}`}`;
      const { error } = await supabase.from("aperture_memory_items").insert({
        user_id: user.id,
        content: it.fact.trim().slice(0, 280),
        source: "ai_extracted",
        bucket_slug: it.bucket,
        question_key: questionKey,
      });
      if (!error) {
        written++;
        await logApertureEvent(supabase, user.id, "memory_item_written", {
          bucket_slug: it.bucket,
          content: it.fact.trim().slice(0, 280),
          source: "ai_extracted",
          origin: targeted ? "source_refetch" : "onboarding_phase3",
        });
      }
    }

    await logApertureEvent(supabase, user.id, "onboarding_phase3_extracted", {
      written,
      sources: sources.map(s => ({ label: s.label, url: s.url, len: s.text.length })),
    });

    // Flag memory card as stale so next chat regenerates the brief
    await supabase.from("aperture_memory_card")
      .update({ stale: true })
      .eq("user_id", user.id);

    return json({ ok: true, written, sources: sources.map(s => ({ label: s.label, url: s.url, len: s.text.length })) });
  } catch (e) {
    console.error("aperture-onboarding-research error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeUrl(u: string): string {
  const t = u.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanText(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

async function fetchAsText(url: string, mobile = false): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": mobile
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
          : "Mozilla/5.0 (compatible; ApertureBot/1.0; +https://aperture.lovable.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    return stripHtml(html);
  } catch {
    return "";
  }
}

/**
 * Instagram-specific: fetch with mobile UA and extract og:title +
 * og:description + meta description. These are the only fields a
 * logged-out client reliably gets from instagram.com.
 */
async function fetchInstagramMeta(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    const parts: string[] = [];
    const grab = (re: RegExp) => {
      const m = html.match(re);
      if (m && m[1]) parts.push(cleanText(m[1]));
    };
    grab(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    // also pick up the JSON-LD blob if any
    const ld = html.match(/<script type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (ld && ld[1]) parts.push(ld[1].slice(0, 2000));
    const joined = parts.join("\n").trim();
    // Treat pure "Login • Instagram" boilerplate as empty.
    if (isInstagramBoilerplate(joined) || joined.length < 40) return "";
    return joined;
  } catch {
    return "";
  }
}

async function fetchInstagramSearchSnippet(handle: string): Promise<string> {
  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(`${handle} Instagram`)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    const chunks: string[] = [];
    const resultRe = /<div class="result[\s\S]*?(?=<div class="result|<\/body>)/gi;
    const results = html.match(resultRe) ?? [];
    for (const block of results.slice(0, 6)) {
      const text = cleanText(block);
      if (!text.toLowerCase().includes(handle.toLowerCase())) continue;
      if (!/instagram|followers|following|posts|business|consult/i.test(text)) continue;
      chunks.push(text.slice(0, 700));
    }
    return chunks.join("\n").trim();
  } catch {
    return "";
  }
}

function isInstagramBoilerplate(text: string): boolean {
  const t = text.toLowerCase();
  if (!t.trim()) return true;
  if (/^login\b/.test(t.trim())) return true;
  if (t.includes("create an account or log in to instagram") && !t.includes("followers")) return true;
  if (t.includes("see everyday moments from your close friends") && !t.includes("followers")) return true;
  return false;
}

function instagramFallbackFacts(text: string, handle: string): string[] {
  const facts: string[] = [];
  const profileLine = text.split(/\n+/).find(line =>
    line.toLowerCase().includes(handle.toLowerCase()) && /followers|following|posts/i.test(line),
  ) ?? text;
  const followers = profileLine.match(/([\d,.]+\s*[KMB]?)\s+Followers/i)?.[1];
  const following = profileLine.match(/([\d,.]+\s*[KMB]?)\s+Following/i)?.[1];
  const posts = profileLine.match(/([\d,.]+)\s+Posts/i)?.[1];
  if (followers) {
    facts.push(`Instagram @${handle} has about ${followers.replace(/\s+/g, "")} followers${following ? ` and follows ${following.replace(/\s+/g, "")}` : ""}${posts ? ` across ${posts} posts` : ""}.`);
  }
  const businessSnippet = text.match(/Helping[^.\n]{20,180}/i)?.[0]
    ?? text.match(/BusinessTraining[^.\n]{10,180}/i)?.[0]
    ?? text.match(/profitable businesses[^.\n]{0,120}/i)?.[0];
  if (businessSnippet) facts.push(cleanText(businessSnippet).slice(0, 180));
  const location = text.match(/Orange\s*County[^\n.]{0,40}/i)?.[0];
  if (location) facts.push(`Instagram bio mentions ${cleanText(location)}.`);
  return facts.slice(0, 3);
}

function stripHtml(html: string): string {
  // remove scripts/styles
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  // collapse tags
  out = out.replace(/<[^>]+>/g, " ");
  // decode common entities
  out = decodeEntities(out);
  // collapse whitespace
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Website-specific: combine og:meta tags (works for SPAs) with the
 * stripped HTML body. Many small-business sites are React/Wix/Squarespace
 * shells where the body is empty server-side but the meta tags are rich.
 */
async function fetchWebsiteRich(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ApertureBot/1.0; +https://aperture.lovable.app)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    const parts: string[] = [];
    const grab = (re: RegExp, label: string) => {
      const m = html.match(re);
      if (m && m[1]) parts.push(`${label}: ${cleanText(m[1])}`);
    };
    grab(/<title[^>]*>([^<]+)<\/title>/i, "Title");
    grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, "Description");
    grab(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i, "OG Title");
    grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i, "OG Description");
    grab(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i, "Site Name");
    grab(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i, "Keywords");
    // JSON-LD blobs often carry org/business schema for SPAs.
    const ldMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
    for (const ld of ldMatches.slice(0, 3)) {
      const inner = ld.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
      parts.push(`LD-JSON: ${inner.slice(0, 1500)}`);
    }
    const body = stripHtml(html);
    if (body) parts.push(`Body: ${body.slice(0, 4000)}`);
    return parts.join("\n").trim();
  } catch {
    return "";
  }
}