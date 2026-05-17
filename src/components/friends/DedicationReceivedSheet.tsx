import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { DedicationWithRelations } from "@/hooks/useDedications";
import { useMarkDedicationSeen } from "@/hooks/useDedications";
import { MomentCard } from "./MomentCard";
import { Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface Props {
  dedication: DedicationWithRelations | null;
  onOpenChange: (open: boolean) => void;
  onSendBack: (recipientId: string, recipientName: string | null) => void;
}

export function DedicationReceivedSheet({ dedication, onOpenChange, onSendBack }: Props) {
  const open = !!dedication;
  const markSeen = useMarkDedicationSeen();

  useEffect(() => {
    if (dedication && !dedication.dedication.seen_at) {
      markSeen.mutate(dedication.dedication.id);
    }
    if (open) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ["#FF8FA3", "#C4B5FD", "#34D399"] });
    }
  }, [open]); // eslint-disable-line

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[90dvh] overflow-y-auto"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--tint-peach)) 0%, hsl(var(--tint-lavender)) 60%, hsl(var(--tint-mint)) 100%)",
        }}
      >
        <div className="p-6 pt-5">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-black/15 mb-5" />
          {dedication && (
            <>
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-black" />
                <span className="text-[11px] uppercase tracking-wider font-semibold text-black">
                  A dedication for you
                </span>
              </div>
              <h2 className="text-center text-[26px] leading-tight font-bold text-black px-4">
                {dedication.other?.full_name || "A friend"} dedicated this to you
              </h2>

              {dedication.moment && (
                <div className="mt-6">
                  <MomentCard
                    kind={dedication.moment.kind as any}
                    title={dedication.moment.title}
                    emoji={dedication.moment.emoji}
                    createdAt={dedication.moment.created_at}
                    size="lg"
                  />
                </div>
              )}

              {dedication.dedication.message && (
                <div className="mt-4 p-4 rounded-2xl bg-white/70 backdrop-blur-xl shadow-ios">
                  <p className="text-[15px] text-black italic">
                    "{dedication.dedication.message}"
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (dedication.other) {
                    onSendBack(dedication.other.id, dedication.other.full_name);
                  }
                }}
                className="mt-6 w-full py-3.5 rounded-2xl bg-black text-white font-semibold shadow-ios active:scale-[0.98] transition-transform"
              >
                Send one back 💝
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="mt-2 w-full py-3 rounded-2xl text-black/70 font-medium active:scale-[0.98] transition-transform"
              >
                Close
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}