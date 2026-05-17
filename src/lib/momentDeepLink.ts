import type { MomentKind } from "@/lib/moments";

/**
 * Best-effort deep link from a moment kind + payload back into the tool
 * that produced it. Used when a recipient taps "Try it" on a dedication.
 * Pre-fills where the payload carries enough info; otherwise opens the
 * tool's landing page.
 */
export function tryDeepLinkForMoment(
  kind: MomentKind,
  payload: Record<string, unknown> | null | undefined,
): string {
  const p = (payload ?? {}) as Record<string, any>;
  switch (kind) {
    case "breathe": {
      const ex = typeof p.exerciseName === "string" ? p.exerciseName : null;
      return ex ? `/app/breathe?exercise=${encodeURIComponent(ex)}` : "/app/breathe";
    }
    case "reflection":
      return "/app/reflections";
    case "audio": {
      const pid = p.playlistId || p.playlist_id;
      return pid ? `/app/listen/player/playlist/${pid}` : "/app/listen";
    }
    case "routine": {
      const rid = p.routineId || p.routine_id;
      return rid ? `/app/routineplayer?routine=${rid}` : "/app/home";
    }
    case "mood":
      return "/app/mood";
    default:
      return "/app/home";
  }
}