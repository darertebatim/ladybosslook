import { useEffect, useRef, type RefObject } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { extractYouTubeId } from "@/lib/videoUtils";

/** Records how long each viewer watches a video (YouTube iframe or direct <video>). */

export interface VideoTrackOptions {
  url: string | null | undefined;
  title?: string;
  context?: string;
  enabled?: boolean;
}

const FLUSH_MS = 10_000;

function getViewerEmail(): string | null {
  try {
    const p = new URLSearchParams(window.location.search);
    const e = p.get("email") || p.get("e");
    if (e && e.includes("@")) {
      localStorage.setItem("lead_email", e);
      return e;
    }
    return localStorage.getItem("lead_email");
  } catch {
    return null;
  }
}

export function videoKeyFor(url: string): { key: string; source: string } {
  const yt = extractYouTubeId(url);
  if (yt) return { key: `yt:${yt}`, source: "youtube" };
  return { key: url.split("?")[0], source: "direct" };
}

/** Adds enablejsapi=1 so YouTube embeds report playback to us. */
export function withYouTubeApi(src: string): string {
  if (!/youtube(-nocookie)?\.com\/embed\//.test(src) || src.includes("enablejsapi")) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
}

let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

function createSession(opts: VideoTrackOptions) {
  const url = opts.url as string;
  const { key, source } = videoKeyFor(url);
  const sessionKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  let watched = 0;
  let position = 0;
  let duration = 0;
  let lastSent = -1;
  let playing = false;
  let lastTick = 0;

  const tick = () => {
    if (!playing) return;
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    lastTick = now;
    if (delta > 0 && delta < 5) watched += delta;
  };

  const flush = () => {
    tick();
    const w = Math.floor(watched);
    if (w < 1 || w === lastSent) return;
    lastSent = w;
    void (supabase.rpc as any)("track_video_watch", {
      p_session_key: sessionKey,
      p_video_key: key,
      p_video_url: url,
      p_video_title: opts.title ?? null,
      p_source: source,
      p_context: opts.context ?? null,
      p_page_path: window.location.pathname,
      p_platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web",
      p_email: getViewerEmail(),
      p_seconds_watched: w,
      p_position: Math.floor(position),
      p_duration: Math.floor(duration) || null,
    }).then(({ error }: any) => error && console.warn("[videoTracking]", error.message));
  };

  const timer = window.setInterval(flush, FLUSH_MS);
  const onHide = () => document.visibilityState === "hidden" && flush();
  document.addEventListener("visibilitychange", onHide);

  return {
    setPlaying(p: boolean) {
      tick();
      playing = p;
      lastTick = Date.now();
      if (!p) flush();
    },
    update(pos: number, dur: number) {
      if (Number.isFinite(pos)) position = Math.max(position, pos);
      if (Number.isFinite(dur) && dur > 0) duration = dur;
    },
    flush,
    stop() {
      flush();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    },
  };
}

/** Attach tracking to a <video> or a YouTube <iframe> element. */
export function useVideoWatchTracking(
  ref: RefObject<HTMLVideoElement | HTMLIFrameElement | null>,
  opts: VideoTrackOptions,
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    const url = opts.url;
    if (!el || !url || opts.enabled === false) return;
    const session = createSession(optsRef.current);
    let cleanup = () => {};

    if (el instanceof HTMLVideoElement) {
      const onPlay = () => session.setPlaying(true);
      const onPause = () => session.setPlaying(false);
      const onTime = () => session.update(el.currentTime, el.duration);
      el.addEventListener("playing", onPlay);
      el.addEventListener("pause", onPause);
      el.addEventListener("ended", onPause);
      el.addEventListener("timeupdate", onTime);
      if (!el.paused) onPlay();
      cleanup = () => {
        el.removeEventListener("playing", onPlay);
        el.removeEventListener("pause", onPause);
        el.removeEventListener("ended", onPause);
        el.removeEventListener("timeupdate", onTime);
      };
    } else if (/youtube(-nocookie)?\.com\/embed\//.test(el.src)) {
      let poll = 0;
      let cancelled = false;
      let player: any = null;
      loadYouTubeApi().then((YT) => {
        if (cancelled) return;
        player = new YT.Player(el, {
          events: {
            onStateChange: (e: any) => {
              // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
              session.setPlaying(e.data === 1);
            },
          },
        });
        poll = window.setInterval(() => {
          try {
            if (player?.getCurrentTime) session.update(player.getCurrentTime(), player.getDuration());
          } catch { /* not ready */ }
        }, 1000);
      });
      cleanup = () => {
        cancelled = true;
        window.clearInterval(poll);
      };
    }

    return () => {
      cleanup();
      session.stop();
    };
  }, [ref, opts.url, opts.enabled]);
}
