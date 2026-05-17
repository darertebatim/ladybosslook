import { useMemo, useState } from "react";
import { SlideUpPage } from "@/components/app/SlideUpPage";
import { SEOHead } from "@/components/SEOHead";
import { useGoBack } from "@/hooks/useGoBack";
import { useAuth } from "@/hooks/useAuth";
import { useFriendships, useMyFriendCode, type FriendProfile } from "@/hooks/useFriends";
import { Constellation } from "@/components/hub/Constellation";
import { HubAddFriendSheet } from "@/components/hub/HubAddFriendSheet";
import { MyCodeSheet } from "@/components/hub/MyCodeSheet";
import { ChevronLeft, Bell, Settings, Gift, ChevronRight } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";
import { toast } from "sonner";

export default function AppHub() {
  const goBack = useGoBack({ fallback: "/app/home" });
  const { user } = useAuth();
  const { data: friendships = [] } = useFriendships();
  const { data: myCode } = useMyFriendCode();

  const [addOpen, setAddOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  const accepted = useMemo<FriendProfile[]>(
    () => friendships
      .filter((f) => f.friendship.status === "accepted")
      .map((f) => f.other),
    [friendships],
  );

  const displayName = (user?.user_metadata as any)?.full_name || (user?.email?.split("@")[0] ?? null);

  const shareInvite = async () => {
    if (!myCode) {
      toast.error("Your code isn't ready yet");
      return;
    }
    const url = "https://ladybosslook.com";
    const text = `Be my friend on Rilo 💝\n\nMy friend code: ${myCode}\n\n${url}`;
    try {
      if (Capacitor.isNativePlatform()) {
        await CapShare.share({ title: "Add me on Rilo", text, url, dialogTitle: "Invite a friend" });
        return;
      }
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: "Add me on Rilo", text, url });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Invite copied — paste anywhere");
    } catch (err: any) {
      if (err?.message && !/cancel/i.test(err.message)) {
        try { await navigator.clipboard.writeText(text); toast.success("Invite copied"); }
        catch { toast.error("Couldn't share"); }
      }
    }
  };

  return (
    <SlideUpPage defaultBack="/app/home">
      <SEOHead title="Hub · Rilo" description="Your circle of friends, glowing together." />
      <div
        className="min-h-[100dvh] relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, #3A1E66 0%, #1A0E2E 55%, #0E0820 100%)",
        }}
      >
        {/* Local animations for stars / floats */}
        <style>{`
          @keyframes hub-twinkle { 0%,100% { opacity: 0.25; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
          @keyframes hub-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          @keyframes hub-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        `}</style>

        {/* Top bar */}
        <div className="relative z-10 pt-[max(env(safe-area-inset-top),12px)] px-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className="w-10 h-10 grid place-items-center rounded-full bg-white/10 backdrop-blur-md active:scale-90"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 grid place-items-center rounded-full bg-white/10 backdrop-blur-md active:scale-90"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
            </button>
            <button
              className="w-10 h-10 grid place-items-center rounded-full bg-white/10 backdrop-blur-md active:scale-90"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 px-6 mt-3 text-center">
          <h1 className="text-white text-[26px] font-bold tracking-tight">Your circle</h1>
          <p className="text-white/65 text-[13px] mt-1">
            {accepted.length === 0
              ? "Light up the sky with friends."
              : `${accepted.length} ${accepted.length === 1 ? "star" : "stars"} shining with you.`}
          </p>
        </div>

        {/* Constellation scene */}
        <div className="relative z-10 px-2 mt-2">
          <Constellation friends={accepted} onAdd={() => setAddOpen(true)} />
        </div>

        {/* Invite banner (placeholder — you'll spec later) */}
        <div className="relative z-10 px-4 mt-12">
          <button
            onClick={shareInvite}
            className="w-full rounded-3xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform text-left shadow-ios"
            style={{
              background: "linear-gradient(135deg, rgba(235,94,51,0.95) 0%, rgba(214,67,122,0.92) 100%)",
            }}
          >
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-white/20 shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-bold text-white/85">
                Invite a friend
              </div>
              <div className="text-[15px] font-bold text-white leading-tight mt-0.5">
                Share Rilo — grow your circle
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/90 shrink-0" />
          </button>
        </div>

        <div className="h-24" />

        <HubAddFriendSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          onInvite={shareInvite}
          onShowMyCode={() => setCodeOpen(true)}
        />
        <MyCodeSheet
          open={codeOpen}
          onOpenChange={setCodeOpen}
          code={myCode ?? null}
          displayName={displayName}
        />
      </div>
    </SlideUpPage>
  );
}