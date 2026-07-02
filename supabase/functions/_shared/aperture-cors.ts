export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Mid-tier generation: suggestions, briefs, prefill, memory card. */
export const DEFAULT_MODEL = "openai/gpt-5-mini";

/** Premium model for the user-facing chat layer — strongest reasoning. */
export const CHAT_MODEL = "openai/gpt-5.4";

/** Cheapest tier for routing/classification calls (naming, classification). */
export const LITE_MODEL = "openai/gpt-5-nano";

/**
 * Per-model USD pricing (per 1M tokens). Used to estimate AI spend per user
 * for admin financial visibility. Update alongside CHAT_MODEL / DEFAULT_MODEL
 * / LITE_MODEL if pricing changes.
 */
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  "openai/gpt-5.4":     { in: 1.25, out: 10.00 },
  "openai/gpt-5":       { in: 1.25, out: 10.00 },
  "openai/gpt-5-mini":  { in: 0.25, out:  2.00 },
  "openai/gpt-5-nano":  { in: 0.05, out:  0.40 },
};

export function computeUsdCost(
  model: string | null | undefined,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = MODEL_PRICING[model ?? ""] ?? MODEL_PRICING["openai/gpt-5-mini"];
  const cost = (promptTokens * p.in + completionTokens * p.out) / 1_000_000;
  // 6-decimal precision matches the DB column
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Fire-and-forget usage log. Never throws — cost tracking must never break
 * a live AI response.
 */
export async function logAiUsage(
  supabase: any,
  params: {
    userId: string;
    fn: string;
    model: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
  },
): Promise<number> {
  const prompt = params.usage?.prompt_tokens ?? 0;
  const completion = params.usage?.completion_tokens ?? 0;
  const usd = computeUsdCost(params.model, prompt, completion);
  try {
    await supabase.from("aperture_ai_usage").insert({
      user_id: params.userId,
      fn: params.fn,
      model: params.model,
      prompt_tokens: prompt,
      completion_tokens: completion,
      usd_cost: usd,
    });
  } catch (e) {
    console.error("logAiUsage failed", e);
  }
  return usd;
}