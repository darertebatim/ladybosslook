import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Flame, Sparkles, Check, ArrowUp } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { useTodayPath, useSkipPathStep } from "@/hooks/useTodayPath";
import { useAuth } from "@/hooks/useAuth";
import { useGoBack } from "@/hooks/useGoBack";
import type { PathStep } from "@/lib/pathEngine";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

const TINT_BG: Record<PathStep["tint"], string> = {
  yellow: "bg-planner-yellow",
  mint: "bg-planner-mint",
  peach: "bg-planner-peach",
  lavender: "bg-planner-lavender",
  pink: "bg-planner-pink",
  sky: "bg-planner-sky",
};

function PathRow({ step, onStart, onSkip }: { step: PathStep; onStart: () => void; onSkip?: () => void }) {
  return (
    <div className="relative pl-[60px] mb-3">
      {/* Checkpoint */}
      <div
        className={cn(
          "absolute left-[22px] top-3 w-[26px] h-[26px] rounded-full flex items-center justify-center",
          step.done ? "bg-success text-white" : "bg-background border-2 border-border",
        )}
      >
        {step.done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : (
          <span className="text-[10px] font-bold text-muted-foreground">○</span>
        )}
      </div>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          "w-full text-left rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform",
          step.done ? "bg-muted opacity-60" : `${TINT_BG[step.tint]} shadow-ios`,
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-background/70 flex items-center justify-center shrink-0">
          <FluentEmoji emoji={step.emoji} size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 truncate">
            {step.kicker}
          </div>
          <div className="text-[14px] font-bold text-foreground leading-tight truncate">{step.title}</div>
          <div className="text-[11px] text-foreground/60 truncate">{step.meta}</div>
        </div>
        {!step.done && step.skippable && onSkip && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSkip(); }}
            className="text-[11px] font-semibold text-foreground/50 px-2 py-1 active:scale-95"
          >
            Skip
          </button>
        )}
      </button>
    </div>
  );
}

function PathHero({ step, onStart, onSkip }: { step: PathStep; onStart: () => void; onSkip?: () => void }) {
  return (
    <div className="relative pl-[60px] mb-5">
      <div className="absolute left-[18px] top-6 w-[34px] h-[34px] rounded-full flex items-center justify-center bg-primary shadow-ios">
        <Play className="w-3.5 h-3.5 text-primary-foreground" fill="currentColor" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-[28px] p-5 relative overflow-hidden shadow-ios", TINT_BG[step.tint])}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3 h-3 text-primary" />
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
            Right now
          </div>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center shrink-0 shadow-ios">
            <FluentEmoji emoji={step.emoji} size={40} />
          </div>
          <div className="flex-1 pt-0.5 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">
              {step.kicker}
            </div>
            <div className="text-[20px] font-bold leading-[1.15] mt-0.5 text-foreground">
              {step.title}
            </div>
            <div className="text-[12px] mt-1 leading-snug text-foreground/70">{step.meta}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-bold bg-primary text-primary-foreground shadow-ios active:scale-[0.98] transition-transform"
        >
          <Play className="w-[16px] h-[16px]" fill="currentColor" />
          Start now{step.estMinutes ? ` · ${step.estMinutes} min` : ""}
        </button>

        {step.skippable && onSkip && (
          <div className="flex items-center justify-center gap-4 mt-2.5">
            <button onClick={onSkip} className="text-[11.5px] font-semibold text-foreground/60">
              Skip
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function RewardRow({ step }: { step: PathStep }) {
  return (
    <div className="relative pl-[60px] mt-4">
      <div className="absolute left-[22px] top-3 w-[26px] h-[26px] rounded-full flex items-center justify-center bg-background border-2 border-dashed border-primary">
        <FluentEmoji emoji="🏆" size={14} />
      </div>
      <div className="rounded-2xl p-3 flex items-center gap-2.5 bg-muted border border-dashed border-primary/30">
        <div className="flex-1 text-[12px] leading-snug text-foreground">
          Finish the path → <strong>{step.title}</strong> 🧡
        </div>
      </div>
    </div>
  );
}

export default function AppMyRiloPath() {
  const navigate = useNavigate();
  const goBack = useGoBack("/app/home");
  const { user } = useAuth();
  const { data, isLoading } = useTodayPath();
  const skip = useSkipPathStep();

  if (!user) return null;

  if (isLoading || !data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">
        Loading your path…
      </div>
    );
  }

  const { steps, summary, streak, isDayOne } = data;
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const nonReward = steps.filter((s) => s.kind !== "reward");
  const reward = steps.find((s) => s.kind === "reward");

  const handleStart = (step: PathStep) => {
    navigate(step.startHref);
  };
  const handleSkip = (step: PathStep) => {
    if (step.kind === "reward") return;
    skip.mutate(step);
  };

  return (
    <>
      <SEOHead title="My Rilo · Path for Today" description="Your dynamic daily path, hand-picked by Rilo." />
      <div className="min-h-[100dvh] bg-background">
        {/* Header */}
        <div className="px-5 pt-4 pb-2 grid grid-cols-[auto_1fr_auto] items-center">
          <button onClick={goBack} className="p-1.5 -ml-1 text-foreground active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center text-[13px] font-bold tracking-tight text-foreground">My Rilo</div>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-ios">
            <Flame className="w-3.5 h-3.5" fill="currentColor" />
            <span className="text-[13px] font-bold">{streak}</span>
          </button>
        </div>

        {/* Hero greeting */}
        <div className="px-5 pt-4 pb-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            {dateLabel}
          </div>
          <div className="text-[28px] font-bold leading-[1.05] mt-1.5 text-foreground">
            {isDayOne ? "Welcome — let's start" : "Your path for today"}
          </div>
          <div className="text-[13px] mt-1.5 text-muted-foreground">
            {summary.total} small steps · ~{summary.totalMinutes} min
            {summary.doneCount > 0 ? ` · ${summary.doneCount} done` : ""}
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {nonReward.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  s.done ? "bg-primary" : "bg-border",
                )}
              />
            ))}
            <span className="text-[11px] font-bold ml-1 text-muted-foreground">
              {summary.doneCount}/{summary.total}
            </span>
          </div>
        </div>

        {/* THE PATH */}
        <div className="px-4 pt-3 pb-6 relative">
          {/* Vertical dotted spine */}
          <div
            className="absolute left-[34px] top-8 bottom-8 w-px opacity-50"
            style={{
              backgroundImage: "linear-gradient(hsl(var(--border)) 50%, transparent 50%)",
              backgroundSize: "1px 6px",
            }}
          />

          {nonReward.map((s, i) => {
            if (i === summary.activeIndex && !s.done) {
              return (
                <PathHero
                  key={s.id}
                  step={s}
                  onStart={() => handleStart(s)}
                  onSkip={s.skippable ? () => handleSkip(s) : undefined}
                />
              );
            }
            return (
              <PathRow
                key={s.id}
                step={s}
                onStart={() => handleStart(s)}
                onSkip={s.skippable ? () => handleSkip(s) : undefined}
              />
            );
          })}

          {reward && <RewardRow step={reward} />}
        </div>

        {/* Talk to Rilo (visual only for Phase 1) */}
        <div className="px-4 pb-8 pt-2">
          <div className="w-full flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 bg-card border border-border shadow-ios">
            <span className="text-[13px] flex-1 text-left py-1.5 text-muted-foreground">
              Ask Rilo to change your path…
            </span>
            <span className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-ios">
              <ArrowUp className="w-[18px] h-[18px]" />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}