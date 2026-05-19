import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sparkles, Music, X, ArrowDownLeft, ArrowUpRight, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRemoveFriendship, type FriendshipWithProfile } from "@/hooks/useFriends";
import type { UserMoment } from "@/hooks/useMoments";
import type { DedicationRow } from "@/hooks/useDedications";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendship: FriendshipWithProfile | null;
  onInspire: () => void;
  onGiftPlaylist: () => void;
}

interface ExchangeItem {
  id: string;
  direction: "sent" | "received";
  created_at: string;
  message: string | null;
  moment: Pick<UserMoment, "id" | "kind" | "title" | "emoji"> | null;
}

function useExchangeWithFriend(friendId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["exchange-with", user?.id, friendId],
    enabled: !!user?.id && !!friendId,
    queryFn: async (): Promise<ExchangeItem[]> => {
      if (!user?.id || !friendId) return [];
      const { data, error } = await supabase
        .from("dedications" as any)
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data ?? []) as unknown as DedicationRow[];
      if (rows.length === 0) return [];
      const momentIds = Array.from(new Set(rows.map((r) => r.moment_id)));
      const { data: moments } = await supabase
        .from("user_moments" as any)
        .select("id, kind, title, emoji")
        .in("id", momentIds);
      const mMap = new Map<string, ExchangeItem["moment"]>();
      (moments ?? []).forEach((m: any) => mMap.set(m.id, m));
      return rows.map((r) => ({
        id: r.id,
        direction: r.sender_id === user.id ? "sent" : "received",
        created_at: r.created_at,
        message: r.message,
        moment: mMap.get(r.moment_id) ?? null,
      }));
    },
  });
}

function formatSince(iso: string | null): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function FriendDetailSheet({
  open,
  onOpenChange,
  friendship,
  onInspire,
  onGiftPlaylist,
}: Props) {
  const friend = friendship?.other ?? null;
  const { data: exchange = [] } = useExchangeWithFriend(friend?.id);
  const remove = useRemoveFriendship();

  const stats = useMemo(() => {
    let sent = 0;
    let received = 0;
    exchange.forEach((x) => (x.direction === "sent" ? sent++ : received++));
    return { sent, received, total: exchange.length };
  }, [exchange]);

  const initial = (friend?.full_name || "?").charAt(0).toUpperCase();

  const handleRemove = async () => {
    if (!friendship) return;
    if (!confirm(`Remove ${friend?.full_name || "this friend"} from your sky?`)) return;
    try {
      await remove.mutateAsync(friendship.friendship.id);
      toast.success("Friend removed");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Could not remove");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] overflow-y-auto [&>button]:hidden"
        style={{ background: "linear-gradient(180deg, #1F1140 0%, #2A1655 60%, #0E0820 100%)" }}
      >
        <div className="p-5 pt-4 pb-10 text-white">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-3" />
          <div className="flex items-center justify-between">
            <div className="w-9" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/55">
              Friend
            </span>
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Hero — star avatar */}
          <div className="mt-4 flex flex-col items-center">
            <div className="relative w-[112px] h-[112px]">
              <svg
                aria-hidden
                className="absolute inset-[-30%] w-[160%] h-[160%] pointer-events-none"
                viewBox="0 0 100 100"
              >
                <defs>
                  <radialGradient id="friend-spark" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,220,170,0.85)" />
                    <stop offset="45%" stopColor="rgba(235,94,51,0.30)" />
                    <stop offset="100%" stopColor="rgba(235,94,51,0)" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="url(#friend-spark)" />
                <path
                  d="M50 4 L54 46 L96 50 L54 54 L50 96 L46 54 L4 50 L46 46 Z"
                  fill="rgba(255,230,190,0.5)"
                />
              </svg>
              {friend?.avatar_url ? (
                <img
                  src={friend.avatar_url}
                  alt=""
                  className="relative w-full h-full rounded-full object-cover shadow-ios"
                  style={{ border: "3px solid rgba(255,255,255,0.92)" }}
                />
              ) : (
                <div
                  className="relative w-full h-full rounded-full grid place-items-center text-[40px] font-bold text-black shadow-ios"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFE0B8 0%, #FFB088 60%, #EB5E33 100%)",
                    border: "3px solid rgba(255,255,255,0.92)",
                  }}
                >
                  {initial}
                </div>
              )}
            </div>
            <h2 className="mt-4 text-[24px] font-bold text-white text-center leading-tight">
              {friend?.full_name || "Friend"}
            </h2>
            <p className="text-[12px] text-white/60 mt-1">
              Shining together since {formatSince(friendship?.friendship.accepted_at ?? friendship?.friendship.created_at ?? null)}
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="Exchanged" value={stats.total} />
            <Stat label="You sent" value={stats.sent} />
            <Stat label="You got" value={stats.received} />
          </div>

          {/* Action tiles */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onOpenChange(false);
                setTimeout(onInspire, 200);
              }}
              className="rounded-2xl p-4 text-left active:scale-[0.98] transition-transform shadow-ios"
              style={{
                background:
                  "linear-gradient(135deg, rgba(235,94,51,0.95) 0%, rgba(214,67,122,0.92) 100%)",
              }}
            >
              <div className="w-9 h-9 rounded-xl grid place-items-center bg-white/20 mb-2">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-[14px] font-bold text-white leading-tight">Inspire</div>
              <div className="text-[11px] text-white/85 mt-0.5">Send a moment</div>
            </button>
            <button
              onClick={() => {
                onOpenChange(false);
                setTimeout(onGiftPlaylist, 200);
              }}
              className="rounded-2xl p-4 text-left active:scale-[0.98] transition-transform shadow-ios"
              style={{
                background:
                  "linear-gradient(135deg, rgba(45,212,168,0.95) 0%, rgba(56,140,222,0.92) 100%)",
              }}
            >
              <div className="w-9 h-9 rounded-xl grid place-items-center bg-white/20 mb-2">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="text-[14px] font-bold text-white leading-tight">Gift a playlist</div>
              <div className="text-[11px] text-white/85 mt-0.5">Theirs forever</div>
            </button>
          </div>

          {/* Exchange timeline */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-white text-[13px] font-bold tracking-wide">
                Your exchange
              </h3>
              {exchange.length > 0 && (
                <span className="text-white/55 text-[11px]">{exchange.length}</span>
              )}
            </div>

            {exchange.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.06] p-5 text-center">
                <div className="text-[28px] mb-1">✨</div>
                <div className="text-[13px] font-semibold text-white">
                  No moments shared yet
                </div>
                <div className="text-[12px] text-white/60 mt-1">
                  Be the first to inspire {friend?.full_name?.split(" ")[0] || "them"}.
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {exchange.map((x) => (
                  <li
                    key={x.id}
                    className="rounded-2xl bg-white/[0.07] p-3 flex items-start gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-xl grid place-items-center text-[18px] shrink-0"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      {x.moment?.emoji ?? "💝"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-white/55">
                        {x.direction === "sent" ? (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            You inspired them
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3" />
                            They inspired you
                          </>
                        )}
                      </div>
                      <div className="text-[13px] font-semibold text-white truncate mt-0.5">
                        {x.moment?.title || "A moment"}
                      </div>
                      {x.message && (
                        <div className="text-[12px] text-white/70 mt-0.5 line-clamp-2">
                          "{x.message}"
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-white/45 shrink-0 pt-0.5">
                      {formatWhen(x.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Danger zone */}
          <button
            onClick={handleRemove}
            disabled={remove.isPending}
            className="mt-8 mx-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] text-white/65 text-[12px] font-semibold active:scale-95 disabled:opacity-50"
          >
            <UserMinus className="w-3.5 h-3.5" />
            Remove friend
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] py-3 px-2 text-center">
      <div className="text-[20px] font-bold text-white leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/55 mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}