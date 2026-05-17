import { Copy, Share2, UserPlus, Sparkles } from "lucide-react";
import { useMyFriendCode } from "@/hooks/useFriends";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

interface FriendsHeroProps {
  onAddFriend: () => void;
  onShareInvite: () => void;
}

export function FriendsHero({ onAddFriend, onShareInvite }: FriendsHeroProps) {
  const { data: code } = useMyFriendCode();

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      haptic.success();
      toast.success("Code copied ✨");
    } catch { /* noop */ }
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] mx-3 mt-2 p-6 shadow-ios"
         style={{
           background:
             "linear-gradient(135deg, hsl(var(--tint-peach)) 0%, hsl(var(--tint-lavender)) 60%, hsl(var(--tint-mint)) 100%)",
         }}>
      {/* Glow blobs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-[hsl(var(--brand-primary))]/15 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-md text-[11px] font-semibold uppercase tracking-wider text-black">
          <Sparkles className="w-3 h-3" /> Friends
        </div>
        <h2 className="mt-3 text-[28px] leading-[1.1] font-bold text-black">
          Share moments with the people who matter.
        </h2>
        <p className="mt-2 text-[14px] text-black/70 max-w-[28ch]">
          Dedicate a breathe, a reflection, or a routine to a friend.
        </p>

        {/* Code pill */}
        <button
          onClick={copyCode}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-xl text-black shadow-ios active:scale-95 transition-transform"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-black/60">Your code</span>
          <span className="font-mono text-base font-bold tracking-widest">
            {code ?? "······"}
          </span>
          <Copy className="w-4 h-4 text-black/60" />
        </button>

        {/* CTAs */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onAddFriend}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-black text-white shadow-ios active:scale-95 transition-transform font-semibold"
          >
            <UserPlus className="w-4 h-4" /> Add friend
          </button>
          <button
            onClick={onShareInvite}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/80 backdrop-blur-xl text-black shadow-ios active:scale-95 transition-transform font-semibold"
          >
            <Share2 className="w-4 h-4" /> Share invite
          </button>
        </div>
      </div>
    </div>
  );
}