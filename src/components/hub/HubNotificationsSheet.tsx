import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Bell, Check, X, Heart, Sparkles } from "lucide-react";
import { useFriendships, useRespondToFriendRequest, type FriendProfile } from "@/hooks/useFriends";
import { useReceivedDedications, type DedicationWithRelations } from "@/hooks/useDedications";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenDedication: (d: DedicationWithRelations) => void;
}

export function HubNotificationsSheet({ open, onOpenChange, onOpenDedication }: Props) {
  const { user } = useAuth();
  const { data: friendships = [] } = useFriendships();
  const { data: dedications = [] } = useReceivedDedications();
  const respond = useRespondToFriendRequest();

  const incoming = useMemo(
    () =>
      friendships.filter(
        (f) => f.friendship.status === "pending" && f.friendship.addressee_id === user?.id,
      ),
    [friendships, user?.id],
  );
  const unseenDeds = useMemo(() => dedications.filter((d) => !d.dedication.seen_at), [dedications]);
  const total = incoming.length + unseenDeds.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[88dvh] [&>button]:hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #3A1E66 0%, #1A0E2E 60%, #0E0820 100%)",
        }}
      >
        {/* Handle */}
        <div className="pt-3 pb-1 grid place-items-center">
          <div className="w-10 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 grid place-items-center rounded-full"
              style={{ background: "linear-gradient(135deg, #FFE0B8 0%, #EB5E33 100%)" }}
            >
              <Bell className="w-4.5 h-4.5 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-white text-[17px] font-bold leading-tight">Notifications</h2>
              <p className="text-white/60 text-[12px]">
                {total === 0 ? "You're all caught up" : `${total} new`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),20px)] overflow-y-auto max-h-[70dvh]">
          {total === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2.5">
              {incoming.length > 0 && (
                <SectionLabel>Friend requests</SectionLabel>
              )}
              {incoming.map((f) => (
                <RequestCard
                  key={f.friendship.id}
                  friend={f.other}
                  busy={respond.isPending}
                  onAccept={() => respond.mutate({ id: f.friendship.id, accept: true })}
                  onDecline={() => respond.mutate({ id: f.friendship.id, accept: false })}
                />
              ))}

              {unseenDeds.length > 0 && (
                <SectionLabel className={incoming.length ? "pt-3" : ""}>Moments for you</SectionLabel>
              )}
              {unseenDeds.map((d) => (
                <DedicationCard
                  key={d.dedication.id}
                  ded={d}
                  onOpen={() => {
                    onOpenDedication(d);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-1 pb-1 text-[11px] uppercase tracking-[0.12em] font-bold text-white/55 ${className}`}>
      {children}
    </div>
  );
}

function Avatar({ friend, size = 44 }: { friend: FriendProfile; size?: number }) {
  const initial = (friend.full_name || "?").charAt(0).toUpperCase();
  if (friend.avatar_url) {
    return (
      <img
        src={friend.avatar_url}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: "2px solid rgba(255,255,255,0.85)" }}
      />
    );
  }
  return (
    <div
      className="rounded-full grid place-items-center text-black font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #FFE0B8 0%, #FFB088 60%, #EB5E33 100%)",
        border: "2px solid rgba(255,255,255,0.85)",
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}

function RequestCard({
  friend,
  onAccept,
  onDecline,
  busy,
}: {
  friend: FriendProfile;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <Avatar friend={friend} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-[14px] font-semibold truncate">
          {friend.full_name || "Someone"}
        </p>
        <p className="text-white/60 text-[12px] truncate">wants to join your circle</p>
      </div>
      <button
        onClick={onDecline}
        disabled={busy}
        className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90 disabled:opacity-50"
        aria-label="Decline"
      >
        <X className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={onAccept}
        disabled={busy}
        className="w-9 h-9 grid place-items-center rounded-full active:scale-90 disabled:opacity-50 shadow-ios"
        style={{ background: "linear-gradient(135deg, #FFE0B8 0%, #EB5E33 100%)" }}
        aria-label="Accept"
      >
        <Check className="w-4 h-4 text-black" strokeWidth={3} />
      </button>
    </div>
  );
}

function DedicationCard({
  ded,
  onOpen,
}: {
  ded: DedicationWithRelations;
  onOpen: () => void;
}) {
  const fromName = (ded as any).sender?.full_name || (ded as any).from?.full_name || "A friend";
  const fromAvatar = (ded as any).sender?.avatar_url || (ded as any).from?.avatar_url;
  const friendShape: FriendProfile = {
    id: "x",
    full_name: fromName,
    avatar_url: fromAvatar ?? null,
  } as any;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
      style={{
        background:
          "linear-gradient(135deg, rgba(235,94,51,0.22) 0%, rgba(178,140,255,0.18) 100%)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <Avatar friend={friendShape} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-[14px] font-semibold truncate flex items-center gap-1.5">
          {fromName} <Heart className="w-3.5 h-3.5" fill="#FFB7B7" stroke="none" />
        </p>
        <p className="text-white/70 text-[12px] truncate">sent you a moment · tap to open</p>
      </div>
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: "#EB5E33", boxShadow: "0 0 10px 2px rgba(235,94,51,0.7)" }}
      />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="pt-8 pb-10 grid place-items-center text-center px-6">
      <div
        className="w-16 h-16 rounded-full grid place-items-center mb-4"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Sparkles className="w-7 h-7 text-white/80" />
      </div>
      <p className="text-white text-[15px] font-semibold">No new sparks</p>
      <p className="text-white/55 text-[13px] mt-1">
        Friend requests and moments from your circle will land here.
      </p>
    </div>
  );
}