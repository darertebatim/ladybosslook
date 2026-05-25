import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import type { PathStep } from "@/lib/pathEngine";
import { ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: PathStep | null;
  candidates: Array<PathStep & { _score: number }>;
  onPick: (target: PathStep) => void;
}

export function SwapSheet({ open, onOpenChange, current, candidates, onPick }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 max-h-[80dvh] overflow-y-auto bg-[#FFF8F3]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[18px] font-bold" style={{ color: "#2D1A0E" }}>
            Swap this step
          </SheetTitle>
          <SheetDescription className="text-[12.5px]" style={{ color: "#8B6E5A" }}>
            {current ? `Replace "${current.title}" with…` : "Pick a better fit for right now."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2 pb-6">
          {candidates.length === 0 && (
            <div className="text-[12.5px] text-center py-8" style={{ color: "#8B6E5A" }}>
              No alternates available right now.
            </div>
          )}
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c)}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-white active:scale-[0.99] transition-transform"
              style={{ border: "1px solid #F5DCC8" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#FFE6C9" }}
              >
                <FluentEmoji emoji={c.emoji} size={24} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#EB5E33" }}
                >
                  {c.kicker}
                </div>
                <div className="text-[14px] font-semibold leading-tight mt-0.5 truncate" style={{ color: "#2D1A0E" }}>
                  {c.title}
                </div>
                <div className="text-[11.5px] mt-0.5 truncate" style={{ color: "#8B6E5A" }}>
                  {c.meta}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#8B6E5A" }} />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}