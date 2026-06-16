export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

/** Premium model for the user-facing chat layer — bigger reasoning, still on gateway. */
export const CHAT_MODEL = "google/gemini-3.1-pro-preview";

/** Cheapest tier for routing/classification calls (e.g. bucket classifier). */
export const LITE_MODEL = "google/gemini-3.1-flash-lite-preview";