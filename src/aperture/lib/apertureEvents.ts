import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget event logger for the RiloBiz event log
 * (aperture_events). Writes are append-only and scoped to the
 * signed-in user via RLS. Never throws — losing one event row must
 * never break a UX flow. Use this from any client code that wants
 * to record what just happened (chat tap, onboarding answer, memory
 * write, suggestion view, etc.) so we can replay the full timeline
 * for research and debugging later.
 */
export type ApertureEventType =
  | "chat_message_user"
  | "chat_message_ai"
  | "onboarding_answer"
  | "onboarding_phase3_extracted"
  | "onboarding_completed"
  | "memory_item_written"
  | "bucket_progress_changed"
  | "suggestion_shown"
  | "suggestion_tapped"
  | "suggestion_ignored"
  | "playbook_started"
  | "playbook_step_completed"
  | "playbook_completed"
  | "daily_question_shown"
  | "daily_question_answered"
  | "daily_question_skipped"
  | "question_marked_unknown"
  | "app_opened"
  | "screen_viewed"
  | "session_ended"
  | (string & {});

export function logApertureEvent(
  eventType: ApertureEventType,
  payload: Record<string, unknown> = {},
  conversationId: string | null = null,
): void {
  // Fire-and-forget. Don't await, don't surface errors.
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("aperture_events").insert({
        user_id: user.id,
        event_type: eventType,
        payload: payload as any,
        conversation_id: conversationId,
      });
    } catch {
      /* swallow — logging must never break UX */
    }
  })();
}