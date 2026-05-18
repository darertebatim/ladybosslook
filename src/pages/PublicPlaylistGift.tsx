import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";
import { Music, Gift, Crown } from "lucide-react";
import { usePublicPlaylistGift } from "@/hooks/usePlaylistGifts";
import { stashPlaylistGiftToken } from "@/hooks/useClaimPendingPlaylistGift";

const APP_STORE_URL = "https://apps.apple.com/app/id6499209400";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ladybosslook.academy";

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export default function PublicPlaylistGift() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePublicPlaylistGift(token);

  const senderName = data?.sender_first_name || "A friend";
  const playlistName = data?.playlist_name ?? "a playlist";
  const ogTitle = data ? `${senderName} gifted you "${playlistName}" on Rilo` : "A gift from Rilo";

  const cta = () => {
    if (!token) return;
    stashPlaylistGiftToken(token);
    if (Capacitor.isNativePlatform()) {
      navigate(`/app/player`);
      return;
    }
    const platform = detectPlatform();
    if (platform === "ios") window.location.href = APP_STORE_URL;
    else if (platform === "android") window.location.href = PLAY_STORE_URL;
    else navigate(`/auth?playlist_gift=${token}`);
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-5 py-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(180 70% 90%) 0%, hsl(210 80% 92%) 55%, hsl(280 70% 92%) 100%)",
      }}
    >
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={`Open your gift on Rilo — ${playlistName}.`} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={`Open your gift on Rilo — ${playlistName}.`} />
      </Helmet>

      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-black/55 mb-3">
          A gift on Rilo
        </div>

        {isLoading ? (
          <div className="text-black/50 text-sm">Opening your gift…</div>
        ) : !data ? (
          <div className="text-black/60 text-sm">This gift link isn't valid anymore.</div>
        ) : (
          <>
            <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white shadow-ios grid place-items-center mb-5">
              {data.playlist_cover_image_url ? (
                <img src={data.playlist_cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-12 h-12 text-black/40" />
              )}
            </div>
            <h1 className="text-black text-[22px] font-bold leading-tight">
              {senderName} sent you a playlist
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/10 text-black text-[13px] font-semibold">
              {data.requires_subscription && <Crown className="w-3.5 h-3.5 text-[#B8860B]" />}
              {playlistName}
            </div>
            <p className="mt-4 text-[14px] text-black/65 leading-snug max-w-[300px]">
              It's yours to keep — forever. Open Rilo to start listening.
            </p>

            <button
              onClick={cta}
              disabled={data.is_claimed}
              className="mt-7 w-full max-w-[280px] py-3.5 rounded-2xl bg-black text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] shadow-ios disabled:opacity-50"
            >
              <Gift className="w-4 h-4" />
              {data.is_claimed ? "Already opened" : "Open my gift"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}