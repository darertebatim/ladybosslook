import { Copy, Share2, UserPlus, Heart } from "lucide-react";
import { useMyFriendCode, useFriendships } from "@/hooks/useFriends";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

interface FriendsHeroProps {
  onAddFriend: () => void;
  onShareInvite: () => void;
}

export function FriendsHero({ onAddFriend, onShareInvite }: FriendsHeroProps) {
  const { data: code } = useMyFriendCode();
  const { data: friendships = [] } = useFriendships();
  const friends = friendships.filter((f) => f.friendship.status === "accepted").slice(0, 4);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      haptic.success();
      toast.success("Code copied ✨");
    } catch { /* noop */ }
  };

  return (
    <div className="px-3 mt-2">
      <div className="relative overflow-hidden rounded-[32px] px-6 pt-7 pb-6 shadow-ios bg-white/70 dark:bg-white/5 backdrop-blur-xl">
        {/* Warm ambient glow */}
        <div
          aria-hidden
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[360px] h-[260px] rounded-full pointer-events-none opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--tint-peach-mid)) 0%, hsl(var(--tint-peach)) 45%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-10 w-56 h-56 rounded-full pointer-events-none opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, hsl(var(--tint-lavender-mid)), transparent 70%)" }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Stacked avatars / inner circle motif */}
          <CircleMotif friends={friends} />

          <h2 className="mt-5 text-[26px] leading-[1.15] font-bold text-black dark:text-white max-w-[22ch]">
            Your inner circle of care.
          </h2>
          <p className="mt-2 text-[14px] text-[hsl(var(--fg-warm-muted))] max-w-[28ch]">
            Send a breathe, a reflection or a moment to someone who matters.
          </p>

          {/* Code chip — dashed, cozy */}
          <button
            onClick={copyCode}
            className="mt-5 inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[hsl(var(--bg-warm))] dark:bg-white/5 border-2 border-dashed border-[hsl(var(--tint-peach-mid))] active:scale-95 transition-transform"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--fg-warm-muted))]">
              Your code
            </span>
            <span className="font-mono text-[15px] font-bold tracking-[0.2em] text-black dark:text-white">
              {code ?? "······"}
            </span>
            <Copy className="w-4 h-4" style={{ color: "#EB5E33" }} />
          </button>

          {/* CTAs */}
          <div className="mt-5 grid grid-cols-2 gap-3 w-full">
            <button
              onClick={onAddFriend}
              style={{ backgroundColor: "#EB5E33", color: "#FFFFFF" }}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl shadow-ios active:scale-95 transition-transform font-semibold"
            >
              <UserPlus className="w-4 h-4" /> Add friend
            </button>
            <button
              onClick={onShareInvite}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-white dark:bg-white/10 border border-[hsl(var(--tint-peach-mid))] text-black dark:text-white active:scale-95 transition-transform font-semibold"
            >
              <Share2 className="w-4 h-4" /> Share invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CircleMotif({
  friends,
}: {
  friends: { other: { full_name: string | null; avatar_url: string | null } }[];
}) {
  // Always render YOU in the center, friends around.
  const slots = [0, 1, 2, 3];
  return (
    <div className="relative w-[180px] h-[88px]">
      {/* Center: you (heart) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full grid place-items-center shadow-ios"
        style={{ backgroundColor: "#EB5E33" }}
      >
        <Heart className="w-6 h-6" fill="#FFFFFF" style={{ color: "#FFFFFF" }} />
      </div>
      {/* Friend bubbles around */}
      {slots.map((i) => {
        const f = friends[i];
        // Positions: left-far, left-near, right-near, right-far
        const positions = [
          "left-0 top-1",
          "left-8 top-8",
          "right-8 top-8",
          "right-0 top-1",
        ];
        const sizes = ["w-10 h-10", "w-11 h-11", "w-11 h-11", "w-10 h-10"];
        return (
          <div
            key={i}
            className={`absolute ${positions[i]} ${sizes[i]} rounded-full border-[3px] border-white dark:border-[hsl(var(--bg-warm))] shadow-ios grid place-items-center overflow-hidden bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]`}
          >
            {f?.other.avatar_url ? (
              <img src={f.other.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-black">
                {f ? (f.other.full_name || "?").charAt(0).toUpperCase() : "+"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}