import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Flame, Sparkles, Check, ChevronLeft, ChevronRight, Headset, Award } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import {
  useTodayPath,
  useSkipPathStep,
  useSnoozePathStep,
  useSwapPathStep,
  useSkipTomorrowPathStep,
  markStepTapped,
} from "@/hooks/useTodayPath";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useGoBack } from "@/hooks/useGoBack";
import type { PathStep } from "@/lib/pathEngine";
import { SwapSheet } from "@/components/path/SwapSheet";
import { haptic } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import {
  useMyRiloPathTrophies,
  useAwardPathTrophyOnComplete,
} from "@/hooks/useMyRiloPathTrophies";
import { PromoBanner } from "@/components/app/PromoBanner";
import { HomeBanner } from "@/components/app/HomeBanner";
import { HomeMenu } from "@/components/app/HomeMenu";

// ── Orange Palette (mirrors /admin/brand/mock) ──
const O = {
  bg: "#FFF8F3",
  bgWarm: "#FFF4ED",
  card: "#FFFFFF",
  fg: "#2D1A0E",
  fgMuted: "#8B6E5A",
  primary: "#EB5E33",
  primaryL: "#F5A623",
  primaryD: "#D94B2B",
  peach: "#FFE6C9",
  peachMid: "#FFD2A1",
  yellow: "#FFF492",
  yellowMid: "#FFEA4E",
  pink: "#FFE0F5",
  pinkMid: "#FFC2EA",
  lavender: "#F0E3FF",
  lavenderMid: "#DEC1FF",
  mint: "#E2F9F0",
  mintMid: "#C3F1E1",
  skyMid: "#B9D6FF",
  border: "#F5DCC8",
  success: "#22C55E",
};

type Tint = PathStep["tint"];

const TINT_ACCENT: Record<Tint, string> = {
  yellow: O.yellowMid,
  mint: O.mintMid,
  peach: O.peach,
  lavender: O.lavenderMid,
  pink: O.pinkMid,
  sky: O.skyMid,
};

const TINT_KICKER: Record<Tint, string> = {
  yellow: "#A86C1A",
  mint: "#1F7A5A",
  peach: O.primary,
  lavender: "#6B3FA0",
  pink: "#B5377F",
  sky: "#2A5DAA",
};

const TINT_HERO_BG: Record<Tint, string> = {
  yellow: `linear-gradient(160deg, ${O.yellow} 0%, ${O.yellowMid} 100%)`,
  mint: `linear-gradient(160deg, ${O.mint} 0%, ${O.mintMid} 100%)`,
  peach: `linear-gradient(160deg, ${O.peach} 0%, ${O.peachMid} 100%)`,
  lavender: `linear-gradient(160deg, ${O.lavender} 0%, ${O.lavenderMid} 100%)`,
  pink: `linear-gradient(160deg, ${O.pink} 0%, ${O.pinkMid} 100%)`,
  sky: `linear-gradient(160deg, #E0EDFF 0%, ${O.skyMid} 100%)`,
};

function InlinePathRow({
  step, onStart, onSkip,
}: { step: PathStep; onStart: () => void; onSkip?: () => void }) {
  const accent = TINT_ACCENT[step.tint];
  const kickerColor = TINT_KICKER[step.tint];
  return (
    <div className="relative pl-[60px] mb-3">
      {/* Checkpoint dot */}
      <div
        className="absolute left-[22px] top-4 w-[26px] h-[26px] rounded-full flex items-center justify-center"
        style={{
          background: step.done ? "#DCFCE7" : "#FFFFFF",
          border: `2px solid ${step.done ? O.success : O.border}`,
        }}
      >
        {step.done ? (
          <Check className="w-3 h-3" style={{ color: O.success, strokeWidth: 3 }} />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: O.peachMid }} />
        )}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-2xl active:scale-[0.99] transition-transform"
        style={{
          background: O.card,
          border: `1px solid ${O.border}`,
          opacity: step.done ? 0.65 : 1,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accent, overflow: "hidden" }}
        >
          {step.kind === "playlist" && step.coverImageUrl ? (
            <img
              src={step.coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <FluentEmoji emoji={step.emoji} size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: kickerColor }}
          >
            {step.kicker}
          </div>
          <div
            className="text-[13.5px] font-semibold leading-tight mt-0.5 truncate"
            style={{
              color: O.fg,
              textDecoration: step.done ? "line-through" : "none",
            }}
          >
            {step.title}
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: O.fgMuted }}>
            {step.meta}
          </div>
        </div>
        {!step.done && (
          step.skippable && onSkip ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSkip(); }}
              className="text-[11px] font-semibold px-2 py-1 active:scale-95 shrink-0"
              style={{ color: O.fgMuted }}
            >
              Skip
            </button>
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: O.fgMuted }} />
          )
        )}
      </button>
    </div>
  );
}

function PathHero({
  step, onStart, onSkip, onSwap, onSnooze,
}: {
  step: PathStep;
  onStart: () => void;
  onSkip?: () => void;
  onSwap?: () => void;
  onSnooze?: () => void;
}) {
  // Hero card always uses the brand peach/orange treatment, regardless of the
  // step's tint. Only the inline (Later Today) rows keep per-tint colors.
  const kickerColor = O.primary;
  return (
    <div className="relative pl-[60px] mb-5">
      {/* Active checkpoint */}
      <div
        className="absolute left-[18px] top-6 w-[34px] h-[34px] rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
          boxShadow: "0 0 0 5px rgba(235,94,51,0.15), 0 6px 16px rgba(235,94,51,0.4)",
        }}
      >
        <Play className="w-3.5 h-3.5 text-white" fill="#fff" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-5 relative overflow-hidden"
        style={{
          background: TINT_HERO_BG.peach,
          boxShadow: "0 14px 36px rgba(235,94,51,0.22)",
        }}
      >
        {/* halo */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40 pointer-events-none"
          style={{ background: "#fff", filter: "blur(24px)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3" style={{ color: O.primary }} />
            <div
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: O.primary }}
            >
              Rilo picked this for you
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "#fff",
                boxShadow: "0 6px 14px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}
            >
              {step.kind === "playlist" && step.coverImageUrl ? (
                <img
                  src={step.coverImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <FluentEmoji emoji={step.emoji} size={40} />
              )}
            </div>
            <div className="flex-1 pt-0.5 min-w-0">
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: kickerColor }}
              >
                {step.kicker}
              </div>
              <div
                className="text-[20px] font-bold leading-[1.15] mt-0.5"
                style={{ color: O.fg }}
              >
                {step.title}
              </div>
              <div className="text-[12px] mt-1 leading-snug" style={{ color: "#6B4D33" }}>
                {step.meta}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] transition-transform"
            style={{
              background: O.primary,
              color: "#fff",
              boxShadow: "0 8px 18px rgba(235,94,51,0.4)",
            }}
          >
            <Play className="w-[16px] h-[16px]" fill="#fff" />
            Start now{step.estMinutes ? ` · ${step.estMinutes} min` : ""}
          </button>

          {step.skippable && onSkip && (
            <div className="flex items-center justify-center gap-4 mt-2.5">
              <button
                onClick={onSwap}
                className="text-[11.5px] font-semibold active:scale-95"
                style={{ color: "#6B4D33" }}
              >
                Swap →
              </button>
              <div className="w-px h-3" style={{ background: "rgba(0,0,0,0.10)" }} />
              <button
                onClick={onSnooze}
                className="text-[11.5px] font-semibold active:scale-95"
                style={{ color: "#6B4D33" }}
              >
                Snooze later
              </button>
              <div className="w-px h-3" style={{ background: "rgba(0,0,0,0.10)" }} />
              <button
                onClick={onSkip}
                className="text-[11.5px] font-semibold active:scale-95"
                style={{ color: "#6B4D33" }}
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pl-1">
      <div
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </div>
      <div
        className="flex-1 h-px"
        style={{
          background: color === O.primary
            ? `linear-gradient(90deg, ${O.primary}55, transparent)`
            : O.border,
        }}
      />
    </div>
  );
}

function RewardRow({ step }: { step: PathStep }) {
  const done = !!step.done;
  return (
    <div className="relative pl-[60px] mt-4">
      <div
        className="absolute left-[22px] top-3 w-[26px] h-[26px] rounded-full flex items-center justify-center"
        style={
          done
            ? { background: "#DCFCE7", border: `2px solid ${O.success}` }
            : { background: "#fff", border: `2px dashed ${O.primary}` }
        }
      >
        {done ? (
          <Check className="w-3 h-3" style={{ color: O.success, strokeWidth: 3 }} />
        ) : (
          <FluentEmoji emoji="🏆" size={14} />
        )}
      </div>
      <div
        className="rounded-2xl p-3 flex items-center gap-2.5"
        style={{
          background: O.bg,
          border: done ? `1px solid ${O.peachMid}` : `1px dashed ${O.peachMid}`,
          opacity: done ? 0.75 : 1,
        }}
      >
        <div className="flex-1 text-[12px] leading-snug" style={{ color: O.fg }}>
          {done ? (
            <>Path complete · <strong>{step.title}</strong> earned 🏆</>
          ) : (
            <>Finish the path → <strong>{step.title}</strong> 🧡</>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppMyRiloPath() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const goBack = useGoBack("/app/home");
  const { user } = useAuth();
  const { data, isLoading } = useTodayPath();
  const skip = useSkipPathStep();
  const snooze = useSnoozePathStep();
  const swap = useSwapPathStep();
  const skipTomorrow = useSkipTomorrowPathStep();

  const [swapTarget, setSwapTarget] = useState<PathStep | null>(null);
  const { data: trophyCount = 0 } = useMyRiloPathTrophies();

  const isPathComplete = !!data
    && data.summary.total > 0
    && data.summary.doneCount >= data.summary.total;
  useAwardPathTrophyOnComplete(isPathComplete);

  if (!user) return null;

  if (isLoading || !data) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center text-sm"
        style={{ background: O.bg, color: O.fgMuted }}
      >
        Loading your path…
      </div>
    );
  }

  const { steps, summary, streak, isDayOne } = data;
  const today = new Date();
  const weekday = today.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = today.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const dateLabel = `${weekday} · ${monthDay}`;

  const nonReward = steps.filter((s) => s.kind !== "reward");
  const reward = steps.find((s) => s.kind === "reward");

  const handleStart = (step: PathStep) => {
    // Tap = done (mirrors pro-link shortcut behaviour). Steps that already
    // have a real DB completion signal (audio progress, breath session,
    // reflection, task completion) will continue to use those — this just
    // covers steps like the "Open your planner" routine card where the
    // user's tap IS the completion intent.
    markStepTapped(step.id);
    qc.invalidateQueries({ queryKey: ["today-path"] });
    navigate(step.startHref, { state: { from: "/app/my-rilo" } });
  };
  const handleSkip = (step: PathStep) => {
    if (step.kind === "reward") return;
    haptic.light();
    skip.mutate(step);
    // Offer skip-tomorrow follow-up
    toast({
      title: "Skipped for today",
      description: "Tap to also skip tomorrow.",
      action: (
        <button
          onClick={() => {
            haptic.medium();
            skipTomorrow.mutate(step);
          }}
          className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "#EB5E33", color: "#fff" }}
        >
          Skip tomorrow too
        </button>
      ),
    });
  };

  const handleSnooze = (step: PathStep) => {
    haptic.light();
    snooze.mutate({ step });
    toast({ title: "Snoozed", description: "Moved to the end of today's path." });
  };

  const handlePickSwap = (target: PathStep) => {
    if (!swapTarget) return;
    haptic.medium();
    swap.mutate({ step: swapTarget, target });
    setSwapTarget(null);
    toast({ title: "Swapped", description: `Showing "${target.title}" instead.` });
  };

  const routinesWoven = nonReward.filter((s) => s.kind === "routine").length;

  // Group into Done / Right now / Later
  const doneSteps = nonReward.filter((s) => s.done);
  const activeStep = nonReward.find((s, i) => !s.done && i === summary.activeIndex);
  const laterSteps = nonReward.filter((s) => !s.done && s !== activeStep);

  return (
    <>
      <SEOHead title="My Rilo · Path for Today" description="Your dynamic daily path, hand-picked by Rilo." />
      <div
        className="h-full min-h-0 flex flex-col relative overflow-hidden w-full max-w-full"
        style={{
          background: `linear-gradient(180deg, ${O.bgWarm} 0%, #FFFFFF 50%, ${O.bgWarm} 100%)`,
          color: O.fg,
        }}
      >
        {/* Soft warm halo behind hero greeting */}
        <div
          className="absolute top-12 -right-16 w-56 h-56 rounded-full opacity-50 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${O.peachMid} 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />

        {/* Header */}
        <div
          className="shrink-0 z-30 px-5 pb-3 grid grid-cols-[auto_1fr_auto] items-center backdrop-blur-xl"
          style={{
            background: "rgba(255,248,243,0.78)",
            boxShadow: "0 1px 0 rgba(245,220,200,0.5)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          }}
        >
          <div className="flex items-center gap-1 -ml-1" style={{ color: O.fg }}>
            <HomeMenu />
            <button
              onClick={() => {
                haptic.light();
                navigate('/app/chat');
              }}
              className="p-2 -ml-1 active:scale-95 transition-transform"
              style={{ color: O.fg }}
              aria-label="Support"
            >
              <Headset className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center text-[15px] font-bold tracking-tight" style={{ color: O.fg }}>
            My Rilo
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              navigate("/app/presence");
            }}
            className="flex items-center p-0.5 rounded-full active:scale-95 transition-transform"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${O.border}`,
              boxShadow: "0 2px 8px rgba(235,94,51,0.18)",
            }}
            aria-label={`Trophies: ${trophyCount} · Streak: ${streak} days · open Presence`}
          >
            <span
              className="flex items-center gap-1 pl-2 pr-2.5 py-0.5"
              style={{ color: O.primary }}
            >
              <Award className="w-4 h-4" strokeWidth={2.25} />
              <span className="text-[13px] font-bold" style={{ color: O.fg }}>
                {trophyCount}
              </span>
            </span>
            <span
              className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                color: "#fff",
                boxShadow: "0 2px 8px rgba(235,94,51,0.35)",
              }}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-[13px] font-bold">{streak}</span>
            </span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Top banners (admin-curated) — under header, above date */}
          <div className="px-4 pt-2">
            <PromoBanner location="my_rilo_top" className="py-1" />
            <HomeBanner location="my_rilo_top" className="py-1" />
          </div>

          {/* Hero greeting */}
          <div className="px-5 pt-4 pb-3 relative z-10">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ color: O.primary }}
            >
              {dateLabel}
            </div>
            <div
              className="text-[28px] font-bold leading-[1.05] mt-1.5"
              style={{ color: O.fg }}
            >
              {isDayOne ? "Let's build your path together" : "Your path for today"}
            </div>
            <div className="text-[13px] mt-1.5" style={{ color: O.fgMuted }}>
              {summary.total} small steps · ~{summary.totalMinutes} min
              {routinesWoven > 0 ? ` · ${routinesWoven} of your routines woven in` : ""}
            </div>

            {/* Progress segments */}
            <div className="flex items-center gap-1.5 mt-3">
              {nonReward.map((s) => (
                <div
                  key={s.id}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: s.done ? O.primary : O.border }}
                />
              ))}
              <span
                className="text-[11px] font-bold ml-1"
                style={{ color: O.fgMuted }}
              >
                {summary.doneCount}/{summary.total}
              </span>
            </div>
          </div>

          {/* THE PATH */}
          <div className="px-4 pt-3 pb-4 relative">
            {/* Vertical dotted spine */}
            <div
              className="absolute left-[34px] top-8 bottom-8 w-px"
              style={{
                backgroundImage: `linear-gradient(${O.peachMid} 50%, transparent 50%)`,
                backgroundSize: "1px 6px",
              }}
            />

            {/* Done section */}
            {doneSteps.length > 0 && (
              <>
                <SectionDivider label={`☀️ Morning · done`} color={O.fgMuted} />
                {doneSteps.map((s) => (
                  <InlinePathRow
                    key={s.id}
                    step={s}
                    onStart={() => handleStart(s)}
                  />
                ))}
              </>
            )}

            {/* Right now */}
            {activeStep && (
              <>
                <div className={doneSteps.length > 0 ? "mt-5" : ""}>
                  <SectionDivider label="✨ Right now" color={O.primary} />
                </div>
                <PathHero
                  step={activeStep}
                  onStart={() => handleStart(activeStep)}
                  onSkip={activeStep.skippable ? () => handleSkip(activeStep) : undefined}
                  onSwap={activeStep.skippable ? () => setSwapTarget(activeStep) : undefined}
                  onSnooze={activeStep.skippable ? () => handleSnooze(activeStep) : undefined}
                />
              </>
            )}

            {/* Later */}
            {laterSteps.length > 0 && (
              <>
                <SectionDivider label="🌙 Later today" color={O.fgMuted} />
                {laterSteps.map((s) => (
                  <InlinePathRow
                    key={s.id}
                    step={s}
                    onStart={() => handleStart(s)}
                    onSkip={s.skippable ? () => handleSkip(s) : undefined}
                  />
                ))}
              </>
            )}

            {reward && <RewardRow step={reward} />}
          </div>

          {/* Bottom banners (admin-curated) — after the path */}
          <div className="px-4 pb-2">
            <PromoBanner location="my_rilo_bottom" className="py-2" />
            <HomeBanner location="my_rilo_bottom" className="py-2" />
          </div>

          <div className="pb-8" />
        </div>
      </div>

      <SwapSheet
        open={!!swapTarget}
        onOpenChange={(v) => !v && setSwapTarget(null)}
        current={swapTarget}
        candidates={swapTarget && data ? data.candidatesFor(swapTarget) : []}
        onPick={handlePickSwap}
      />
    </>
  );
}