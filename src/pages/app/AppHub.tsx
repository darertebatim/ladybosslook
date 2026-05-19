import { useMemo, useState } from "react";
import { SlideUpPage } from "@/components/app/SlideUpPage";
import { SEOHead } from "@/components/SEOHead";
import { useGoBack } from "@/hooks/useGoBack";
import { useAuth } from "@/hooks/useAuth";
import { useFriendships, useMyFriendCode, type FriendProfile } from "@/hooks/useFriends";
import { Constellation } from "@/components/hub/Constellation";
import { HubAddFriendSheet } from "@/components/hub/HubAddFriendSheet";
import { MyCodeSheet } from "@/components/hub/MyCodeSheet";
import { RecentMomentsRow } from "@/components/hub/RecentMomentsRow";
import { GiftMomentInviteSheet } from "@/components/hub/GiftMomentInviteSheet";
import { GiftPlaylistInviteSheet } from "@/components/hub/GiftPlaylistInviteSheet";
import { DedicationReceivedSheet } from "@/components/friends/DedicationReceivedSheet";
import { DedicateMomentSheet } from "@/components/friends/DedicateMomentSheet";
import { FriendDetailSheet } from "@/components/hub/FriendDetailSheet";
import { useReceivedDedications, type DedicationWithRelations } from "@/hooks/useDedications";
import { ChevronLeft, Bell, Settings, Gift, ChevronRight, Music, Plus } from "lucide-react";
import { HubNotificationsSheet } from "@/components/hub/HubNotificationsSheet";

export default function AppHub() {
  const goBack = useGoBack("/app/home");
  const { user } = useAuth();
  const { data: friendships = [] } = useFriendships();
  const { data: myCode } = useMyFriendCode();

  const [addOpen, setAddOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [giftInviteOpen, setGiftInviteOpen] = useState(false);
  const [giftPlaylistOpen, setGiftPlaylistOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openedDedication, setOpenedDedication] = useState<DedicationWithRelations | null>(null);
  const [sendBackMoment, setSendBackMoment] = useState<null | { recipientId: string; recipientName: string | null }>(null);
  const [openFriendId, setOpenFriendId] = useState<string | null>(null);

  const { data: receivedDedications = [] } = useReceivedDedications();
  const unseenDedication = useMemo(
    () => receivedDedications.find((d) => !d.dedication.seen_at) ?? null,
    [receivedDedications],
  );

  const incomingRequestCount = useMemo(
    () =>
      friendships.filter(
        (f) => f.friendship.status === "pending" && f.friendship.addressee_id === user?.id,
      ).length,
    [friendships, user?.id],
  );
  const unseenDedCount = useMemo(
    () => receivedDedications.filter((d) => !d.dedication.seen_at).length,
    [receivedDedications],
  );
  const notifCount = incomingRequestCount + unseenDedCount;

  const accepted = useMemo<FriendProfile[]>(
    () => friendships
      .filter((f) => f.friendship.status === "accepted")
      .map((f) => f.other),
    [friendships],
  );

  const openFriendship = useMemo(
    () =>
      friendships.find(
        (f) => f.friendship.status === "accepted" && f.other.id === openFriendId,
      ) ?? null,
    [friendships, openFriendId],
  );

  const displayName = (user?.user_metadata as any)?.full_name || (user?.email?.split("@")[0] ?? null);

  const openGiftInvite = () => setGiftInviteOpen(true);

  return (
    <SlideUpPage defaultBack="/app/home">
      <SEOHead title="Friends Hub · Rilo" description="Your friends, glowing together." />
      <div
        className="min-h-[100dvh] relative"
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

        {/* Top bar — sticky */}
        <div
          className="sticky top-0 z-30 pt-[max(env(safe-area-inset-top),12px)] pb-2 px-4 flex items-center justify-between backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(to bottom, rgba(58,30,102,0.85) 0%, rgba(58,30,102,0.55) 70%, rgba(58,30,102,0) 100%)",
          }}
        >
          <button
            onClick={goBack}
            className="w-10 h-10 grid place-items-center rounded-full bg-white/10 backdrop-blur-md active:scale-90"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="h-10 pl-2.5 pr-3.5 grid grid-flow-col items-center gap-1.5 rounded-full bg-white active:scale-95 shadow-ios"
              aria-label="Add friend"
            >
              <span
                className="w-6 h-6 grid place-items-center rounded-full"
                style={{ background: "linear-gradient(135deg, #FFB088 0%, #EB5E33 100%)" }}
              >
                <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
              <span className="text-[13px] font-bold text-[hsl(var(--brand-primary))] leading-none">
                Add friend
              </span>
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              className="w-10 h-10 grid place-items-center rounded-full bg-white/10 backdrop-blur-md active:scale-90"
              aria-label="Notifications"
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-white" />
                {notifCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full text-[10px] font-bold text-black"
                    style={{
                      background: "linear-gradient(135deg, #FFE0B8 0%, #EB5E33 100%)",
                      boxShadow: "0 0 8px 1px rgba(235,94,51,0.7)",
                    }}
                  >
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </div>
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
        <div className="relative z-10 px-6 mt-1 text-center">
          <h1 className="text-white text-[32px] font-bold tracking-tight leading-tight">Your friends</h1>
          <p className="text-white/65 text-[12px] mt-0.5">
            {accepted.length === 0
              ? "Light up the sky with friends."
              : accepted.length <= 9
                ? `${accepted.length} ${accepted.length === 1 ? "star" : "stars"} shining with you.`
                : `Your inner circle of 9 — ${accepted.length - 9} more below.`}
          </p>
        </div>

        {/* Constellation scene */}
        <div className="relative z-10 px-3 mt-1">
          <Constellation
            friends={accepted}
            onAdd={() => setAddOpen(true)}
            onFriendTap={(f) => setOpenFriendId(f.id)}
          />
        </div>

        {/* Overflow: all friends beyond the 9-star inner circle */}
        {accepted.length > 9 && (
          <div className="relative z-10 px-4 mt-4">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-white text-[13px] font-bold tracking-wide">
                All friends
              </h2>
              <span className="text-white/55 text-[12px] font-medium">
                {accepted.length}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {accepted.slice(9).map((f) => {
                const initial = (f.full_name || "?").charAt(0).toUpperCase();
                return (
                  <div key={f.id} className="shrink-0 w-[64px] flex flex-col items-center">
                    {f.avatar_url ? (
                      <img
                        src={f.avatar_url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                        style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full grid place-items-center text-base font-bold text-black"
                        style={{
                          background: "linear-gradient(135deg, #FFE0B8 0%, #FFB088 60%, #EB5E33 100%)",
                          border: "1.5px solid rgba(255,255,255,0.7)",
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <span
                      className="mt-1 text-[10px] font-medium text-white/85 truncate max-w-[60px] text-center"
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                    >
                      {f.full_name?.split(" ")[0] || "Friend"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite banner */}
        <div className="relative z-10 px-4 mt-5">
          <button
            onClick={openGiftInvite}
            className="w-full rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-transform text-left shadow-ios"
            style={{
              background: "linear-gradient(135deg, rgba(235,94,51,0.95) 0%, rgba(214,67,122,0.92) 100%)",
            }}
          >
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-white/20 shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/85">
                Inspire a friend
              </div>
              <div className="text-[14px] font-bold text-white leading-tight mt-0.5">
                Share a moment that worked for you
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/90 shrink-0" />
          </button>
        </div>

        {/* Gift a playlist banner */}
        <div className="relative z-10 px-4 mt-2.5">
          <button
            onClick={() => setGiftPlaylistOpen(true)}
            className="w-full rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-transform text-left shadow-ios"
            style={{
              background: "linear-gradient(135deg, rgba(45,212,168,0.95) 0%, rgba(56,140,222,0.92) 100%)",
            }}
          >
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-white/20 shrink-0">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/85">
                Gift a playlist
              </div>
              <div className="text-[14px] font-bold text-white leading-tight mt-0.5">
                Send one of your playlists — yours forever for them
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/90 shrink-0" />
          </button>
        </div>

        {/* Received dedications strip (only if any exist) */}
        {receivedDedications.length > 0 && (
          <div className="relative z-10 px-4 mt-5">
            <div className="text-white/80 text-[11px] uppercase tracking-wider font-semibold mb-2">
              For you {unseenDedication && <span className="ml-1 text-[hsl(var(--brand-primary))]">●</span>}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {receivedDedications.slice(0, 6).map((d) => (
                <button
                  key={d.dedication.id}
                  onClick={() => setOpenedDedication(d)}
                  className="shrink-0 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-[12px] font-medium active:scale-95 flex items-center gap-2"
                >
                  <span>{d.moment?.emoji ?? "💝"}</span>
                  <span className="max-w-[140px] truncate">
                    from {d.other?.full_name?.split(" ")[0] || "a friend"}
                  </span>
                  {!d.dedication.seen_at && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-primary))]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom half: fresh-from-you moments to dedicate */}
        <div className="relative z-10 mt-6">
          <RecentMomentsRow />
        </div>

        <HubAddFriendSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          onInvite={openGiftInvite}
          onShowMyCode={() => setCodeOpen(true)}
        />
        <GiftMomentInviteSheet
          open={giftInviteOpen}
          onOpenChange={setGiftInviteOpen}
          myCode={myCode ?? null}
        />
        <GiftPlaylistInviteSheet
          open={giftPlaylistOpen}
          onOpenChange={setGiftPlaylistOpen}
          myCode={myCode ?? null}
        />
        <MyCodeSheet
          open={codeOpen}
          onOpenChange={setCodeOpen}
          code={myCode ?? null}
          displayName={displayName}
        />
        <DedicationReceivedSheet
          dedication={openedDedication}
          onOpenChange={(v) => !v && setOpenedDedication(null)}
          onSendBack={(id, name) => {
            setOpenedDedication(null);
            setTimeout(() => setSendBackMoment({ recipientId: id, recipientName: name }), 200);
          }}
        />
        <DedicateMomentSheet
          open={!!sendBackMoment}
          onOpenChange={(v) => !v && setSendBackMoment(null)}
          recipientId={sendBackMoment?.recipientId ?? null}
          recipientName={sendBackMoment?.recipientName ?? null}
        />
        <HubNotificationsSheet
          open={notifOpen}
          onOpenChange={setNotifOpen}
          onOpenDedication={(d) => setOpenedDedication(d)}
        />
        <FriendDetailSheet
          open={!!openFriendship}
          onOpenChange={(v) => !v && setOpenFriendId(null)}
          friendship={openFriendship}
          onInspire={() => {
            if (!openFriendship) return;
            setSendBackMoment({
              recipientId: openFriendship.other.id,
              recipientName: openFriendship.other.full_name,
            });
          }}
          onGiftPlaylist={() => setGiftPlaylistOpen(true)}
        />
      </div>
    </SlideUpPage>
  );
}