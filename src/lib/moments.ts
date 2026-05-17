import { supabase } from "@/integrations/supabase/client";

export type MomentKind = "breathe" | "reflection" | "audio" | "routine" | "mood";

export interface RecordMomentInput {
  userId: string;
  kind: MomentKind;
  title: string;
  emoji?: string;
  /**
   * Optional payload. Include `ref_id` to make recording idempotent in the
   * client: we'll skip writing if a moment with the same ref_id already
   * exists in the last ~5 min for this user.
   */
  payload?: Record<string, unknown> & { ref_id?: string };
}

const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Records a "moment" the user can later dedicate to a friend.
 *
 * Safe to call from any completion handler (mood, breathing, reflection,
 * audio, routine). Fire-and-forget — never throws to the caller, never
 * blocks the success UX. Best-effort dedupe via `payload.ref_id`.
 */
export async function recordMoment(input: RecordMomentInput): Promise<void> {
  const { userId, kind, title, emoji, payload } = input;
  if (!userId || !title) return;

  try {
    if (payload?.ref_id) {
      const sinceIso = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
      const { data: existing } = await supabase
        .from("user_moments" as any)
        .select("id")
        .eq("user_id", userId)
        .eq("kind", kind)
        .gte("created_at", sinceIso)
        .contains("payload", { ref_id: payload.ref_id })
        .limit(1);
      if (existing && existing.length > 0) return;
    }

    await supabase.from("user_moments" as any).insert({
      user_id: userId,
      kind,
      title,
      emoji: emoji ?? defaultEmojiForKind(kind),
      payload: payload ?? {},
    } as any);
  } catch (err) {
    // Non-fatal — moments are an additive layer.
    console.warn("[recordMoment] failed:", err);
  }
}

export function defaultEmojiForKind(kind: MomentKind): string {
  switch (kind) {
    case "breathe":    return "🧘";
    case "reflection": return "✍️";
    case "audio":      return "🎧";
    case "routine":    return "🌅";
    case "mood":       return "💗";
  }
}

export function labelForKind(kind: MomentKind): string {
  switch (kind) {
    case "breathe":    return "Breathe";
    case "reflection": return "Reflection";
    case "audio":      return "Audio";
    case "routine":    return "Routine";
    case "mood":       return "Mood check-in";
  }
}