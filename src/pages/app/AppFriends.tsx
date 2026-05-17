import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/app/ui/PageHeader";
import { TabPills } from "@/components/app/ui/TabPills";
import { SlideUpPage } from "@/components/app/SlideUpPage";
import { SEOHead } from "@/components/SEOHead";
import { FriendsHero } from "@/components/friends/FriendsHero";
import { PendingBanners } from "@/components/friends/PendingBanners";
import { AddFriendSheet } from "@/components/friends/AddFriendSheet";
import { DedicateMomentSheet } from "@/components/friends/DedicateMomentSheet";
import { DedicationReceivedSheet } from "@/components/friends/DedicationReceivedSheet";
import { ShareCarePackageSheet } from "@/components/friends/ShareCarePackageSheet";
import type { SharePayload } from "@/lib/dedicationShare";
import { useAuth } from "@/hooks/useAuth";
import {
  useFriendships,
  useMyFriendCode,
  useRemoveFriendship,
  type FriendshipWithProfile,
} from "@/hooks/useFriends";
import {
  useReceivedDedications,
  type DedicationWithRelations,
} from "@/hooks/useDedications";
import { Send, X, Heart, Gift } from "lucide-react";
import { toast } from "sonner";
import { defaultEmojiForKind } from "@/lib/moments";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { useEffect } from "react";

type TabValue = "friends" | "requests" | "received";

export default function AppFriends() {
  const { user } = useAuth();
  const { data: friendships = [] } = useFriendships();
  const { data: dedications = [] } = useReceivedDedications();
  const { data: myCode } = useMyFriendCode();
  const remove = useRemoveFriendship();
  const [tab, setTab] = useState<TabValue>("friends");
  const [addOpen, setAddOpen] = useState(false);
  const [dedicateTarget, setDedicateTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<(SharePayload & { momentEmoji: string | null }) | null>(null);
  const [openedDedication, setOpenedDedication] = useState<DedicationWithRelations | null>(null);
  const [params, setParams] = useSearchParams();

  const accepted = useMemo(
    () => friendships.filter((f) => f.friendship.status === "accepted"),
    [friendships]
  );
  const incoming = useMemo(
    () => friendships.filter((f) => f.friendship.status === "pending" && f.friendship.addressee_id === user?.id),
    [friendships, user?.id]
  );
  const outgoing = useMemo(
    () => friendships.filter((f) => f.friendship.status === "pending" && f.friendship.requester_id === user?.id),
    [friendships, user?.id]
  );
  const unseenDedications = useMemo(
    () => dedications.filter((d) => !d.dedication.seen_at),
    [dedications]
  );

  // Deep link: ?dedication=:id
  useEffect(() => {
    const id = params.get("dedication");
    if (!id) return;
    const match = dedications.find((d) => d.dedication.id === id);
    if (match) {
      setOpenedDedication(match);
      params.delete("dedication");
      setParams(params, { replace: true });
    }
  }, [params, dedications, setParams]);

  const shareInvite = async () => {
    if (!myCode) return;
    const text = `Be my friend on Rilo 💝\n\nMy friend code: ${myCode}\n\nhttps://ladybosslook.com`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Add me on Rilo", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Invite copied — paste anywhere");
      }
    } catch { /* user cancelled */ }
  };

  return (
    <SlideUpPage defaultBack="/app/home">
      <SEOHead title="Friends · Rilo" description="Connect with friends and dedicate moments." />
      <div className="min-h-[100dvh] bg-[hsl(var(--bg-warm))]">
        <PageHeader title="Friends" back />

        <FriendsHero onAddFriend={() => setAddOpen(true)} onShareInvite={shareInvite} />

        {/* Send Care Package to non-user */}
        <div className="px-3 mt-3">
          <button
            onClick={() => setTokenSheetOpen(true)}
            className="w-full p-4 rounded-3xl bg-white/70 dark:bg-white/10 backdrop-blur-2xl shadow-ios active:scale-[0.99] transition-transform flex items-center gap-3 text-left"
          >
            <div className="w-11 h-11 rounded-2xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]">
              <Gift className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-black dark:text-white">
                Send to anyone — even if they're not on Rilo
              </div>
              <div className="text-xs text-[hsl(var(--fg-warm-muted))]">
                Create a share link · expires in 30 days
              </div>
            </div>
          </button>
        </div>

        <PendingBanners
          incoming={incoming}
          unseenDedications={unseenDedications}
          onOpenDedication={setOpenedDedication}
        />

        <div className="px-3 mt-5">
          <TabPills
            value={tab}
            onChange={(v) => setTab(v as TabValue)}
            options={[
              { value: "friends", label: `Friends${accepted.length ? ` · ${accepted.length}` : ""}` },
              { value: "requests", label: `Requests${(incoming.length + outgoing.length) ? ` · ${incoming.length + outgoing.length}` : ""}` },
              { value: "received", label: `Received${unseenDedications.length ? ` · ${unseenDedications.length}` : ""}` },
            ]}
          />
        </div>

        <div className="px-3 mt-4 pb-24 space-y-2.5">
          {tab === "friends" && (
            accepted.length === 0 ? (
              <EmptyState
                emoji="👯"
                title="No friends yet"
                subtitle="Share your code or add a friend to start dedicating moments."
              />
            ) : (
              accepted.map((f) => (
                <FriendRow
                  key={f.friendship.id}
                  data={f}
                  onDedicate={() => setDedicateTarget({ id: f.other.id, name: f.other.full_name })}
                  onRemove={() => remove.mutate(f.friendship.id)}
                />
              ))
            )
          )}

          {tab === "requests" && (
            (incoming.length + outgoing.length) === 0 ? (
              <EmptyState emoji="📬" title="No pending requests" subtitle="When someone adds you, they'll show up here." />
            ) : (
              <>
                {incoming.length > 0 && (
                  <>
                    <SectionLabel>Incoming</SectionLabel>
                    <PendingBanners incoming={incoming} unseenDedications={[]} onOpenDedication={() => {}} />
                  </>
                )}
                {outgoing.length > 0 && (
                  <>
                    <SectionLabel>Sent</SectionLabel>
                    {outgoing.map((f) => (
                      <div key={f.friendship.id} className="p-4 rounded-3xl bg-white/60 dark:bg-white/10 backdrop-blur-2xl shadow-ios flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] grid place-items-center font-semibold text-black">
                          {(f.other.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold text-black dark:text-white truncate">
                            {f.other.full_name || "Pending"}
                          </div>
                          <div className="text-xs text-[hsl(var(--fg-warm-muted))]">Waiting…</div>
                        </div>
                        <button
                          onClick={() => remove.mutate(f.friendship.id)}
                          className="w-9 h-9 grid place-items-center rounded-full bg-black/5 text-black/60 active:scale-90"
                          aria-label="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )
          )}

          {tab === "received" && (
            dedications.length === 0 ? (
              <EmptyState
                emoji="💝"
                title="No dedications yet"
                subtitle="When friends send you a moment, it'll appear here."
              />
            ) : (
              dedications.map((d) => (
                <button
                  key={d.dedication.id}
                  onClick={() => setOpenedDedication(d)}
                  className="w-full text-left rounded-3xl p-4 flex items-center gap-3 bg-white/60 dark:bg-white/10 backdrop-blur-2xl shadow-ios active:scale-[0.98] transition-transform"
                >
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] grid place-items-center">
                    <FluentEmoji
                      emoji={d.moment?.emoji || (d.moment ? defaultEmojiForKind(d.moment.kind as any) : "💝")}
                      size={36}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--fg-warm-muted))]">
                      from {d.other?.full_name || "a friend"}
                    </div>
                    <div className="text-[15px] font-semibold text-black dark:text-white truncate">
                      {d.moment?.title ?? "A moment"}
                    </div>
                  </div>
                  {!d.dedication.seen_at && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--brand-primary))]" />
                  )}
                </button>
              ))
            )
          )}
        </div>

        <AddFriendSheet open={addOpen} onOpenChange={setAddOpen} />
        <DedicateMomentSheet
          open={!!dedicateTarget}
          onOpenChange={(v) => !v && setDedicateTarget(null)}
          recipientId={dedicateTarget?.id ?? null}
          recipientName={dedicateTarget?.name ?? null}
        />
        <DedicateMomentSheet
          open={tokenSheetOpen}
          onOpenChange={setTokenSheetOpen}
          recipientId={null}
          recipientName={null}
          tokenMode
          onTokenCreated={(args) => {
            setSharePayload({
              token: args.token,
              senderName: null,
              momentTitle: args.momentTitle,
              recipientHint: args.recipientHint,
              momentEmoji: args.momentEmoji,
            });
          }}
        />
        <ShareCarePackageSheet
          open={!!sharePayload}
          onOpenChange={(v) => !v && setSharePayload(null)}
          payload={sharePayload}
          momentEmoji={sharePayload?.momentEmoji}
        />
        <DedicationReceivedSheet
          dedication={openedDedication}
          onOpenChange={(v) => !v && setOpenedDedication(null)}
          onSendBack={(id, name) => {
            setOpenedDedication(null);
            setTimeout(() => setDedicateTarget({ id, name }), 200);
          }}
        />
      </div>
    </SlideUpPage>
  );
}

function FriendRow({
  data, onDedicate, onRemove,
}: {
  data: FriendshipWithProfile;
  onDedicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-3xl p-3 pl-4 bg-white/60 dark:bg-white/10 backdrop-blur-2xl shadow-ios flex items-center gap-3">
      {data.other.avatar_url ? (
        <img
          src={data.other.avatar_url}
          alt=""
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] grid place-items-center text-lg font-semibold text-black">
          {(data.other.full_name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-black dark:text-white truncate">
          {data.other.full_name || "Friend"}
        </div>
        <div className="text-xs text-[hsl(var(--fg-warm-muted))] flex items-center gap-1">
          <Heart className="w-3 h-3" /> Friends
        </div>
      </div>
      <button
        onClick={onDedicate}
        style={{ backgroundColor: "#EB5E33", color: "#FFFFFF" }}
        className="inline-flex min-h-10 items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold shadow-ios active:scale-95 transition-transform"
      >
        <Send className="w-3.5 h-3.5" /> Dedicate
      </button>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="mt-6 py-10 px-6 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl text-center shadow-ios">
      <div className="text-5xl mb-3">{emoji}</div>
      <div className="text-base font-semibold text-black dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-[hsl(var(--fg-warm-muted))] max-w-[34ch] mx-auto">{subtitle}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 pt-3 pb-1 text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--fg-warm-muted))]">
      {children}
    </div>
  );
}