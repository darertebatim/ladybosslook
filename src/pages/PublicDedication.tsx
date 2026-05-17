import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePublicDedication } from "@/hooks/usePublicDedication";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { stashDedicationToken } from "@/hooks/useClaimPendingDedication";
import { Capacitor } from "@capacitor/core";
import { Sparkles } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/app/id6499209400"; // Rilo App Store
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ladybosslook.academy";

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export default function PublicDedication() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePublicDedication(token);

  const senderName = data?.sender_first_name || "Someone";
  const ogTitle = data ? `${senderName} dedicated a moment to you on Rilo` : "A Care Package from Rilo";
  const ogDesc = data?.moment_title ?? "Open your Care Package.";
  const ogImage = token
    ? `https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/og-dedication?token=${token}`
    : undefined;

  const cta = () => {
    if (!token) return;
    stashDedicationToken(token);
    if (Capacitor.isNativePlatform()) {
      navigate(`/app/friends`);
      return;
    }
    const platform = detectPlatform();
    if (platform === "ios") {
      window.location.href = APP_STORE_URL;
    } else if (platform === "android") {
      window.location.href = PLAY_STORE_URL;
    } else {
      navigate(`/auth?dedication=${token}`);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-5 py-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(28 100% 92%) 0%, hsl(280 80% 92%) 55%, hsl(160 60% 90%) 100%)",
      }}
    >
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDesc} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>

      {/* Ambient glow */}
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-fuchsia-300/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto flex-1 flex flex-col">
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md text-[11px] font-semibold uppercase tracking-wider text-black">
            <Sparkles className="w-3 h-3" /> A Care Package
          </div>
        </div>

        {isLoading && (
          <div className="mt-16 text-center text-black/60 text-sm">Unwrapping…</div>
        )}

        {!isLoading && (error || !data) && (
          <div className="mt-16 text-center">
            <div className="text-6xl mb-3">🥺</div>
            <h1 className="text-xl font-bold text-black">This Care Package wasn't found</h1>
            <p className="mt-2 text-sm text-black/60">
              The link may have expired. Ask the sender to share a new one.
            </p>
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Sender */}
            <div className="mt-8 flex flex-col items-center">
              {data.sender_avatar_url ? (
                <img
                  src={data.sender_avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover shadow-ios"
                />
              ) : (
                <div className="w-16 h-16 rounded-full grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] text-xl font-bold text-black shadow-ios">
                  {senderName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="mt-3 text-center">
                <div className="text-[22px] leading-tight font-bold text-black">
                  {senderName} dedicated a moment
                </div>
                <div className="text-[15px] text-black/60 mt-0.5">
                  {data.recipient_hint ? `for ${data.recipient_hint}` : "for you"}
                </div>
              </div>
            </div>

            {/* Moment card */}
            <div className="mt-7 rounded-3xl p-6 bg-white/75 backdrop-blur-xl shadow-ios text-center">
              <div className="mx-auto w-24 h-24 rounded-3xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]">
                <FluentEmoji emoji={data.moment_emoji || "💝"} size={72} />
              </div>
              <div className="mt-4 text-[11px] uppercase tracking-wider font-semibold text-black/50">
                {data.moment_kind}
              </div>
              <div className="mt-1 text-[18px] font-bold text-black px-2">
                {data.moment_title}
              </div>
            </div>

            {data.message && (
              <div className="mt-4 p-4 rounded-2xl bg-white/70 backdrop-blur-xl shadow-ios">
                <p className="text-[15px] text-black italic text-center">"{data.message}"</p>
              </div>
            )}

            {data.is_claimed && (
              <p className="mt-4 text-center text-sm text-black/60">
                This Care Package has already been opened 💛
              </p>
            )}

            <button
              onClick={cta}
              className="mt-8 w-full py-4 rounded-2xl bg-black text-white text-[16px] font-semibold shadow-ios active:scale-[0.98] transition-transform"
            >
              {data.is_claimed ? "Open in Rilo" : "Open your Care Package"}
            </button>

            <p className="mt-3 text-center text-[12px] text-black/50">
              Already have Rilo? Open the app to find it in Friends.
            </p>
          </>
        )}

        <div className="mt-auto pt-10 text-center text-[11px] text-black/40">
          Rilo — your gentle daily reset
        </div>
      </div>
    </div>
  );
}