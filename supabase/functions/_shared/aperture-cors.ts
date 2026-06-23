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