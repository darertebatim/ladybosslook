import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * aperture-onboarding-research
 *
 * After Quick Onboarding collects business_name + website + instagram,
 * this fetches public content from each, asks the model to extract
 * crisp facts, and writes them into aperture_memory_items as
 * source='ai_extracted'.
 *
 * Request body: { website?: string, instagram?: string, businessName?: string }
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

    const { website, instagram, businessName } = await req.json();
    if (!website && !instagram) {
      return json({ ok: true, written: 0, skipped: "no urls" });
    }

    const sources: { label: string; url: string; text: string; meta?: Record<string, unknown> }[] = [];
    if (website) {
      const t = await fetchAsText(normalizeUrl(website));
      if (t) sources.push({ label: "website", url: website, text: t });
    }
    if (instagram) {
      const handle = String(instagram)
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

    const corpus = sources
      .map(s => `# ${s.label.toUpperCase()} (${s.url})\n${s.text.slice(0, 6000)}`)
      .join("\n\n");

    const systemPrompt = `You extract a short list of crisp, factual statements about a small business from raw scraped web/IG text. Each fact must be true based on the source text, brief (<= 24 words), specific, and non-redundant. Skip generic marketing fluff. If the source text is mostly a login wall or empty, return an empty list.`;
    const userPrompt = `Business name (claimed): ${businessName ?? "(unknown)"}\n\nReturn JSON of the shape:\n{\n  "items": [\n    { "bucket": "<one of: basics|story|customers|products|sales|marketing|money|vision|tools|team|operations|partners|competitors>", "fact": "<concise fact>" }\n  ]\n}\nOnly return valid JSON. Max 12 items.\n\n=== SOURCE ===\n${corpus}\n=== END SOURCE ===`;

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
    for (const it of items) {
      const { error } = await supabase.from("aperture_memory_items").insert({
        user_id: user.id,
        content: it.fact.trim().slice(0, 280),
        source: "ai_extracted",
        bucket_slug: it.bucket,
      });
      if (!error) {
        written++;
        await logApertureEvent(supabase, user.id, "memory_item_written", {
          bucket_slug: it.bucket,
          content: it.fact.trim().slice(0, 280),
          source: "ai_extracted",
          origin: "onboarding_phase3",
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
      if (m && m[1]) parts.push(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim());
    };
    grab(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    // also pick up the JSON-LD blob if any
    const ld = html.match(/<script type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (ld && ld[1]) parts.push(ld[1].slice(0, 2000));
    const joined = parts.join("\n").trim();
    // Treat pure "Login • Instagram" boilerplate as empty.
    if (/^login\b/i.test(joined) || joined.length < 40) return "";
    return joined;
  } catch {
    return "";
  }
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
  out = out
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // collapse whitespace
  return out.replace(/\s+/g, " ").trim();
}