import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { playCompletionSound } from '@/lib/completionSound';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

import { BreathingInfoSheet } from '@/components/breathe/BreathingInfoSheet';
import { ImmersiveBreathingCircle, ImmersiveParticles, getImmersiveBgGradient } from '@/components/breathe/ImmersiveBreathingCircle';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { WeekReportStep } from '@/components/app/weekly-review/WeekReportStep';
import { SatisfactionSliderStep } from '@/components/app/weekly-review/SatisfactionSliderStep';
import { WeekTaskSuggestionsStep } from '@/components/app/weekly-review/WeekTaskSuggestionsStep';
import { WeekCelebrationStep } from '@/components/app/weekly-review/WeekCelebrationStep';
import { WeekCleanupStep } from '@/components/app/weekly-review/WeekCleanupStep';
import { SelfCareDiagnosisStep } from '@/components/app/selfcare-quiz/SelfCareDiagnosisStep';
import { SelfCareSuggestionsStep } from '@/components/app/selfcare-quiz/SelfCareSuggestionsStep';
import { SelfCareYourWhyStep } from '@/components/app/selfcare-quiz/SelfCareYourWhyStep';
import { SelfCareCommitmentStep } from '@/components/app/selfcare-quiz/SelfCareCommitmentStep';
import { SelfCareReflectionStep } from '@/components/app/selfcare-quiz/SelfCareReflectionStep';
import { SelfCareRiloCelebrationStep } from '@/components/app/selfcare-quiz/SelfCareRiloCelebrationStep';
import { SelfCarePlusIntroStep } from '@/components/app/selfcare-quiz/SelfCarePlusIntroStep';
import { SelfCarePushPermissionStep } from '@/components/app/selfcare-quiz/SelfCarePushPermissionStep';
import { SelfCareQuizScreen } from '@/components/app/selfcare-quiz/SelfCareQuizScreen';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { computeTopCluster } from '@/utils/selfcare-scoring';
import { RiloTeachScreen } from '@/components/admin/onboarding/RiloTeachScreen';
import { RiloPickTasksScreen } from '@/components/admin/onboarding/RiloPickTasksScreen';
import { RiloWeekPlansScreen } from '@/components/admin/onboarding/RiloWeekPlansScreen';
import { RiloBuildingPlanScreen } from '@/components/admin/onboarding/RiloBuildingPlanScreen';
import { RiloCommitScreen } from '@/components/admin/onboarding/RiloCommitScreen';
import {
  DoorCardsGlassScreen,
  DoorEmotionPickerScreen,
  DoorSelfcareOffersScreen,
  DoorImmigrantPickerScreen,
  MeetRiloIntroScreen,
  OpenTheDoorScreen,
  DoorNicknameScreen,
  DoorLanguageSwitchScreen,
} from '@/components/admin/onboarding/RiloDoorsScreens';

function OptionEmoji({ emoji, size }: { emoji: string; size: number }) {
  if (emoji === 'flag:persian') return <PersianFlag size={size} />;
  return <FluentEmoji emoji={emoji} size={size} />;
}
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';
import selfcareQuizHero from '@/assets/selfcare-quiz-hero.png';
import appIcon from '@/assets/app-icon.png';
import SealCheck from '@/components/app/SealCheck';
import meplusPaywall2 from '@/assets/meplus-paywall-2.png';
import meplusPaywall3 from '@/assets/meplus-paywall-3.png';
import meplusCommunityFooter from '@/assets/onboarding/meplus-community-footer.png';
import meplusPlanMascot from '@/assets/onboarding/meplus-plan-mascot.png';
import beforeAfterComparison from '@/assets/onboarding/before-after-comparison.png';
import { TaskCard } from '@/components/app/TaskCard';
import { format } from 'date-fns';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onMilestone?: (type: 'review' | 'notification' | 'discount-paywall') => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

export function OnboardingStepRenderer({ step, onNext, onMilestone, onAnswer, answers }: Props) {
  // Self-Care Quiz steps get bespoke "What is Rilo?"-style screens.
  if (step.id?.startsWith('sc-')) {
    const el = SelfCareQuizScreen({ step, onNext, onAnswer, answers });
    if (el) return el;
  }
  switch (step.type) {
    case 'welcome':
      return <WelcomeScreen step={step} onNext={onNext} />;
    case 'rilo-teach':
      return <RiloTeachScreen step={step} onNext={onNext} />;
    case 'rilo-pick-tasks':
      return <RiloPickTasksScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'rilo-week-plans':
      return <RiloWeekPlansScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'rilo-building-plan':
      return <RiloBuildingPlanScreen step={step} onNext={onNext} answers={answers} />;
    case 'rilo-commit':
      return <RiloCommitScreen step={step} onNext={onNext} />;
    case 'rilo-language-bubbles':
      return <RiloLanguageBubblesScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'door-nickname':
      return <DoorNicknameScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'door-language-switch':
      return <DoorLanguageSwitchScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'door-cards-glass':
      return <DoorCardsGlassScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'door-emotion-picker':
      return <DoorEmotionPickerScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'door-selfcare-offers':
      return <DoorSelfcareOffersScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'door-immigrant-picker':
      return <DoorImmigrantPickerScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'meet-rilo-intro':
      return <MeetRiloIntroScreen step={step} onNext={onNext} />;
    case 'open-the-door':
      return <OpenTheDoorScreen step={step} onNext={onNext} answers={answers} />;
    case 'greeting':
      return <GreetingScreen step={step} onNext={onNext} />;
    case 'multi-select':
      return <MultiSelectScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'single-select':
      return <SingleSelectScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'single-select-descriptions':
      return <SingleSelectDescScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'yes-no':
      return <YesNoScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'do-you-want':
      return <DoYouWantScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'info-stat':
      return <InfoStatScreen step={step} onNext={onNext} />;
    case 'motivational':
      return <MotivationalScreen step={step} onNext={onNext} />;
    case 'notification-permission':
      return <NotificationScreen step={step} onNext={onNext} onMilestone={onMilestone} />;
    case 'results-chart':
      return <ResultsChartScreen step={step} onNext={onNext} />;
    case 'habit-loop':
      return <HabitLoopScreen step={step} onNext={onNext} />;
    case 'loading-testimonials':
      return <LoadingTestimonialsScreen step={step} onNext={onNext} />;
    case 'personal-summary':
      return <PersonalSummaryScreen step={step} onNext={onNext} answers={answers} />;
    case 'first-habit':
      return <FirstHabitScreen step={step} onNext={onNext} />;
    case 'breathing-prep':
      return <BreathingPrepScreen step={step} onNext={onNext} />;
    case 'breathing':
      return <BreathingScreen step={step} onNext={onNext} />;
    case 'breathing-done':
      return <BreathingDoneScreen step={step} onNext={onNext} />;
    case 'streak':
      return <StreakScreen step={step} onNext={onNext} />;
    case 'paywall':
      return <PaywallScreen step={step} onNext={onNext} />;
    case 'before-after':
      return <BeforeAfterScreen step={step} onNext={onNext} />;
    case 'science-backed':
      return <ScienceBackedScreen step={step} onNext={onNext} />;
    case 'rating':
      return <RatingScreen step={step} onNext={onNext} onMilestone={onMilestone} />;
    case 'discount-offer':
      return <DiscountOfferScreen step={step} onNext={onNext} />;
    case 'welcome-aboard':
      return <WelcomeAboardScreen step={step} onNext={onNext} />;
    case 'contract':
      return <ContractScreen step={step} onNext={onNext} />;
    case 'distress-grid':
      return <DistressGridScreen step={step} onNext={onNext} />;
    case 'adhd-info':
      return <ADHDInfoScreen step={step} onNext={onNext} />;
    case 'lucky-draw':
      return <LuckyDrawScreen step={step} onNext={onNext} />;
    case 'super-prize':
      return <SuperPrizeScreen step={step} onNext={onNext} />;
    case 'countdown-paywall':
      return <CountdownPaywallScreen step={step} onNext={onNext} />;
    case 'dark-paywall':
      return <DarkPaywallScreen step={step} onNext={onNext} />;
    case 'task-select-purple':
      return <TaskSelectPurpleScreen step={step} onNext={onNext} />;
    case 'confetti-message':
      return <ConfettiMessageScreen step={step} onNext={onNext} />;
    case 'starter-routine':
      return <StarterRoutineScreen step={step} onNext={onNext} />;
    case 'daily-reset-prompt':
      return <DailyResetPromptScreen step={step} onNext={onNext} />;
    case 'personalized-plan':
      return <PersonalizedPlanScreen step={step} onNext={onNext} answers={answers} />;
    case 'before-after-visual':
      return <BeforeAfterVisualScreen step={step} onNext={onNext} />;
    case 'text-input':
      return <TextInputScreen step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'routine-ready-teaser':
      return <RoutineReadyTeaserScreen step={step} onNext={onNext} />;
    case 'week-report':
      return <WeekReportStep step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'week-cleanup':
      return <WeekCleanupStep step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'satisfaction-slider':
      return <SatisfactionSliderStep step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'week-task-suggestions':
      return <WeekTaskSuggestionsStep step={step} onNext={onNext} answers={answers} />;
    case 'week-celebration':
      return <WeekCelebrationStep step={step} onNext={onNext} answers={answers} />;
    case 'selfcare-diagnosis':
      return <SelfCareDiagnosisStep step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'selfcare-suggestions':
      return <SelfCareSuggestionsStep step={step} onNext={onNext} answers={answers} onAnswer={onAnswer} />;
    case 'dynamic-single-select':
      return <DynamicSingleSelectScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'selfcare-your-why':
      return <SelfCareYourWhyStep step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'selfcare-commitment':
      return <SelfCareCommitmentStep step={step} onNext={onNext} onAnswer={onAnswer} />;
    case 'selfcare-reflection':
      return <SelfCareReflectionStep step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'selfcare-rilo-celebration':
      return <SelfCareRiloCelebrationStep step={step} onNext={onNext} answers={answers} />;
    case 'selfcare-plus-intro':
      return (
        <SelfCarePlusIntroStep
          step={step}
          onAccept={() => {
            onAnswer?.(step.id, 'accepted');
            try { localStorage.setItem('simora_selfcare_plus_choice', 'accepted'); } catch {}
            onNext();
          }}
          onDecline={() => {
            onAnswer?.(step.id, 'declined');
            try { localStorage.setItem('simora_selfcare_plus_choice', 'declined'); } catch {}
            onNext();
          }}
        />
      );
    case 'selfcare-push-permission':
      return <SelfCarePushPermissionStep step={step} onNext={onNext} />;
    default:
      return <div className="flex items-center justify-center h-full text-sm text-gray-400">Unknown: {step.type}</div>;
  }
}

// ─── Shared ────────────────────────────────────────────────────

function NavyButton({ children, className = '', onClick, disabled }: { children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-3 text-sm text-gray-500 font-medium active:opacity-60">
      {children}
    </button>
  );
}

function IllustrationPlaceholder({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs text-indigo-400 font-medium text-center p-4 ${className}`}>
      {label}
    </div>
  );
}

function ScreenWrapper({ children, bg = 'bg-white', center = false }: { children: React.ReactNode; bg?: string; center?: boolean }) {
  return (
    <div className={`h-full ${bg} overflow-y-auto overscroll-contain`}>
      <div className={`flex flex-col min-h-full px-5 pt-4 pb-6 ${center ? 'justify-center' : ''}`} style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Animation Wrappers ────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({ children, className = '', staggerDelay = 0.06 }: { children: React.ReactNode; className?: string; staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Screens ───────────────────────────────────────────────────

function WelcomeScreen({ step, onNext }: Props) {
  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-b from-purple-400 via-purple-300 to-purple-100">
      {/* Mascot image — top area, centered on mouth */}
      {step.image && (
        <div className="absolute inset-x-0 top-0 h-[58%]">
          <img src={step.image} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 45%' }} />
        </div>
      )}

      {/* Bottom sheet with rounded top */}
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-white rounded-t-[28px] flex flex-col items-center px-6 pb-5 pt-7 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
        {/* Sparkles scattered in the white space */}
        <div className="absolute top-6 left-8 text-amber-300/60 animate-pulse" style={{ animationDelay: '0s', animationDuration: '2.5s' }}>✦</div>
        <div className="absolute top-10 right-12 text-purple-300/50 animate-pulse text-xs" style={{ animationDelay: '0.8s', animationDuration: '3s' }}>✦</div>
        <div className="absolute top-16 left-[45%] text-amber-200/40 animate-pulse text-[10px]" style={{ animationDelay: '1.5s', animationDuration: '2.8s' }}>✧</div>
        <div className="absolute top-8 right-[30%] text-purple-200/50 animate-pulse text-[8px]" style={{ animationDelay: '0.4s', animationDuration: '3.2s' }}>✦</div>
        <div className="absolute top-20 left-16 text-amber-300/30 animate-pulse text-[11px]" style={{ animationDelay: '2s', animationDuration: '2.6s' }}>✧</div>

        {/* Floating feathers */}
        <div className="absolute top-4 right-[22%] animate-[floatFeather1_4s_ease-in-out_infinite] text-amber-300/50 text-sm" style={{ transform: 'rotate(25deg)' }}>🪶</div>
        <div className="absolute top-12 left-[20%] animate-[floatFeather2_5s_ease-in-out_infinite] text-amber-200/40 text-xs" style={{ animationDelay: '1.2s', transform: 'rotate(-15deg)' }}>🪶</div>
        <div className="absolute top-5 left-[60%] animate-[floatFeather3_4.5s_ease-in-out_infinite] text-amber-300/35 text-[10px]" style={{ animationDelay: '2.5s', transform: 'rotate(40deg)' }}>🪶</div>

        
        <FadeUp delay={0.1} className="relative z-10">
          <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: (step.title || '').replace('PLUS', '<span class="text-red-500 font-black">PLUS</span>') }} />
        </FadeUp>
        {step.statHighlight && (
          <FadeUp delay={0.2} className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={appIcon} alt="Rilo" className="w-14 h-14 rounded-2xl shadow-lg" />
              <p className="text-[15px] text-[#1a1f3d] font-medium leading-snug"
                 dangerouslySetInnerHTML={{ __html: (step.statHighlight || '').replace(/\*\*(.*?)\*\*/g, '<span class="font-extrabold text-orange-500">$1</span>').replace('\n', '<br />') }}
              />
            </div>
          </FadeUp>
        )}
        <FadeUp delay={0.3} className="relative z-10">
          <p className="text-[17px] font-semibold text-[#1a1f3d] text-center mb-4 leading-relaxed max-w-[260px] whitespace-pre-line">{step.subtitle}</p>
        </FadeUp>
        <FadeUp delay={0.4} className="mt-3 w-full relative z-10">
          {step.description && (
            <div className="mb-3 w-full rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/60 px-5 py-4 relative overflow-hidden">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-2xl">🎁</div>
              <p className="text-center text-[16px] text-[#1a1f3d] font-bold whitespace-pre-line leading-snug mt-3">{step.description}</p>
            </div>
          )}
          <div className="relative">
            <div className="absolute -top-3 right-3 z-10 bg-amber-100 text-[#1a1f3d] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm border border-amber-300 whitespace-nowrap animate-bounce" style={{ animationDuration: '2s' }}>
              ⚡ Takes only 2 minutes!
            </div>
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {step.buttonLabel}
              <span className="text-base">→</span>
            </button>
          </div>
          {step.secondaryButtonLabel && (
            <div className="bg-[#f5f5f0] rounded-2xl px-5 py-3 mt-3 text-center">
              <p className="text-base text-[#1a1f3d]/60">
                Already a member?{' '}
                <Link to="/auth?mode=signin&skip_onboarding=true" className="text-[#4CAF50] font-semibold hover:underline">
                  Sign in.
                </Link>
              </p>
            </div>
          )}
        </FadeUp>
      </div>
    </div>
  );
}

function GreetingScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <FadeUp><IllustrationPlaceholder label={step.illustrationLabel || 'Mascot'} className="h-56 mb-8" /></FadeUp>
      <FadeUp delay={0.1}><h1 className="text-2xl font-bold text-[#1a1f3d] text-center">{step.title}</h1></FadeUp>
      <FadeUp delay={0.15}><p className="text-base text-gray-500 text-center mt-2 mb-8">{step.subtitle}</p></FadeUp>
      <FadeUp delay={0.25} className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </FadeUp>
    </ScreenWrapper>
  );
}

function MultiSelectScreen({ step, onNext, onAnswer }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const isWeeklyFocus = step.illustrationLabel === 'weekly-review-focus';
  const isWeeklyFeltGood = step.illustrationLabel === 'weekly-review';
  const maxSelections = isWeeklyFocus ? 3 : Infinity;

  // Popular options indices for "Most picked" badge
  const popularIndices = isWeeklyFeltGood ? [0, 4, 5] : isWeeklyFocus ? [0, 2, 7] : [];

  // Group options by category for weekly-review felt-good
  const categoryLabels: Record<string, string> = {
    mind: '🧠 Mind',
    body: '💪 Body',
    social: '💕 Social',
    productivity: '⚡ Productivity',
  };

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        if (next.size >= maxSelections) return prev;
        next.add(i);
      }
      const labels = Array.from(next).map(idx => step.options?.[idx]?.label || '');
      onAnswer?.(step.id, labels);
      return next;
    });
  };

  const surpriseMe = () => {
    if (!step.options) return;
    const indices = Array.from({ length: step.options.length }, (_, i) => i);
    const shuffled = indices.sort(() => Math.random() - 0.5).slice(0, Math.min(maxSelections, 3));
    const next = new Set(shuffled);
    setSelected(next);
    const labels = Array.from(next).map(idx => step.options?.[idx]?.label || '');
    onAnswer?.(step.id, labels);
  };

  const hasBg = !!step.illustrationLabel;
  const usePills = hasBg && !step.options?.some(o => o.emoji);

  // Group options by category if descriptions are used as categories
  const hasCategories = isWeeklyFeltGood && step.options?.some(o => o.description);

  const renderChip = (opt: { label: string; emoji?: string; description?: string }, i: number) => {
    return (
      <button
        key={i}
        onClick={() => toggle(i)}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full border text-left transition-all active:scale-[0.96] ${
          selected.has(i)
            ? 'border-primary bg-primary/10 shadow-sm'
            : selected.size >= maxSelections
              ? 'border-border bg-muted opacity-50'
              : 'border-border bg-card'
        }`}
      >
        {opt.emoji && <OptionEmoji emoji={opt.emoji} size={18} />}
        <span className="text-xs font-medium text-foreground whitespace-nowrap">{opt.label}</span>
        {selected.has(i) && <SealCheck showParticles className="w-4 h-4 text-primary animate-seal-pop" />}
      </button>
    );
  };

  if (hasBg) {
    return (
      <BottomSheetWrapper bgImage={step.image || meplusMascotBg}>
        <FadeUp>
          <div className="min-h-[3em] flex flex-col items-center justify-center mb-3">
            <h1 className="text-xl font-extrabold text-foreground text-center leading-snug whitespace-pre-line">{step.title}</h1>
            {step.subtitle && <p className="text-sm text-muted-foreground mt-1 text-center">{step.subtitle}</p>}
          </div>
          {isWeeklyFocus && (
            <p className="text-xs text-muted-foreground text-center mb-3">Pick up to 3 — focus works best with fewer goals</p>
          )}
        </FadeUp>

        {usePills ? (
          <FadeUp delay={0.1}>
            <div className="flex flex-wrap gap-2 mb-4">
              {step.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all active:scale-[0.96] ${
                    selected.has(i)
                      ? 'bg-primary/15 text-primary ring-2 ring-primary'
                      : selected.size >= maxSelections
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FadeUp>
        ) : (
          <FadeUp delay={0.1}>
            <div className={(step.options?.length || 0) > 6 ? "grid grid-cols-2 gap-2 mb-4" : "space-y-2 mb-4"}>
              {step.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`w-full flex items-center gap-2 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    selected.has(i) ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {opt.emoji && <OptionEmoji emoji={opt.emoji} size={(step.options?.length || 0) > 6 ? 20 : 24} />}
                  <span className={`font-medium text-[#1a1f3d] flex-1 ${(step.options?.length || 0) > 6 ? 'text-xs leading-tight' : 'text-sm'}`}>{opt.label}</span>
                  {selected.has(i) && <SealCheck showParticles className={`${(step.options?.length || 0) > 6 ? 'w-5 h-5' : 'w-6 h-6'} text-purple-500 animate-seal-pop`} />}
                </button>
              ))}
            </div>
          </FadeUp>
        )}

        {isWeeklyFocus && (
          <FadeUp delay={0.15}>
            <button
              onClick={surpriseMe}
              className="w-full mb-4 py-2.5 text-sm font-semibold text-purple-500 active:opacity-60 transition-all"
            >
              🎲 Surprise me!
            </button>
          </FadeUp>
        )}

        <FadeUp delay={0.3} className="mt-auto">
          <NavyButton onClick={onNext} disabled={selected.size === 0}>{step.buttonLabel || 'Continue'}</NavyButton>
        </FadeUp>
      </BottomSheetWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FadeUp><h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1></FadeUp>
      <FadeUp delay={0.1}>
        <div className="flex flex-wrap gap-2 mb-6">
          {step.options?.map((opt, i) => renderChip(opt, i))}
        </div>
      </FadeUp>
      <FadeUp delay={0.3} className="mt-auto">
        <NavyButton onClick={onNext} disabled={selected.size === 0}>{step.buttonLabel}</NavyButton>
      </FadeUp>
    </ScreenWrapper>
  );
}

function BottomSheetWrapper({ children, bgImage, headerHeight = 200 }: { children: React.ReactNode; bgImage?: string; headerHeight?: number }) {
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background image area */}
      <div className="shrink-0 relative" style={{ height: headerHeight }}>
        {bgImage ? (
          <img src={bgImage} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-purple-400 to-purple-300" />
        )}
      </div>
      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-y-auto overscroll-contain">
        <div className="px-5 pt-5 flex flex-col flex-1 min-h-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SingleSelectScreen({ step, onNext, onAnswer }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const select = (i: number) => {
    setPicked(i);
    const label = step.options?.[i]?.label || '';
    onAnswer?.(step.id, label);
    setTimeout(onNext, 400);
  };

  // Check if this step has an illustrationLabel (Me+ style with background)
  const hasBg = !!step.illustrationLabel;

  if (hasBg) {
    const useGrid = !step.singleColumn && (step.options?.length || 0) > 4;
    return (
      <BottomSheetWrapper bgImage={step.image || meplusMascotBg}>
        <FadeUp>
          <div className="min-h-[4.5em] flex flex-col items-center justify-center mb-5">
            <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center leading-snug">{step.title}</h1>
            {step.subtitle && <p className="text-base text-[#1a1f3d] mt-1 text-center">{step.subtitle}</p>}
          </div>
        </FadeUp>
        <StaggerContainer className={useGrid ? "grid grid-cols-2 gap-2" : "space-y-3"}>
          {step.options?.map((opt, i) => (
            <StaggerItem key={i}>
              <button
                onClick={() => select(i)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  picked === i ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
                }`}
              >
                {opt.emoji && <OptionEmoji emoji={opt.emoji} size={28} />}
                <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
                {picked === i && <SealCheck showParticles className="w-7 h-7 text-purple-500 animate-seal-pop" />}
              </button>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <FadeUp delay={0.3}>
          <button
            onClick={onNext}
            className="w-full text-center text-sm text-gray-400 mt-4 py-2 active:opacity-60"
          >
            Skip this question
          </button>
        </FadeUp>
      </BottomSheetWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FadeUp>
        {step.subtitle ? (
          <>
            <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
            <p className="text-base text-gray-500 mb-5">{step.subtitle}</p>
          </>
        ) : (
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
        )}
      </FadeUp>
      <StaggerContainer className="space-y-3">
        {step.options?.map((opt, i) => (
          <StaggerItem key={i}>
            <button
              onClick={() => select(i)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                picked === i ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
              }`}
            >
              {opt.emoji && <OptionEmoji emoji={opt.emoji} size={24} />}
              <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
              {picked === i && <SealCheck showParticles className="w-7 h-7 text-purple-500 animate-seal-pop" />}
            </button>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </ScreenWrapper>
  );
}

function TextInputScreen({ step, onNext, onAnswer }: Props) {
  const [value, setValue] = useState('');
  const hasBg = !!step.illustrationLabel;

  const handleSubmit = () => {
    if (!value.trim()) return;
    onAnswer?.(step.id, value.trim());
    onNext();
  };

  const content = (
    <>
      <FadeUp>
        <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
        {step.subtitle && <p className="text-base text-[#1a1f3d] text-center mb-6">{step.subtitle}</p>}
      </FadeUp>
      <FadeUp delay={0.15}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Nickname *"
          enterKeyHint="done"
          className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f5] text-[#1a1f3d] text-base placeholder:text-gray-400 outline-none border border-transparent focus:border-gray-300 transition-all"
          autoFocus
        />
      </FadeUp>
      <div className="mt-auto pt-8 space-y-2 pb-1">
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-base transition-all disabled:opacity-40"
        >
          {step.buttonLabel || 'Continue'}
        </button>
        <button
          onClick={onNext}
          className="w-full text-center text-sm text-gray-400 py-2 active:opacity-60"
        >
          Skip this question
        </button>
      </div>
    </>
  );

  if (hasBg) {
    return <BottomSheetWrapper bgImage={step.image || meplusMascotBg}>{content}</BottomSheetWrapper>;
  }

  return <ScreenWrapper>{content}</ScreenWrapper>;
}

function SingleSelectDescScreen({ step, onNext, onAnswer }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const select = (i: number) => {
    setPicked(i);
    onAnswer?.(step.id, step.options?.[i]?.label || '');
    setTimeout(onNext, 400);
  };

  return (
    <ScreenWrapper>
      <FadeUp><h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1></FadeUp>
      <StaggerContainer className="space-y-3">
        {step.options?.map((opt, i) => (
          <StaggerItem key={i}>
            <button
              onClick={() => select(i)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                picked === i ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-sm font-semibold text-[#1a1f3d]">{opt.label}</span>
              {opt.description && <p className="text-xs text-gray-400 mt-1">{opt.description}</p>}
            </button>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </ScreenWrapper>
  );
}

function YesNoScreen({ step, onNext, onAnswer }: Props) {
  const handleAnswer = (val: string) => {
    onAnswer?.(step.id, val);
    onNext();
  };
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-5 pt-4 flex flex-col items-center">
        <FadeUp><h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-4 leading-tight">{step.title}</h1></FadeUp>
        <FadeUp delay={0.1} className="flex-1 min-h-0 w-full flex items-center justify-center">
          {step.image ? (
            <img src={step.image} alt="" className="w-full max-h-full object-contain rounded-2xl" />
          ) : (
            <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="w-full h-48" />
          )}
        </FadeUp>
      </div>
      <FadeUp delay={0.2} className="shrink-0 flex gap-3 px-5 py-4">
        <NavyButton onClick={() => handleAnswer('No')} className="flex-1 !py-4 !text-base">No</NavyButton>
        <NavyButton onClick={() => handleAnswer('Yes')} className="flex-1 !py-4 !text-base">Yes</NavyButton>
      </FadeUp>
    </div>
  );
}

function DoYouWantScreen({ step, onNext, onAnswer }: Props) {
  const handleChoice = (val: string) => {
    onAnswer?.(step.id, val);
    onNext();
  };
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-5 pt-4 flex flex-col items-center">
        <FadeUp><h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1></FadeUp>
        <FadeUp delay={0.1} className="flex-1 min-h-0 w-full flex items-center justify-center">
          {step.image ? (
            <img src={step.image} alt="" className="w-full max-h-full object-contain rounded-2xl" />
          ) : (
            <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="w-full h-48" />
          )}
        </FadeUp>
      </div>
      <FadeUp delay={0.2} className="shrink-0 flex gap-3 px-5 py-4">
        <button onClick={() => handleChoice('No')} className="flex-1 py-4 rounded-full border border-gray-300 text-base font-medium text-[#1a1f3d] active:scale-[0.98] transition-all">
          {step.secondaryButtonLabel}
        </button>
        <button onClick={() => handleChoice('Yes')} className="flex-1 py-4 rounded-full bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all">
          {step.buttonLabel}
        </button>
      </FadeUp>
    </div>
  );
}

function InfoStatScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <FadeUp><IllustrationPlaceholder label={step.illustrationLabel || 'Statistic'} className="h-36 mb-6" /></FadeUp>
      <FadeUp delay={0.1}><h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-3">{step.statHighlight}</h1></FadeUp>
      <FadeUp delay={0.15}><p className="text-sm text-gray-500 mb-8 leading-relaxed">{step.description}</p></FadeUp>
      <FadeUp delay={0.25} className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </FadeUp>
    </ScreenWrapper>
  );
}

function MotivationalScreen({ step, onNext }: Props) {
  // Full-screen background mode when image is present and no description (page 35 style)
  const isFullScreenBg = step.image && !step.description;

  if (isFullScreenBg) {
    const titleParts = step.title?.split(/(build momentum)/i) || [step.title];
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <img src={step.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-10 h-full">
          <FadeUp delay={0.15}>
            <h1 className={`absolute left-1/2 -translate-x-1/2 w-[85%] text-[20px] font-extrabold text-white text-center leading-snug drop-shadow-lg ${
              step.title?.includes('build momentum') || step.title?.includes('Tailored')
                ? 'top-1/2 -translate-y-1/2'
                : 'bottom-[160px]'
            }`}>
              {titleParts.map((part, i) =>
                /build momentum/i.test(part) ? (
                  <span key={i} className="text-yellow-300 font-extrabold">{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </h1>
          </FadeUp>
          <FadeUp delay={0.3}>
            <button
              onClick={onNext}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-95 transition-transform shadow-xl"
            >
              {step.buttonLabel}
            </button>
          </FadeUp>
        </div>
      </div>
    );
  }

  const descMatch = step.description?.match(/^(\d+%)\s*(.*)/s);
  
  // Bottom-sheet layout when image + testimonial description
  const hasTestimonial = step.image && step.description?.includes('—');
  if (hasTestimonial) {
    const parts = step.description!.split('\n');
    const quote = parts[0];
    const author = parts.slice(1).join('\n');
    return (
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Mascot header background */}
        <div className="h-[180px] shrink-0 relative">
          <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
        </div>
        {/* White bottom sheet */}
        <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 overflow-hidden">
          <div className="px-5 pt-5 pb-5 flex flex-col h-full">
            <FadeUp>
              <h1 className="text-[24px] font-extrabold text-[#1a1f3d] text-center mb-2 leading-tight">{step.title}</h1>
            </FadeUp>
            {step.subtitle && (
              <FadeUp delay={0.08}>
                <p className="text-[15px] text-gray-500 leading-relaxed text-center mb-3 whitespace-pre-line">
                  <span className="font-bold text-[#1a1f3d]">{step.subtitle.split('\n')[0]}</span>
                  {step.subtitle.split('\n').length > 1 && '\n' + step.subtitle.split('\n').slice(1).join('\n')}
                </p>
              </FadeUp>
            )}
            {/* Before/After image inside the sheet — full width */}
            {step.image && (
              <FadeUp delay={0.12}>
                <div className="-mx-5 flex-1 min-h-0 flex items-center">
                  <img src={step.image} alt="" className="w-full object-contain max-h-full" />
                </div>
              </FadeUp>
            )}
            <FadeUp delay={0.18}>
              <div className="bg-amber-50/80 rounded-2xl border border-amber-200/50 px-4 py-3 mb-3 mt-3">
                <p className="text-[14px] text-[#1a1f3d] font-medium italic leading-relaxed text-center">{step.description}</p>
              </div>
            </FadeUp>
            <FadeUp delay={0.25}>
              <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
            </FadeUp>
          </div>
        </div>
      </div>
    );
  }

  // Hero + Bottom Sheet layout when illustrationLabel is set (selfcare-quiz, etc.)
  // Matches the Weekly Review "Hooray" design: 40% hero image, 60% white sheet
  if (step.illustrationLabel) {
    // Helper to render subtitle with highlighted keywords
    const renderSubtitle = (text: string) => {
      // Highlight text wrapped in **bold**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={i} className="font-extrabold text-foreground">{part.slice(2, -2)}</span>;
        }
        return <span key={i}>{part}</span>;
      });
    };

    return (
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Hero image — 40% height */}
        <div className="shrink-0 relative" style={{ height: step.id === 'sc-intro' ? '60%' : '40%' }}>
          <img
            src={step.id === 'sc-intro' ? selfcareQuizHero : (step.image || meplusMascotBg)}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 35%' }}
          />
        </div>

        {/* Bottom sheet — 60% */}
        <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-hidden">
          <div className="px-6 pt-7 flex flex-col flex-1 overflow-y-auto overscroll-contain">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-4"
            >
              <h1 className="text-[32px] font-extrabold text-foreground leading-tight whitespace-pre-line">
                {step.title}
              </h1>
            </motion.div>

            {step.subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-center mb-4"
              >
                <p className="text-[17px] text-foreground font-medium leading-relaxed whitespace-pre-line">
                  {renderSubtitle(step.subtitle)}
                </p>
              </motion.div>
            )}

            {/* Floating category badges (if step has them) */}
            {(step as any).badges && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-2 mb-4"
              >
                {((step as any).badges as { emoji: string; label: string }[]).map((badge, i) => (
                  <motion.span
                    key={badge.label}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.35, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0ff] border border-[#e8e0f0] text-[13px] font-semibold text-foreground shadow-sm"
                  >
                    <FluentEmoji emoji={badge.emoji} size={16} />
                    {badge.label}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* Spacer for sticky button */}
            <div className="h-24 shrink-0" />
          </div>

          {/* Button sticky at bottom */}
          <div className="sticky bottom-0 left-0 right-0 px-6 pb-5 pt-3 bg-gradient-to-t from-white via-white to-white/0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <button
                onClick={onNext}
                className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg"
              >
                {step.buttonLabel || 'Continue'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScreenWrapper center>
      <FadeUp><h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-2 leading-tight whitespace-pre-line">{step.title}</h1></FadeUp>
      {step.subtitle && (
        <FadeUp delay={0.08}>
          <p className="text-[15px] text-gray-600 leading-relaxed text-center mb-4 whitespace-pre-line">{step.subtitle}</p>
        </FadeUp>
      )}
      <FadeUp delay={0.1}>
        {step.image ? (
          <div className="flex items-center justify-center mb-3">
            <img src={step.image} alt="" className="w-full object-contain" />
          </div>
        ) : step.illustrationLabel ? (
          <IllustrationPlaceholder label={step.illustrationLabel} className="h-44 mb-3" />
        ) : null}
      </FadeUp>
      <FadeUp delay={0.15}>
        {descMatch ? (
          <p className="text-[15px] text-gray-600 leading-relaxed text-center mb-4">
            <span className="text-[#1a1f3d] font-extrabold text-2xl">{descMatch[1]}</span>{' '}
            {descMatch[2]}
          </p>
        ) : step.description ? (
          <p className="text-sm text-gray-500 italic leading-relaxed text-center mb-4 whitespace-pre-line">{step.description}</p>
        ) : null}
      </FadeUp>
      <FadeUp delay={0.25} className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </FadeUp>
    </ScreenWrapper>
  );
}

function NotificationScreen({ step, onNext, onMilestone }: Props) {
  const handleAllow = () => {
    onMilestone?.('notification');
    onNext();
  };

  return (
    <ScreenWrapper>
      <IllustrationPlaceholder label="Bell notification icon" className="h-40 mb-6" />
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      {step.subtitle && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 my-4 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#1a1f3d] mb-1">{step.subtitle}</p>
          <p className="text-xs text-gray-400">Notifications may include alerts, sounds, and icon badges.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={onNext} className="flex-1 py-2 text-xs font-medium text-blue-500 active:opacity-60">Don't Allow</button>
            <button onClick={handleAllow} className="flex-1 py-2 text-xs font-semibold text-blue-500 active:opacity-60">Allow</button>
          </div>
        </div>
      )}
      <div className="mt-auto space-y-2">
        <NavyButton onClick={handleAllow}>{step.buttonLabel}</NavyButton>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function ResultsChartScreen({ step, onNext }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
      <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-2xl p-5 mb-4 h-48 flex flex-col justify-end">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Your expectation</span>
          <span className="text-indigo-500 font-bold">Actually happen</span>
        </div>
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-indigo-300 rounded-t transition-all duration-700 ease-out"
              style={{ height: animated ? `${Math.min(100, 15 + i * 8)}%` : '4%' }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Now</span>
          <span>Next year</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl font-black text-indigo-500">{step.statHighlight}</span>
        <span className="text-sm text-gray-500">better</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function HabitLoopScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      {step.subtitle && <p className="text-base font-semibold text-[#1a1f3d] mb-3">{step.subtitle}</p>}
      {step.illustrationLabel ? (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-4 h-44 flex items-center justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-300 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Cue</div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Craving</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">Response</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">Reward</div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">Habit</div>
          </div>
        </div>
      ) : (
        <IllustrationPlaceholder label="Habit Loop Diagram" className="h-44 mb-4" />
      )}
      <p className="text-xs text-gray-500 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function LoadingTestimonialsScreen({ step, onNext }: Props) {
  const [progress, setProgress] = useState(0);
  const hasFired = useRef(false);

  useEffect(() => {
    setProgress(0);
    hasFired.current = false;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          if (!hasFired.current) {
            hasFired.current = true;
            setTimeout(onNext, 500);
          }
          return 100;
        }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [step.id]);

  // Extended testimonials for marquee rows
  const row1 = [
    { name: 'NightVain', text: 'Love it ❤️ Love it ❤️ Love it', stars: 5 },
    { name: 'Sarah_M', text: 'Changed my daily routine completely!', stars: 5 },
    { name: 'JohnDoe42', text: 'So helpful for productivity', stars: 4 },
    { name: 'MindfulAmy', text: 'Best habit app I\'ve tried', stars: 5 },
  ];
  const row2 = [
    { name: 'hdbdhdbdhdjcj', text: 'Helps me get things done', stars: 5 },
    { name: 'BestUser', text: 'Best app ever ⭐', stars: 5 },
    { name: 'WellnessGal', text: 'My mornings are so much better', stars: 5 },
    { name: 'ProductivePete', text: 'Finally sticking to my goals', stars: 4 },
  ];

  // Heart SVG path
  const heartPath = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

  return (
    <div className="h-full flex flex-col bg-[#f8f5ff] overflow-hidden relative">
      {/* Top section */}
      <div className="flex flex-col items-center pt-14 pb-4 px-6">
        {/* Heart-shaped progress */}
        <div className="relative w-28 h-28 mb-4">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <defs>
              <clipPath id="heartClip">
                <path d={heartPath} />
              </clipPath>
            </defs>
            {/* Background heart */}
            <path d={heartPath} fill="none" stroke="#e0d4f5" strokeWidth="0.8" />
            <path d={heartPath} fill="#f0eafc" />
            {/* Progress fill from bottom */}
            <rect
              x="0" y={24 - (progress / 100) * 24}
              width="24" height={(progress / 100) * 24}
              fill="#7c5cbf"
              clipPath="url(#heartClip)"
              className="transition-all duration-100"
            />
            {/* Heart outline on top */}
            <path d={heartPath} fill="none" stroke="#c4b0e8" strokeWidth="0.5" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1a1f3d]">
            {progress}%
          </span>
        </div>

        <h1 className="text-xl font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
        <p className="text-base font-bold text-purple-500 text-center mb-1">
          Millions of users
        </p>
        <p className="text-sm font-semibold text-[#1a1f3d] text-center">have chosen Rilo</p>
      </div>

      {/* Scrolling testimonials */}
      <div className="flex-1 flex flex-col justify-center gap-3 overflow-hidden px-0">
        {/* Row 1 - moves right */}
        <div className="flex gap-3 animate-[marqueeRight_20s_linear_infinite]" style={{ width: 'max-content' }}>
          {[...row1, ...row1].map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm min-w-[200px] shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                  {t.name[0]}
                </div>
                <span className="text-xs font-semibold text-[#1a1f3d]">{t.name}</span>
              </div>
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <span key={s} className="text-amber-400 text-[10px]">★</span>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">{t.text}</p>
            </div>
          ))}
        </div>

        {/* Row 2 - moves left */}
        <div className="flex gap-3 animate-[marqueeLeft_22s_linear_infinite]" style={{ width: 'max-content' }}>
          {[...row2, ...row2].map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm min-w-[200px] shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                  {t.name[0]}
                </div>
                <span className="text-xs font-semibold text-[#1a1f3d]">{t.name}</span>
              </div>
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <span key={s} className="text-amber-400 text-[10px]">★</span>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Community footer image */}
      <div className="shrink-0 mt-auto">
        <img src={meplusCommunityFooter} alt="" className="w-full object-cover object-top h-[140px]" />
      </div>

      <style>{`
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        @keyframes marqueeLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/**
 * Compute dynamic scores for 4 categories based on user answers from previous questions.
 * Maps Me+ survey questions (mp-5 through mp-21) to Self-control, Concentration, Productivity, Energy.
 */
function computeSummaryFromAnswers(answers: Record<string, string | string[]>) {
  // Each category starts at 70 and gets adjusted based on answers
  const scores = { 'Self-control': 70, 'Concentration': 70, 'Productivity': 70, 'Energy': 70 };

  // mp-5: Sleep duration → Energy
  const sleep = answers['mp-5'] as string;
  if (sleep?.includes('6-8')) scores['Energy'] += 15;
  else if (sleep?.includes('8-10')) scores['Energy'] += 10;
  else if (sleep?.includes('Less than 6')) scores['Energy'] -= 15;
  else if (sleep?.includes('More than 10')) scores['Energy'] -= 5;

  // mp-6: Wake up time → Self-control, Energy
  const wake = answers['mp-6'] as string;
  if (wake?.includes('0-10')) { scores['Self-control'] += 10; scores['Energy'] += 5; }
  else if (wake?.includes('10-20')) { scores['Self-control'] += 5; }
  else if (wake?.includes('More than 30')) { scores['Self-control'] -= 10; scores['Energy'] -= 5; }

  // mp-7: Energy level → Energy
  const energy = answers['mp-7'] as string;
  if (energy?.includes('High')) scores['Energy'] += 15;
  else if (energy?.includes('Medium')) scores['Energy'] += 0;
  else if (energy?.includes('Low')) scores['Energy'] -= 15;

  // mp-8: Lifestyle satisfaction → Productivity, Self-control
  const lifestyle = answers['mp-8'] as string;
  if (lifestyle?.includes('Completely')) { scores['Productivity'] += 10; scores['Self-control'] += 10; }
  else if (lifestyle?.includes('Slightly')) { scores['Productivity'] += 5; }
  else if (lifestyle?.includes('Not at all')) { scores['Productivity'] -= 10; scores['Self-control'] -= 5; }

  // mp-10: Better life goals → adjusts related category
  const goals = answers['mp-10'] as string;
  if (goals?.includes('productive')) scores['Productivity'] += 5;
  if (goals?.includes('disciplined')) scores['Self-control'] += 5;
  if (goals?.includes('mindfulness')) scores['Concentration'] += 5;
  if (goals?.includes('active')) scores['Energy'] += 5;

  // mp-12: Distraction → Concentration
  const distract = answers['mp-12'] as string;
  if (distract?.includes('Easily')) scores['Concentration'] -= 15;
  else if (distract?.includes('Sometimes')) scores['Concentration'] -= 5;
  else if (distract?.includes('Rarely')) scores['Concentration'] += 5;
  else if (distract?.includes('Stay focused')) scores['Concentration'] += 15;

  // mp-13: Procrastination → Self-control, Productivity
  const procrastinate = answers['mp-13'] as string;
  if (procrastinate?.includes('easily keep')) { scores['Self-control'] += 10; scores['Productivity'] += 5; }
  else if (procrastinate?.includes('time to time')) { scores['Self-control'] -= 5; }
  else if (procrastinate?.includes('change it')) { scores['Self-control'] -= 10; scores['Productivity'] -= 5; }

  // mp-14: Support system → Self-control
  const support = answers['mp-14'] as string;
  if (support?.includes('Very strong')) scores['Self-control'] += 5;
  else if (support?.includes('Weak')) scores['Self-control'] -= 5;

  // mp-15: Motivation → Productivity
  const motivation = answers['mp-15'] as string;
  if (motivation?.includes('goals')) scores['Productivity'] += 5;
  if (motivation?.includes('health')) scores['Energy'] += 5;

  // mp-17: Organization blockers (multi-select) → multiple categories
  const blockers = answers['mp-17'] as string[];
  if (Array.isArray(blockers)) {
    if (blockers.some(b => b.includes('ADHD'))) { scores['Concentration'] -= 10; scores['Self-control'] -= 5; }
    if (blockers.some(b => b.includes('motivation'))) scores['Energy'] -= 5;
    if (blockers.some(b => b.includes('No daily plan'))) scores['Productivity'] -= 5;
    if (blockers.some(b => b.includes('nothing holding'))) { scores['Self-control'] += 5; scores['Productivity'] += 5; }
  }

  // mp-18 to mp-21: Yes/No questions lower scores if "Yes" (relating to struggles)
  if (answers['mp-18'] === 'Yes') { scores['Self-control'] -= 5; scores['Energy'] -= 5; } // anxious
  if (answers['mp-19'] === 'Yes') { scores['Productivity'] -= 5; }                         // not enough time
  if (answers['mp-20'] === 'Yes') { scores['Concentration'] -= 10; }                       // concentrating
  if (answers['mp-21'] === 'Yes') { scores['Productivity'] -= 5; scores['Self-control'] -= 5; } // end of day regret

  // Clamp all scores between 25 and 95
  const clamp = (v: number) => Math.max(25, Math.min(95, v));
  
  return [
    { label: 'Self-control', value: clamp(scores['Self-control']), status: scores['Self-control'] >= 65 ? '✓ Right on track' : 'Could be better' },
    { label: 'Concentration', value: clamp(scores['Concentration']), status: scores['Concentration'] >= 65 ? '✓ Right on track' : 'Could be better' },
    { label: 'Productivity', value: clamp(scores['Productivity']), status: scores['Productivity'] >= 65 ? '✓ Right on track' : 'Could be better' },
    { label: 'Energy', value: clamp(scores['Energy']), status: scores['Energy'] >= 65 ? '✓ Right on track' : 'Could be better' },
  ];
}

function PersonalSummaryScreen({ step, onNext, answers }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  // Compute dynamic scores from user answers, fallback to static data
  const bars = answers && Object.keys(answers).length > 0
    ? computeSummaryFromAnswers(answers)
    : step.summaryBars || [];

  const categoryIcons: Record<string, string> = {
    'Self-control': '📵',
    'Concentration': '🧘',
    'Productivity': '✅',
    'Energy': '☕',
  };

  const isGood = (status: string) => status.includes('track');

  return (
    <ScreenWrapper center>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-6 whitespace-pre-line">{step.title}</h1>

      {/* 2×2 Circle Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 px-2">
        {bars.map((bar, i) => {
          const good = isGood(bar.status);
          const ringColor = good ? '#2db87f' : '#e8734a';
          const bgColor = good ? '#e8f5ee' : '#fce8e0';
          const badgeBg = good ? '#2db87f' : '#e8734a';
          const circumference = 2 * Math.PI * 54;
          const offset = circumference - (bar.value / 100) * circumference;

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative w-[120px] h-[120px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill={bgColor} stroke="#e5e7eb" strokeWidth="4" />
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={animated ? offset : circumference}
                    style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl">{categoryIcons[bar.label] || '📊'}</span>
                  <span className="text-xs font-bold text-[#1a1f3d] mt-1">{bar.label}</span>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold text-white px-3 py-1 rounded-full"
                style={{ backgroundColor: badgeBg }}
              >
                {good ? '✓ ' : ''}{bar.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Trust banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-4 mb-5 mx-1">
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center text-center">
            <p className="text-2xl font-black text-[#1a1f3d]">30M+</p>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Already<br/>organized</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex flex-col items-center text-center">
            <p className="text-2xl font-black text-[#1a1f3d]">94%</p>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Meet their<br/>better self</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex flex-col items-center text-center">
            <span className="text-xl">⭐</span>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">4.9 rated<br/>on App Store</p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function FirstHabitScreen({ step, onNext }: Props) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
      <p className="text-sm text-gray-400 mb-3">Today</p>
      <div className="flex gap-1 mb-5">
        {days.map((d, i) => (
          <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs ${i === 3 ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400'}`}>
            <div>{d}</div>
            <div className="mt-1">{12 + i}</div>
          </div>
        ))}
      </div>
      <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3 mb-6">
        <span className="text-2xl">🧘</span>
        <div>
          <p className="text-sm font-semibold text-[#1a1f3d]">{step.subtitle}</p>
          <p className="text-xs text-gray-400">{step.description}</p>
        </div>
      </div>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function BreathingPrepScreen({ step, onNext }: Props) {
  useEffect(() => {
    const t = setTimeout(onNext, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScreenWrapper bg="bg-[#1a1f3d]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-48 h-48 mb-8 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30 flex items-center justify-center animate-pulse">
          <span className="text-indigo-200 text-xs">{step.illustrationLabel}</span>
        </div>
        <h1 className="text-2xl font-bold text-white text-center">{step.title}</h1>
      </div>
    </ScreenWrapper>
  );
}

function BreathingScreen({ step, onNext }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [count, setCount] = useState(3);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (cycles >= 1) { onNext(); return; }
    
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          setPhase(p => {
            if (p === 'in') return 'hold';
            if (p === 'hold') return 'out';
            setCycles(c => c + 1);
            return 'in';
          });
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cycles]);

  const phaseLabel = phase === 'in' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out';
  const scale = phase === 'in' ? 'scale-110' : phase === 'out' ? 'scale-90' : 'scale-100';

  return (
    <ScreenWrapper bg="bg-[#1a1f3d]">
      <p className="text-sm text-gray-300 text-center mt-4">{cycles + 1} breath{cycles > 0 ? 's' : ''}</p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`w-40 h-40 rounded-full border-4 border-indigo-400/50 flex items-center justify-center mb-4 transition-transform duration-1000 ${scale}`}>
          <div className="w-28 h-28 rounded-full bg-indigo-400/20 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{count}</span>
          </div>
        </div>
        <p className="text-lg font-semibold text-white">{phaseLabel}</p>
      </div>
    </ScreenWrapper>
  );
}

function BreathingDoneScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      <p className="text-sm text-gray-400 mb-5">{step.description}</p>
      <p className="text-sm text-gray-400 mb-3">Today</p>
      <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 mb-6 border border-green-200">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-semibold text-[#1a1f3d]">{step.subtitle}</p>
          <p className="text-xs text-gray-400">Today • Now</p>
        </div>
      </div>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function StreakScreen({ step, onNext }: Props) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  const [showStreak, setShowStreak] = useState(false);
  useEffect(() => { setTimeout(() => setShowStreak(true), 400); }, []);

  return (
    <ScreenWrapper>
      <p className="text-sm text-gray-400 mb-2">Today</p>
      <div className="flex gap-1 mb-5">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center py-2 rounded-lg text-xs bg-green-50 text-green-600 font-medium">
            <div>{d}</div>
            <div className="mt-1">✓</div>
          </div>
        ))}
      </div>
      <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center mb-4 transition-all duration-700 ${showStreak ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">{step.title}</p>
        <p className="text-4xl font-black text-[#1a1f3d] mt-2">{step.statHighlight}</p>
        <p className="text-sm font-semibold text-[#1a1f3d] mt-1">{step.subtitle}</p>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function PaywallImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, [images.length]);
  return (
    <div className="relative flex items-center justify-center mb-5 overflow-hidden" style={{ aspectRatio: '1/1' }}>
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`absolute w-full max-w-[300px] rounded-2xl object-contain transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
}

function PaywallScreen({ step, onNext }: Props) {
  const [selectedTier, setSelectedTier] = useState(
    step.pricingTiers?.findIndex(t => t.badge?.includes('Trial') || t.badge?.includes('Free')) ?? 1
  );
  const { handlePurchase, handleRestore, isPurchasing, isRestoring } = useRevenueCat();

  // Fetch real product IDs from program_catalog
  const { data: productIds } = useQuery({
    queryKey: ['paywall-product-ids'],
    queryFn: async () => {
      const { data } = await (supabase
        .from('program_catalog')
        .select('ios_product_id, annual_ios_product_id')
        .eq('slug', 'simora-plus')
        .maybeSingle() as any);
      return {
        monthly: data?.ios_product_id || '',
        annual: data?.annual_ios_product_id || '',
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const onSubscribe = async () => {
    const tier = step.pricingTiers?.[selectedTier];
    if (!tier || !productIds) return;
    const plan = selectedTier === 1 ? 'annual' : 'monthly';
    const productId = plan === 'annual' ? productIds.annual : productIds.monthly;
    if (!productId) { console.error('[Paywall] No product ID for plan:', plan); return; }
    await handlePurchase(productId, plan);
  };

  return (
    <ScrollArea className="h-full bg-white">
      <div className="flex flex-col h-full px-5 pt-[calc(env(safe-area-inset-top,44px)+12px)] pb-6">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onNext} className="text-gray-400 text-lg active:opacity-60">✕</button>
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          className="text-sm font-medium text-indigo-500 active:opacity-60"
        >
          {isRestoring ? 'Restoring...' : 'Restore'}
        </button>
      </div>
      <h1 className="text-[22px] font-extrabold text-[#1a1f3d] text-center mb-4 leading-tight">{step.title}</h1>

      {/* Auto-rotating before/after images */}
      {step.image && (
        <PaywallImageCarousel images={[step.image, meplusPaywall2, meplusPaywall3]} />
      )}

      {/* Pricing tiers - compact centered 2-card layout */}
      <div className="flex justify-center gap-3 mb-4">
        {step.pricingTiers?.map((tier, i) => {
          const isSelected = i === selectedTier;
          return (
            <button
              key={i}
              onClick={() => setSelectedTier(i)}
              className={`relative rounded-2xl border-2 pt-5 pb-3 px-3 text-center transition-all active:scale-[0.97] w-[140px] ${
                isSelected ? 'border-indigo-500 bg-indigo-50/60' : 'border-gray-200 bg-white'
              }`}
            >
              {tier.badge && (
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  tier.badge.includes('Trial') || tier.badge.includes('Free') ? 'bg-indigo-500 text-white' : 'bg-purple-200 text-purple-700'
                }`}>{tier.badge}</span>
              )}
              <p className="text-sm font-extrabold text-[#1a1f3d] leading-tight">{tier.label}</p>
              <p className={`text-[11px] text-gray-400 mt-0.5 ${tier.perWeek?.includes('/mo.') && tier.label.startsWith('1') ? 'line-through' : ''}`}>{tier.perWeek}</p>
              {tier.discount && (
                <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">{tier.discount}</span>
              )}
              <div className="border-t border-gray-200 mt-1.5 pt-1.5">
                <p className={`text-xs font-bold ${isSelected ? 'text-[#1a1f3d]' : 'text-gray-500'}`}>{tier.total}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* No payment badge */}
      {step.subtitle && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="text-green-500 text-base">✅</span>
          <p className="text-sm font-semibold text-[#1a1f3d]">{step.subtitle}</p>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={onSubscribe}
          disabled={isPurchasing}
          className="w-full py-4 rounded-full bg-[#1a1f3d] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {isPurchasing ? 'Processing...' : step.buttonLabel}
          {!isPurchasing && <span className="text-lg">→</span>}
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 mt-3">
        <a href="/sms-terms" target="_blank" className="text-[10px] text-gray-400 underline">Terms</a>
        <span className="text-[10px] text-gray-300">·</span>
        <a href="/privacy" target="_blank" className="text-[10px] text-gray-400 underline">Privacy</a>
      </div>
      </div>
    </ScrollArea>
  );
}

function BeforeAfterScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
      <p className="text-lg font-semibold text-[#1a1f3d] text-center mb-3">{step.subtitle}</p>
      {step.image ? (
        <div className="flex-1 flex items-center justify-center mb-4">
          <img src={step.image} alt="" className="w-full object-contain" />
        </div>
      ) : (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-red-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-red-400 uppercase mb-3">Before</p>
            <ul className="space-y-2">
              {step.beforeItems?.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 bg-green-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-green-500 uppercase mb-3">After</p>
            <ul className="space-y-2">
              {step.afterItems?.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function BeforeAfterVisualScreen({ step, onNext }: Props) {
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Mascot header background — same as motivational screen */}
      <div className="h-[180px] shrink-0 relative">
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>
      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 overflow-hidden">
        <div className="px-5 pt-5 pb-5 flex flex-col h-full">
          <FadeUp>
            <h1 className="text-[24px] font-extrabold text-[#1a1f3d] text-center mb-2 leading-tight whitespace-pre-line">{step.title}</h1>
          </FadeUp>
          {step.subtitle && (
            <FadeUp delay={0.08}>
              <p className="text-[15px] text-[#1a1f3d] leading-relaxed text-center mb-3 whitespace-pre-line">{step.subtitle}</p>
            </FadeUp>
          )}
          {/* Before/After comparison image — full width */}
          <FadeUp delay={0.12}>
            <div className="-mx-5 flex-1 min-h-0 flex items-center">
              <img src={beforeAfterComparison} alt="Before and After comparison" className="w-full object-contain max-h-full" />
            </div>
          </FadeUp>
          {/* Bottom tagline */}
          <FadeUp delay={0.18}>
            <div className="bg-amber-50/80 rounded-2xl border border-amber-200/50 px-4 py-3 mb-3 mt-3">
              <p className="text-[14px] text-[#1a1f3d] font-medium italic leading-relaxed text-center">{step.description}</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.25}>
            <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}

function ScienceBackedScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper center>
      {step.subtitle ? (
        <>
          <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-2 leading-tight">{step.title}</h1>
          {step.image ? (
            <div className="flex items-center justify-center mb-3">
              <img src={step.image} alt="" className="w-full object-contain" />
            </div>
          ) : (
            <IllustrationPlaceholder label={step.illustrationLabel || step.subtitle} className="h-36 mb-4" />
          )}
          
          {/* Stats section */}
          {step.statHighlight ? (
            <div className="space-y-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-lg">🏅</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="text-[#1a1f3d] font-extrabold text-xl">{step.statHighlight}</span>{' '}
                  {step.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-lg">🎓</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="text-[#1a1f3d] font-extrabold text-xl">3X</span>{' '}
                  times more successful than other to achieve the goal by behavioral science
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-lg">🏅</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="text-[#1a1f3d] font-extrabold text-xl">96%</span>{' '}
                  of Rilo users have accomplished at least one goal and built healthy habits.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{step.description}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {step.statBadges?.map((b, i) => (
              <span key={i} className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600">{b.label}</span>
            ))}
          </div>
        </>
      )}
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function RatingScreen({ step, onNext, onMilestone }: Props) {
  const [rating, setRating] = useState(0);

  const handleRate = () => {
    onMilestone?.('review');
    onNext();
  };

  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
        {step.subtitle && <p className="text-sm text-gray-400 text-center mb-2">{step.subtitle}</p>}
        <p className="text-sm text-gray-500 text-center mb-4">{step.description}</p>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} className="text-2xl active:scale-110 transition-transform">
              <span className={s <= rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto space-y-2">
        <NavyButton onClick={handleRate}>{step.buttonLabel}</NavyButton>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function DiscountOfferScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-gradient-to-b from-amber-50 to-white">
      <button onClick={onNext} className="self-end text-gray-400 text-lg mb-2 active:opacity-60">✕</button>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">🎁</div>
        <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
        <p className="text-sm text-gray-500 text-center mb-2">{step.subtitle}</p>
        <p className="text-xs text-gray-400 text-center mb-6">{step.description}</p>
        {step.pricingTiers?.map((tier, i) => (
          <div key={i} className="w-full rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 mb-4 relative">
            {tier.badge && (
              <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{tier.badge}</span>
            )}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-[#1a1f3d]">{tier.label}</p>
                <p className="text-xs text-gray-400">{tier.total}</p>
              </div>
              <p className="text-sm font-bold text-amber-600">{tier.perWeek}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto space-y-2">
        <button className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-semibold text-sm active:scale-[0.98]">
          {step.buttonLabel}
        </button>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

// ─── Rilo Language Cards ───────────────────────────────────────

type LangCfg = {
  name: string;          // big solid-black native name
  greeting: string;      // small italic native greeting
  bg: string;            // top stripe color
  fontClass?: string;    // optional script-specific font (e.g. font-farsi)
  rtl?: boolean;
};

const LANG_CARDS: Record<string, LangCfg & { accent: string; ring: string }> = {
  'English only': {
    name: 'English',
    greeting: 'Hi, friend!',
    bg: 'bg-[#FFF492]',
    accent: '#F59E0B',
    ring: 'rgba(245,158,11,0.45)',
  },
  'Persian': {
    name: 'فارسی',
    greeting: 'سلام عزیزم',
    bg: 'bg-[#E0FBB8]',
    fontClass: 'font-farsi',
    rtl: true,
    accent: '#65A30D',
    ring: 'rgba(101,163,13,0.45)',
  },
  'Turkish': {
    name: 'Türkçe',
    greeting: 'Merhaba!',
    bg: 'bg-[#D7E9FF]',
    accent: '#2563EB',
    ring: 'rgba(37,99,235,0.45)',
  },
  'Spanish': {
    name: 'Español',
    greeting: '¡Hola, amiga!',
    bg: 'bg-[#FFD9E0]',
    accent: '#E11D48',
    ring: 'rgba(225,29,72,0.45)',
  },
};

function RiloLanguageBubblesScreen({ step, onNext, onAnswer }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const pickedCfg = picked !== null ? LANG_CARDS[step.options?.[picked]?.label || ''] : null;

  const select = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    haptic.success();
    const label = step.options?.[i]?.label || '';
    onAnswer?.(step.id, label);
    setTimeout(onNext, 800);
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF7F0] via-white to-[#F4F1FF]">
      {/* ───── Visual: globe ───── */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-2 relative z-10 min-h-0">
        <div className="relative w-full aspect-square max-w-[260px]">
          {/* Spotlight glow */}
          <motion.div
            aria-hidden
            className="absolute inset-4 rounded-full blur-3xl"
            animate={{
              backgroundColor: pickedCfg?.ring || 'rgba(26,31,61,0.18)',
              scale: picked !== null ? 1.05 : 1,
            }}
            transition={{ duration: 0.5 }}
          />
          {/* Dashed orbits */}
          <motion.div
            aria-hidden
            className="absolute inset-2 rounded-full border-2 border-dashed border-[#1a1f3d]/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-8 rounded-full border border-dashed border-[#1a1f3d]/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
          {/* Globe core */}
          <motion.div
            className="absolute inset-[22%] rounded-full bg-gradient-to-br from-[#1a1f3d] to-[#2d3566] flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(26,31,61,0.6)] overflow-hidden"
            animate={{ scale: picked !== null ? 0.94 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.span
              className="text-[64px] leading-none"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              🌍
            </motion.span>
          </motion.div>
          {/* Picked greeting bubble pops out below globe */}
          {pickedCfg && (
            <motion.div
              key={pickedCfg.name}
              initial={{ opacity: 0, y: -6, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className={`absolute left-1/2 -translate-x-1/2 bottom-2 px-4 py-2 rounded-full bg-white shadow-lg whitespace-nowrap ${pickedCfg.fontClass || ''}`}
              dir={pickedCfg.rtl ? 'rtl' : 'ltr'}
            >
              <span className="text-[14px] font-extrabold text-black">{pickedCfg.greeting}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ───── Text + tappable list (matches RiloTeach pattern) ───── */}
      <div className="shrink-0 px-6 pb-8 relative z-10">
        <FadeUp>
          <h1 className="text-[24px] leading-[1.2] font-extrabold text-[#1a1f3d] text-center whitespace-pre-line">
            {step.title}
          </h1>
        </FadeUp>
        {step.subtitle && (
          <FadeUp delay={0.08}>
            <p className="mt-2 text-[14px] text-[#1a1f3d]/65 text-center leading-snug">
              {step.subtitle}
            </p>
          </FadeUp>
        )}

        {/* Visible, obviously-tappable language buttons */}
        <StaggerContainer className="mt-5 space-y-2.5" staggerDelay={0.06}>
          {step.options?.map((opt, i) => {
            const cfg = LANG_CARDS[opt.label];
            if (!cfg) return null;
            const isPicked = picked === i;
            const isDimmed = picked !== null && !isPicked;
            return (
              <StaggerItem key={i}>
                <motion.button
                  onClick={() => select(i)}
                  animate={{
                    scale: isPicked ? 1.02 : 1,
                    opacity: isDimmed ? 0.4 : 1,
                  }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform border-2 ${
                    isPicked
                      ? 'border-[#1a1f3d] bg-white shadow-[0_10px_24px_-12px_rgba(26,31,61,0.4)]'
                      : 'border-black/5 bg-white shadow-[0_4px_12px_-8px_rgba(26,31,61,0.2)]'
                  }`}
                >
                  {/* Flag chip */}
                  <div className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center">
                    {opt.emoji && <OptionEmoji emoji={opt.emoji} size={22} />}
                  </div>
                  {/* Name + greeting */}
                  <div className="flex-1 min-w-0" dir={cfg.rtl ? 'rtl' : 'ltr'}>
                    <div
                      className={`text-[16px] font-extrabold text-black leading-tight ${cfg.fontClass || ''}`}
                    >
                      {cfg.name}
                    </div>
                    <div
                      className={`text-[12px] text-[#1a1f3d]/60 leading-tight mt-0.5 ${cfg.fontClass || ''}`}
                    >
                      {cfg.greeting}
                    </div>
                  </div>
                  {/* Selection indicator */}
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isPicked ? 'bg-[#1a1f3d]' : 'border-2 border-black/15'
                    }`}
                  >
                    {isPicked && <SealCheck className="w-4 h-4 text-white" />}
                  </div>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Skip */}
        <button
          onClick={onNext}
          className="mt-4 w-full text-center text-[13px] text-[#1a1f3d]/45 py-2 active:opacity-60"
        >
          Skip this question
        </button>
      </div>
    </div>
  );
}

function WelcomeAboardScreen({ step, onNext }: Props) {
  const handleEnable = async () => {
    try {
      // Try native Capacitor push notifications
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
      }
    } catch {
      // Web fallback
      try {
        await Notification.requestPermission();
      } catch { /* ignore */ }
    }
    // Also request local notification permission (required on Android 13+)
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();
    } catch { /* ignore */ }
    onNext();
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF7F0] via-white to-[#F4F1FF]">
      {/* ───── Visual: top-half of iPhone (clipped) ───── */}
      <div className="flex-1 flex items-end justify-center px-6 pt-6 relative z-10 min-h-0 overflow-hidden">
        <FadeUp delay={0.18} className="w-full flex justify-center">
          {/* Container clips bottom half of phone */}
          <div
            className="relative w-[260px]"
            style={{ height: 'min(360px, 55vh)' }}
          >
            {/* Phone frame — taller than container so bottom is clipped */}
            <div className="absolute left-0 right-0 top-0 h-[520px] rounded-[40px] bg-[#1a1f3d] shadow-[0_30px_60px_-20px_rgba(26,31,61,0.45)]" />
            <div className="absolute left-[6px] right-[6px] top-[6px] h-[508px] rounded-[34px] bg-gradient-to-b from-[#EEF1FA] via-[#F5F0FB] to-[#FBE9EE] overflow-hidden">
              {/* Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[88px] h-[22px] rounded-full bg-[#1a1f3d]" />

              {/* Lock-screen time */}
              <div className="pt-14 text-center">
                <p className="text-[12px] font-medium text-[#1a1f3d]/60">Monday, June 6</p>
                <p className="text-[56px] font-light text-[#1a1f3d] leading-none mt-1">9:41</p>
              </div>

              {/* Notification card — positioned in upper portion so it's visible after clip */}
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-3 right-3 top-[200px] bg-white/95 backdrop-blur-md rounded-[18px] px-3 py-2.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)] flex items-start gap-2.5"
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#1a1f3d] flex items-center justify-center shrink-0">
                  <FluentEmoji emoji="🔔" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#1a1f3d] truncate">Rilo</p>
                    <p className="text-[9px] text-[#1a1f3d]/50">now</p>
                  </div>
                  <p className="text-[12px] font-semibold text-[#1a1f3d] mt-0.5 leading-tight">
                    Time for your morning reset ☀️
                  </p>
                  <p className="text-[10px] text-[#1a1f3d]/70 leading-snug mt-0.5">
                    A quick 2-min check-in to start your day calm.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Soft fade at the clip line so the phone "dissolves" rather than gets cut */}
            <div
              aria-hidden
              className="absolute left-0 right-0 bottom-0 h-20 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 70%, rgba(255,255,255,1) 100%)',
              }}
            />
          </div>
        </FadeUp>
      </div>

      {/* ───── Text + CTAs (matches RiloTeach pattern) ───── */}
      <div className="shrink-0 px-6 pb-8 relative z-10">
        <FadeUp>
          <h1 className="text-[26px] leading-[1.2] font-extrabold text-[#1a1f3d] text-center">
            Never miss a task.
          </h1>
        </FadeUp>
        <FadeUp delay={0.08}>
          <p className="mt-2 text-[14px] text-[#1a1f3d]/65 text-center leading-snug">
            We&apos;ll send gentle, tailored nudges so you stay on top of even the most hectic days.
          </p>
        </FadeUp>
        <FadeUp delay={0.16} className="mt-5">
          <NavyButton onClick={handleEnable}>Turn on notifications</NavyButton>
          <button
            onClick={onNext}
            className="w-full py-3 text-sm text-[#1a1f3d]/50 font-medium active:opacity-60 mt-2"
          >
            Maybe later
          </button>
        </FadeUp>
      </div>
    </div>
  );
}

// ─── New Me+ Screens ──────────────────────────────────────

function ContractScreen({ step, onNext }: Props) {
  const [signed, setSigned] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasStrokes = useRef(false);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1f3d';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasStrokes.current = true;
    if (!signed) setSigned(true);
  };

  const stopDraw = () => { isDrawing.current = false; };

  const handleConfirm = () => {
    if (!signed) return;
    setShowCelebration(true);
    const myConfetti = confetti.create(undefined, { resize: true, useWorker: true });
    myConfetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });
    setTimeout(() => {
      myConfetti({ particleCount: 50, spread: 90, origin: { y: 0.4 } });
    }, 300);
    setTimeout(onNext, 2500);
  };

  if (showCelebration) {
    return (
      <ScreenWrapper bg="bg-white">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center">
            Start 7-day <span className="text-3xl font-black">Free</span> Trial!
          </h1>
        </div>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="bg-[#f5f0ff]">
      <div className="text-4xl mb-2">💜</div>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
      <ul className="space-y-3 mb-6">
        {step.options?.map((opt, i) => (
          <li key={i} className="text-base font-medium text-[#1a1f3d]">• {opt.label}</li>
        ))}
      </ul>
      <div className="relative bg-gray-100 rounded-2xl p-3 mb-2">
        <p className="text-xs text-gray-500 mb-1 font-medium">Sign your name using finger:</p>
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full h-24 rounded-xl bg-white touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {/* Finger hint pointing to signature area */}
        {!signed && (
          <div className="absolute -top-2 right-4 pointer-events-none z-10" style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))' }}>
            <div style={{ animation: 'coachHandBounce 1.4s ease-in-out infinite', transform: 'rotate(-45deg)' }}>
              <FluentEmoji emoji="👇" size={48} />
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center mb-4">*Your signature will not be recorded</p>
      <div className="mt-auto">
        <button
          onClick={handleConfirm}
          disabled={!signed}
          className={`mx-auto block px-10 py-3 rounded-full text-white font-semibold text-sm transition-opacity ${signed ? 'bg-[#1a1f3d]' : 'bg-gray-300 opacity-50 cursor-not-allowed'}`}
        >
          {step.buttonLabel}
        </button>
      </div>
      <style>{`
        @keyframes coachHandBounce {
          0%   { transform: rotate(-45deg) translateY(0px); }
          40%  { transform: rotate(-45deg) translateY(10px); }
          100% { transform: rotate(-45deg) translateY(0px); }
        }
      `}</style>
    </ScreenWrapper>
  );
}

function DistressGridScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-3 whitespace-pre-line">{step.title}</h1>
      {step.image ? (
        <div className="flex-1 min-h-0 flex items-center justify-center mb-4">
          <img src={step.image} alt="" className="w-full max-h-full object-contain" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {step.options?.map((opt, i) => (
            <div key={i} className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 aspect-square flex items-center justify-center p-3">
              <IllustrationPlaceholder label={opt.label} className="w-full h-full" />
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function ADHDInfoScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      {step.image ? (
        <div className="flex items-center justify-center mb-3">
          <img src={step.image} alt="" className="w-full object-contain rounded-2xl" />
        </div>
      ) : (
        <IllustrationPlaceholder label={step.illustrationLabel || 'Brain comparison'} className="h-40 mb-3" />
      )}
      <div className="bg-gray-50 rounded-2xl p-4 mb-4">
        <p className="text-sm font-bold text-[#1a1f3d] mb-3"><span className="bg-[#e8e4ff] px-1.5 py-0.5 rounded font-extrabold">Rilo</span> can help ADHD:</p>
        <ul className="space-y-2">
          {step.options?.map((opt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#1a1f3d]">
              <span className="text-green-500 mt-0.5">✅</span> {opt.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function LuckyDrawScreen({ step, onNext }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    setSpinning(true);
    setRotation(prev => prev + 1440 + Math.random() * 360);
    setTimeout(onNext, 3000);
  };

  return (
    <ScreenWrapper bg="bg-[#0a0a1a]">
      <h1 className="text-2xl font-black text-white text-center mb-1 tracking-wider">{step.title}</h1>
      <p className="text-sm text-yellow-400 text-center mb-4 italic">{step.subtitle}</p>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-56 h-56">
          <div
            className="w-full h-full rounded-full border-4 border-pink-300 bg-gradient-to-br from-pink-50 to-yellow-50 transition-transform duration-[3000ms] ease-out flex items-center justify-center"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {['JACKPOT', '20%', 'NICE TRY', '10%', '15%', 'NICE TRY'].map((seg, i) => (
              <div key={i} className="absolute text-[8px] font-bold text-red-600" style={{ transform: `rotate(${i * 60}deg) translateY(-70px)` }}>{seg}</div>
            ))}
          </div>
          <button
            onClick={spin}
            disabled={spinning}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-b from-purple-400 to-purple-600 text-white font-bold text-xs shadow-lg z-10"
          >
            SPIN
          </button>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function SuperPrizeScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-[#0a0a1a]">
      <h1 className="text-2xl font-black text-white text-center mb-1 tracking-wider">{step.title}</h1>
      <p className="text-sm text-yellow-400 text-center mb-4 italic">{step.subtitle}</p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl px-10 py-6 mb-6 text-center rotate-[-3deg]">
          <p className="text-xs text-purple-200 tracking-[0.3em] mb-1">S U P E R  P R I Z E</p>
          <p className="text-4xl font-black text-white">{step.statHighlight}</p>
          <p className="text-xs text-purple-200 mt-1">Unlock all premium features</p>
        </div>
        <p className="text-white text-sm font-semibold">Only <span className="text-purple-300">$1.67</span>/month</p>
        <p className="text-gray-400 text-xs mt-1">Total $19.99/year <span className="line-through">($39.99/year)</span></p>
      </div>
      <div className="mt-auto space-y-2">
        <button onClick={onNext} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-400 to-purple-600 text-white font-semibold text-sm">{step.buttonLabel}</button>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
      <p className="text-[10px] text-gray-500 text-center mt-2">Terms of Service and Privacy Policy</p>
    </ScreenWrapper>
  );
}

function CountdownPaywallScreen({ step, onNext }: Props) {
  const [seconds, setSeconds] = useState(177);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <ScreenWrapper>
      <button onClick={onNext} className="self-start text-gray-400 text-lg mb-1">✕</button>
      <span className="self-end text-sm text-gray-400 -mt-6 mb-2">Restore</span>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-3">{step.title}</h1>
      <IllustrationPlaceholder label={step.illustrationLabel || 'Before/After'} className="h-40 mb-4" />
      <div className="space-y-2 mb-3">
        {step.pricingTiers?.map((tier, i) => (
          <button key={i} className={`relative w-full rounded-xl border-2 p-3 text-left ${i === 1 ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
            {tier.badge && <span className="absolute -top-2 right-2 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{tier.badge}</span>}
            <p className="text-sm font-bold text-[#1a1f3d]">{tier.label}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{tier.perWeek}</span><span>{tier.total}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1 mb-2">
        {String(mm).padStart(2,'0').split('').map((d,i) => <span key={`m${i}`} className="bg-purple-500 text-white text-sm font-bold w-7 h-8 flex items-center justify-center rounded">{d}</span>)}
        <span className="text-purple-500 font-bold">:</span>
        {String(ss).padStart(2,'0').split('').map((d,i) => <span key={`s${i}`} className="bg-purple-500 text-white text-sm font-bold w-7 h-8 flex items-center justify-center rounded">{d}</span>)}
      </div>
      <p className="text-xs text-center text-gray-500 mb-3">🎁 Special offer, charge now & no free trial</p>
      <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      <p className="text-[9px] text-gray-300 text-center mt-2">{step.description}</p>
    </ScreenWrapper>
  );
}

function DarkPaywallScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-[#0a0a1a]">
      <button onClick={onNext} className="self-start text-gray-500 text-lg mb-1">✕</button>
      <span className="self-end text-sm text-gray-400 -mt-6 mb-2">Restore</span>
      <p className="text-sm text-gray-400 text-center mb-1">{step.title}</p>
      <h1 className="text-2xl font-extrabold text-white text-center mb-3">{step.subtitle}</h1>
      <IllustrationPlaceholder label={step.illustrationLabel || 'Before/After'} className="h-32 mb-3" />
      <div className="bg-gradient-to-r from-pink-500 to-red-400 rounded-2xl px-6 py-4 mb-4 text-center">
        <p className="text-3xl font-black text-white">{step.statHighlight}</p>
      </div>
      <div className="space-y-2 mb-3">
        {step.pricingTiers?.map((tier, i) => (
          <button key={i} className={`relative w-full rounded-xl border-2 p-3 text-left ${i === 1 ? 'border-purple-500' : 'border-gray-700'}`}>
            {tier.badge && <span className="absolute -top-2 right-2 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{tier.badge}</span>}
            <p className="text-sm font-bold text-white">{tier.label}</p>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{tier.perWeek}</span><span>{tier.total}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-center text-green-400 mb-3">✅ No Payment Now!</p>
      <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      <p className="text-[9px] text-gray-500 text-center mt-2">{step.description}</p>
    </ScreenWrapper>
  );
}

function TaskSelectPurpleScreen({ step, onNext }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setSelected(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <ScreenWrapper bg="bg-gradient-to-b from-purple-500 to-purple-700">
      <h1 className="text-2xl font-extrabold text-white text-center mb-1">{step.title}</h1>
      <p className="text-sm text-yellow-300 text-center mb-4">{step.subtitle}</p>
      <div className="space-y-3 mb-4">
        {step.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${
              selected.has(i) ? 'bg-white' : 'bg-white/90'
            }`}
          >
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
            <div className={`w-5 h-5 rounded-full border-2 ${selected.has(i) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`} />
          </button>
        ))}
      </div>
    </ScreenWrapper>
  );
}

// ─── Starter Routine Screen ──────────────────────────────────

interface StarterTask {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  taskColor: string;
  proLinkType?: string;
  repeatPattern: 'daily' | 'none';
}

const STARTER_TASKS: StarterTask[] = [
  { emoji: '📱', title: 'Open Ladyboss App', subtitle: 'You already did this one!', color: '#FFEDD5', taskColor: 'orange', repeatPattern: 'daily' },
  { emoji: '🌤️', title: 'Check in with your mood', subtitle: 'How are you feeling right now?', color: '#FEF3C7', taskColor: 'yellow', proLinkType: 'mood', repeatPattern: 'daily' },
  { emoji: '🫁', title: 'Breathing exercise', subtitle: '3 deep breaths to reset', color: '#DBEAFE', taskColor: 'blue', proLinkType: 'breathe', repeatPattern: 'daily' },
  { emoji: '📝', title: 'Write a short journaling', subtitle: 'One sentence about your day', color: '#F3E8FF', taskColor: 'purple', proLinkType: 'journal', repeatPattern: 'daily' },
  { emoji: '✅', title: 'Complete onboarding', subtitle: 'Pick something quick & easy', color: '#D1FAE5', taskColor: 'green', repeatPattern: 'none' },
];

// Build a fake UserTask object for TaskCard rendering
function buildUserTask(t: StarterTask, index: number, taskId?: string): import('@/hooks/useTaskPlanner').UserTask {
  return {
    id: taskId || `onboarding-${index}`,
    user_id: '',
    title: t.title,
    description: t.subtitle,
    emoji: t.emoji,
    color: t.taskColor as any,
    scheduled_date: null,
    scheduled_time: null,
    time_period: null,
    repeat_pattern: t.repeatPattern,
    repeat_days: [],
    reminder_enabled: false,
    reminder_offset: 15,
    is_urgent: false,
    tag: null,
    order_index: index,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: (t.proLinkType as any) || null,
    pro_link_value: null,
    goal_enabled: false,
    goal_type: null,
    goal_target: null,
    goal_unit: null,
    source_routine_id: null,
    duration_minutes: null,
  };
}

type DemoPhase =
  | 'intro'
  | 'revealing'
  | 'viewing'
  | 'ready-to-play'
  | 'spotlight-app'
  | 'hint-app'
  | 'celebrate-app'
  | 'spotlight-mood'
  | 'hint-mood'
  | 'celebrate-mood'
  | 'feeling-mood'
  | 'spotlight-breathe'
  | 'hint-breathe'
  | 'celebrate-breathe'
  | 'spotlight-complete'
  | 'hint-complete'
  | 'celebrate-complete'
  | 'victory'
  | 'done'
  | 'transition-mood'
  | 'transition-breathe';

// ─── Mini inline breathing overlay for onboarding ──────────────

type BreathPhaseLocal = 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold' | 'ready';

function OnboardingBreathingOverlay({ onComplete }: { onComplete: () => void }) {
  const [breathPhase, setBreathPhase] = useState<BreathPhaseLocal>('ready');
  const [countdown, setCountdown] = useState(3);
  const [cycleCount, setCycleCount] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const completedRef = useRef(false);
  const totalCycles = 1;

  // Pattern: 4-4-4 (inhale 4s, hold 4s, exhale 4s, no exhale hold)
  const pattern = { inhale: 4, inhaleHold: 4, exhale: 4, exhaleHold: 0 };

  // Countdown before starting
  useEffect(() => {
    if (!isCountingDown) return;
    if (countdown <= 0) {
      setIsCountingDown(false);
      setBreathPhase('inhale');
      setPhaseSecondsLeft(pattern.inhale);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, isCountingDown]);

  // Animate countdown progress ring — each tick advances by 1/3
  useEffect(() => {
    if (!isCountingDown) return;
    // When countdown=3, progress should already be 1/3 (first second ticking)
    // countdown=2 → 2/3, countdown=1 → 3/3
    const progress = (3 - countdown + 1) / 3;
    setCountdownProgress(Math.min(progress, 1));
  }, [countdown, isCountingDown]);

  // Per-phase second countdown (4, 3, 2, 1)
  useEffect(() => {
    if (isCountingDown || breathPhase === 'ready' || breathPhase === 'exhale_hold') return;
    const t = setInterval(() => {
      setPhaseSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [breathPhase, isCountingDown, cycleCount]);

  // Breathing cycle state machine
  useEffect(() => {
    if (isCountingDown || breathPhase === 'ready') return;

    const durations: Record<BreathPhaseLocal, number> = {
      inhale: pattern.inhale,
      inhale_hold: pattern.inhaleHold,
      exhale: pattern.exhale,
      exhale_hold: pattern.exhaleHold,
      ready: 0,
    };

    const nextPhase: Record<BreathPhaseLocal, BreathPhaseLocal> = {
      inhale: 'inhale_hold',
      inhale_hold: 'exhale',
      exhale: 'exhale_hold',
      exhale_hold: 'inhale',
      ready: 'inhale',
    };

    const dur = durations[breathPhase] * 1000;

    // Skip exhale_hold since it's 0
    if (breathPhase === 'exhale_hold') {
      const next = cycleCount + 1;
      if (next >= totalCycles) {
        if (!completedRef.current) {
          completedRef.current = true;
          setShowCompletion(true);
          // Import confetti dynamically
          import('canvas-confetti').then(({ default: confetti }) => {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#a78bfa', '#34d399', '#60a5fa', '#fbbf24'] });
          });
          setTimeout(() => onComplete(), 2500);
        }
        return;
      }
      setCycleCount(next);
      setBreathPhase('inhale');
      setPhaseSecondsLeft(pattern.inhale);
      return;
    }

    const t = setTimeout(() => {
      const np = nextPhase[breathPhase];
      setBreathPhase(np);
      const nextDur = durations[np];
      if (nextDur > 0) setPhaseSecondsLeft(nextDur);
    }, dur);

    return () => clearTimeout(t);
  }, [breathPhase, isCountingDown, cycleCount]);

  const phaseText = isCountingDown
    ? 'Get ready...'
    : breathPhase === 'inhale' ? 'Breathe in'
    : breathPhase === 'inhale_hold' ? 'Hold'
    : breathPhase === 'exhale' ? 'Breathe out'
    : breathPhase === 'exhale_hold' ? 'Hold'
    : 'Ready';

  const phaseDuration = isCountingDown ? 1
    : breathPhase === 'inhale' ? pattern.inhale
    : breathPhase === 'inhale_hold' ? pattern.inhaleHold
    : breathPhase === 'exhale' ? pattern.exhale
    : breathPhase === 'exhale_hold' ? pattern.exhaleHold
    : 1;

  // SVG progress ring for countdown
  const ringRadius = 152;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - countdownProgress);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: getImmersiveBgGradient(isCountingDown ? 'ready' : breathPhase, isCountingDown) }}>
      <ImmersiveParticles />

      {showCompletion ? (
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4 animate-scale-in">
            <span className="text-5xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Well done!</h2>
          <p className="text-white/70 text-sm">You completed your first breath</p>
        </div>
      ) : (
        <>
          {/* "Let's try" title during countdown */}
          {isCountingDown && (
            <p className="text-white/70 text-lg font-medium mb-6 tracking-wide animate-fade-in">
              Let's try 1 breath together
            </p>
          )}

          {!isCountingDown && (
            <p className="text-white/60 text-sm font-medium mb-8">
              {cycleCount + 1} / {totalCycles} cycles
            </p>
          )}

          {/* Wrapper for circle + progress ring */}
          <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
            {isCountingDown && (
              <svg
                className="absolute inset-0 -rotate-90"
                width="320" height="320"
                viewBox="0 0 320 320"
              >
                <circle cx="160" cy="160" r={ringRadius} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="4" />
                <circle cx="160" cy="160" r={ringRadius} fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="4" strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' }} />
              </svg>
            )}
            <ImmersiveBreathingCircle
              phase={isCountingDown ? 'ready' : breathPhase}
              phaseDuration={phaseDuration}
              phaseText={phaseText}
              countdown={isCountingDown ? countdown : undefined}
              isCountingDown={isCountingDown}
              countdownValue={isCountingDown ? countdown : undefined}
              phaseSecondsLeft={!isCountingDown ? phaseSecondsLeft : undefined}
            />
          </div>

          <p className="text-white/40 text-xs mt-8">4-4-4 pattern</p>
        </>
      )}
    </div>
  );
}

// ─── StarterRoutineScreen (Step-by-step reveal + celebrations) ──

function StarterRoutineScreen({ step, onNext }: Props) {
  const [phase, setPhase] = useState<DemoPhase>('intro');
  const [revealedCount, setRevealedCount] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  const [showBreathing, setShowBreathing] = useState(false);
  const [proLinkTransform, setProLinkTransform] = useState<{ emoji: string; toolEmoji: string; label: string } | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showMoodFeeling, setShowMoodFeeling] = useState(false);
  const [selectedMoodLabel, setSelectedMoodLabel] = useState('');
  const [selectedMoodValue, setSelectedMoodValue] = useState<string | null>(null);
  const [celebratingIdx, setCelebratingIdx] = useState<number | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const MOOD_IDX = 1;
  const BREATHE_IDX = 2;
  const COMPLETE_IDX = 4;

  const userTasks = STARTER_TASKS.map((t, i) => buildUserTask(t, i));

  // Cleanup timers on unmount
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  // Phase 1: Intro → Revealing → Viewing → Spotlight
  useEffect(() => {
    if (phase === 'intro') {
      addTimer(() => setPhase('revealing'), 400);
    }
  }, [phase]);

  // Staggered reveal
  useEffect(() => {
    if (phase !== 'revealing') return;
    if (revealedCount >= STARTER_TASKS.length) {
      addTimer(() => setPhase('viewing'), 300);
      return;
    }
    const t = addTimer(() => setRevealedCount(prev => prev + 1), 300);
    return () => clearTimeout(t);
  }, [phase, revealedCount]);

  // Viewing pause → ready-to-play animation → first spotlight
  useEffect(() => {
    if (phase === 'viewing') {
      addTimer(() => setPhase('ready-to-play'), 1200);
    } else if (phase === 'ready-to-play') {
      addTimer(() => setPhase('spotlight-app'), 2800);
    }
  }, [phase]);

  // Spotlight → Hint delays (not rushed)
  useEffect(() => {
    if (phase === 'spotlight-app') {
      addTimer(() => setPhase('hint-app'), 800);
    } else if (phase === 'spotlight-mood') {
      addTimer(() => setPhase('hint-mood'), 800);
    } else if (phase === 'spotlight-breathe') {
      addTimer(() => setPhase('hint-breathe'), 800);
    } else if (phase === 'spotlight-complete') {
      addTimer(() => setPhase('hint-complete'), 800);
    } else if (phase === 'victory') {
      // Big confetti burst for the victory screen
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.3 }, colors: ['#fbbf24', '#2dd4bf', '#a78bfa', '#f472b6', '#34d399'] });
      addTimer(() => {
        confetti({ particleCount: 50, spread: 60, origin: { x: 0.2, y: 0.5 }, colors: ['#fbbf24', '#a78bfa'] });
        confetti({ particleCount: 50, spread: 60, origin: { x: 0.8, y: 0.5 }, colors: ['#2dd4bf', '#f472b6'] });
      }, 600);
    }
  }, [phase]);

  // Celebration trigger helper
  const triggerCelebration = (taskIdx: number, nextPhase: DemoPhase) => {
    setCompletedIndices(prev => new Set(prev).add(taskIdx));
    setCelebratingIdx(taskIdx);
    // sound removed from onboarding
    haptic.success();
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.5 },
      colors: ['#2dd4bf', '#34d399', '#a78bfa', '#fbbf24'],
    });
    addTimer(() => {
      setCelebratingIdx(null);
      setPhase(nextPhase);
    }, 2500);
  };

  // Handlers
  const handleCheckApp = () => {
    if (phase !== 'hint-app' && phase !== 'spotlight-app') return;
    setPhase('celebrate-app');
    triggerCelebration(0, 'spotlight-mood');
  };

  const handleBreatheTap = () => {
    if (phase !== 'hint-breathe' && phase !== 'spotlight-breathe') return;
    setPhase('transition-breathe' as DemoPhase);
    setProLinkTransform({ emoji: '🫁', toolEmoji: '🌬️', label: 'Opening Breathe...' });
    addTimer(() => {
      setProLinkTransform(null);
      setShowBreathing(true);
    }, 2500);
  };

  const handleBreathingComplete = useCallback(() => {
    setShowBreathing(false);
    // Pause after breathing before celebration — let it breathe
    const t1 = setTimeout(() => {
      setPhase('celebrate-breathe');
      setCompletedIndices(prev => new Set(prev).add(BREATHE_IDX));
      setCelebratingIdx(BREATHE_IDX);
      // sound removed from onboarding
      haptic.success();
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.5 },
        colors: ['#2dd4bf', '#34d399', '#a78bfa', '#fbbf24'],
      });
      const t2 = setTimeout(() => {
        setCelebratingIdx(null);
        setPhase('spotlight-complete');
      }, 2500);
      timersRef.current.push(t2);
    }, 1200);
    timersRef.current.push(t1);
  }, []);

  const handleMoodTap = () => {
    if (phase !== 'hint-mood' && phase !== 'spotlight-mood') return;
    setPhase('transition-mood' as DemoPhase);
    setProLinkTransform({ emoji: '🌤️', toolEmoji: '🎭', label: 'Opening Mood Check-in...' });
    addTimer(() => {
      setProLinkTransform(null);
      setShowMoodPicker(true);
    }, 2500);
  };

  const handleMoodSelect = (moodValue: string) => {
    const moodLabel = MOODS.find(m => m.value === moodValue)?.label || moodValue;
    setSelectedMoodLabel(moodLabel);
    setSelectedMoodValue(moodValue);
    // Brief delay so user sees their selection highlighted before picker closes
    addTimer(() => {
      setShowMoodPicker(false);
      setSelectedMoodValue(null);
      setPhase('celebrate-mood');
      triggerCelebration(MOOD_IDX, 'feeling-mood');
    }, 600);
  };

  const handleFeelingBreatheTap = () => {
    setShowMoodFeeling(false);
    // Show task list with breathe spotlight first, then auto-open breathing
    addTimer(() => setPhase('spotlight-breathe'), 800);
  };

  const handleFeelingDismiss = () => {
    setShowMoodFeeling(false);
    addTimer(() => setPhase('spotlight-breathe'), 1200);
  };

  // Show feeling overlay when phase reaches feeling-mood
  useEffect(() => {
    if (phase === 'feeling-mood') {
      setShowMoodFeeling(true);
    }
  }, [phase]);

  const handleCheckComplete = () => {
    if (phase !== 'hint-complete' && phase !== 'spotlight-complete') return;
    setPhase('celebrate-complete');
    triggerCelebration(COMPLETE_IDX, 'victory');
  };

  // Which phases show overlay
  const showReadyToPlay = phase === 'ready-to-play';
  const showOverlay = phase.startsWith('spotlight') || phase.startsWith('hint') || phase.startsWith('celebrate') || phase === 'feeling-mood' || phase === 'victory' || phase === 'done';
  // Which task is spotlighted
  const spotlightIdx =
    phase.includes('app') ? 0 :
    phase.includes('mood') ? MOOD_IDX :
    phase.includes('breathe') ? BREATHE_IDX :
    phase.includes('complete') ? COMPLETE_IDX :
    -1;

  // Instruction text
  const instructionText =
    (phase === 'spotlight-app' || phase === 'hint-app') ? <><FluentEmoji emoji="👆" size={20} /> Tap the circle to complete your first task!</> :
    (phase === 'spotlight-mood' || phase === 'hint-mood') ? <><FluentEmoji emoji="🌤️" size={20} /> Now check in with your mood!</> :
    (phase === 'spotlight-breathe' || phase === 'hint-breathe') ? <><FluentEmoji emoji="🫁" size={20} /> Now tap the Breathe button to try it!</> :
    (phase === 'spotlight-complete' || phase === 'hint-complete') ? <><FluentEmoji emoji="✅" size={20} /> Tap to complete your onboarding!</> :
    phase === 'done' ? <><FluentEmoji emoji="✨" size={20} /> Tap Continue to keep going!</> :
    null;

  const MOODS = [
    { value: 'great', emoji: '😄', label: 'Great', bg: '#FEF08A' },
    { value: 'good', emoji: '🙂', label: 'Good', bg: '#BBF7D0' },
    { value: 'okay', emoji: '😐', label: 'Okay', bg: '#BFDBFE' },
    { value: 'not_great', emoji: '😔', label: 'Not Great', bg: '#E9D5FF' },
    { value: 'bad', emoji: '😢', label: 'Bad', bg: '#FECACA' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 flex flex-col px-6 pt-8 pb-4 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
        >
          <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center leading-tight relative z-40">
            Here's your first Reset
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <p className="text-[15px] text-gray-500 text-center mt-2 relative z-40">{step.subtitle}</p>
        </motion.div>

        {/* Instruction text — fixed-height container so it never shifts task cards */}
        <div className="relative mt-3 mb-6 h-6">
          <AnimatePresence>
            {instructionText && (
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 text-center text-[15px] text-white font-semibold z-40 flex items-center justify-center gap-1.5"
              >
                {instructionText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Task Cards */}
        <div className="space-y-3 relative">
          {/* "Ready to play" animated overlay */}
          <AnimatePresence>
            {showReadyToPlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1f3d]/90 backdrop-blur-md px-8"
              >
                {/* Pulsing play circle */}
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
                  className="relative mb-8"
                >
                  {/* Second outer ring */}
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute rounded-full border border-white/15"
                    style={{ width: 104, height: 104, top: -12, left: -12 }}
                  />
                  {/* Primary pulse ring */}
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute rounded-full bg-white/20"
                    style={{ width: 88, height: 88, top: -4, left: -4 }}
                  />
                  <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                    <motion.div
                      animate={{ x: [0, 2, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
                        <path d="M26 14.268a2 2 0 010 3.464L4 28.856a2 2 0 01-3-1.732V4.876a2 2 0 013-1.732L26 14.268z" fill="white" fillOpacity="0.9" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.45 }}
                  className="text-white text-[26px] font-extrabold tracking-tight text-center leading-tight"
                >
                  Let's try it out!
                </motion.h2>

                {/* Subtitle — structured as two lines */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                  className="mt-3 text-center"
                >
                  <p className="text-white/50 text-[15px] leading-relaxed">
                    Don't just list tasks. <span className="text-white/80 font-semibold">Automate them.</span>
                  </p>
                  <p className="text-white/50 text-[15px] leading-relaxed mt-0.5">
                    One tap <span className="text-white/90 font-bold">▶ Plays</span> your Tasks
                  </p>
                </motion.div>

                {/* Animated dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="flex gap-2 mt-8"
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ProLink Transform micro-interaction overlay */}
          <AnimatePresence>
            {proLinkTransform && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#1a1f3d]/85 backdrop-blur-md"
              >
                {/* Morphing icon container */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* Task emoji — shrinks and fades */}
                  <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 0.3, opacity: 0, rotate: -30 }}
                    transition={{ duration: 0.5, ease: 'easeIn' }}
                    className="absolute"
                  >
                    <FluentEmoji emoji={proLinkTransform.emoji} size={56} />
                  </motion.div>

                  {/* Expanding ring */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [0.5, 1.6, 2], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    className="absolute w-24 h-24 rounded-full border-2 border-white/40"
                  />

                  {/* Tool emoji — grows in */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: 30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, type: 'spring', stiffness: 200, damping: 12 }}
                    className="absolute"
                  >
                    <FluentEmoji emoji={proLinkTransform.toolEmoji} size={64} />
                  </motion.div>
                </div>

                {/* Label */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="text-white text-lg font-semibold mt-6 tracking-wide"
                >
                  {proLinkTransform.label}
                </motion.p>

                {/* "Pro Link" badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="mt-3 px-3 py-1 rounded-full bg-white/10 border border-white/20"
                >
                  <p className="text-white/70 text-xs font-medium tracking-wider">⚡ PRO LINK — One Tap Launch</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-30 bg-black/50 pointer-events-none"
            />
          )}

          {userTasks.map((task, i) => {
            const isCompleted = completedIndices.has(i);
            const isVisible = phase === 'intro' ? false : phase === 'revealing' ? i < revealedCount : true;
            const isSpotlighted = spotlightIdx === i && !phase.startsWith('celebrate');
            const isCelebrating = celebratingIdx === i;
            const showHintOnCircle = (phase === 'hint-app' && i === 0) || (phase === 'hint-complete' && i === COMPLETE_IDX);
            const showHintOnProCircle = (phase === 'hint-breathe' && i === BREATHE_IDX) || (phase === 'hint-mood' && i === MOOD_IDX);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : 20,
                }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative"
              >
                <div className={`relative ${isSpotlighted || isCelebrating ? 'z-40' : ''}`}>
                  {/* Intercept taps for breathe/mood */}
                  {(phase === 'hint-breathe' || phase === 'spotlight-breathe') && i === BREATHE_IDX && (
                    <button className="absolute inset-0 z-40 rounded-3xl" onClick={handleBreatheTap} />
                  )}
                  {(phase === 'hint-mood' || phase === 'spotlight-mood') && i === MOOD_IDX && (
                    <button className="absolute inset-0 z-40 rounded-3xl" onClick={handleMoodTap} />
                  )}

                  <div className={cn(
                    isSpotlighted || isCelebrating ? 'relative rounded-2xl shadow-2xl' : '',
                    isCelebrating && 'animate-ripple-wave'
                  )}>
                    <TaskCard
                      task={task}
                      date={new Date()}
                      isCompleted={isCompleted}
                      completedSubtaskIds={[]}
                      goalProgress={0}
                      onTap={undefined}
                    />
                    {/* Celebration emoji bounce overlay */}
                    {isCelebrating && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-50 animate-emoji-bounce">
                        <FluentEmoji emoji={STARTER_TASKS[i].emoji} size={36} />
                      </div>
                    )}
                  </div>

                  {/* Celebration SealCheck overlay */}
                  {isCelebrating && (
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 z-50">
                      <SealCheck className="w-10 h-10 text-teal-400 animate-seal-pop" showParticles />
                    </div>
                  )}

                  {/* Finger hint on completion circle (app task / complete task) */}
                  {showHintOnCircle && (
                    <>
                      <button
                        className="absolute top-0 right-0 w-16 h-full z-50"
                        onClick={i === 0 ? handleCheckApp : handleCheckComplete}
                      />
                      <div
                        className="pointer-events-none absolute z-[55] rounded-full animate-pulse"
                        style={{
                          top: '50%',
                          right: '10px',
                          width: '44px',
                          height: '44px',
                          transform: 'translateY(-50%)',
                          boxShadow: '0 0 0 4px hsl(var(--primary) / 0.5), 0 0 20px 8px hsl(var(--primary) / 0.2)',
                        }}
                      />
                      <div
                        className="pointer-events-none absolute z-[60]"
                        style={{
                          top: '-40px',
                          right: '6px',
                          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
                          animation: 'onboardingHandBounce 1.4s ease-in-out infinite',
                        }}
                      >
                        <FluentEmoji emoji="👇" size={48} />
                      </div>
                    </>
                  )}

                  {/* Finger hint on breathe/mood pro-link circle */}
                  {showHintOnProCircle && (
                    <>
                      <button
                        className="absolute top-0 right-0 w-16 h-full z-50"
                        onClick={i === BREATHE_IDX ? handleBreatheTap : handleMoodTap}
                      />
                      <div
                        className="pointer-events-none absolute z-[55] rounded-full animate-pulse"
                        style={{
                          top: '50%',
                          right: '10px',
                          width: '44px',
                          height: '44px',
                          transform: 'translateY(-50%)',
                          boxShadow: '0 0 0 4px hsl(var(--primary) / 0.5), 0 0 20px 8px hsl(var(--primary) / 0.2)',
                        }}
                      />
                      <div
                        className="pointer-events-none absolute z-[60]"
                        style={{
                          top: '-40px',
                          right: '6px',
                          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
                          animation: 'onboardingHandBounce 1.4s ease-in-out infinite',
                        }}
                      >
                        <FluentEmoji emoji="👇" size={48} />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Victory overlay — wow moment */}
      <AnimatePresence>
        {phase === 'victory' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-8"
            style={{
              background: 'radial-gradient(ellipse at center, #1a1f3d 0%, #0f1225 100%)',
            }}
          >
            {/* Floating particles background */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4 + (i % 3) * 3,
                  height: 4 + (i % 3) * 3,
                  left: `${10 + (i * 7) % 80}%`,
                  top: `${10 + (i * 11) % 80}%`,
                  background: ['#2dd4bf', '#a78bfa', '#fbbf24', '#34d399'][i % 4],
                  opacity: 0.15,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* Trophy / celebration emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              className="mb-4"
            >
              <FluentEmoji emoji="🏆" size={72} />
            </motion.div>

            {/* Glow ring behind trophy */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute rounded-full"
              style={{
                width: 120,
                height: 120,
                top: 'calc(50% - 120px)',
                background: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)',
              }}
            />

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-white text-[28px] font-extrabold tracking-tight text-center"
            >
              You crushed it!
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="text-white text-[15px] text-center mt-2 leading-relaxed"
            >
              Your first Reset is complete
            </motion.p>

            {/* Star rating */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="flex gap-1 mt-3"
            >
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-2xl">⭐</span>
              ))}
            </motion.div>

            {/* Stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex gap-3 mt-8"
            >
              {[
                { emoji: '✅', value: '5', label: 'Tasks Done' },
                { emoji: '🫁', value: '3', label: 'Breaths' },
                { emoji: '🌤️', value: '1', label: 'Check-in' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/[0.07] border border-white/10"
                >
                  <FluentEmoji emoji={stat.emoji} size={24} />
                  <span className="text-white text-lg font-bold mt-1">{stat.value}</span>
                  <span className="text-white text-[11px] font-medium">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Motivational line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="text-white text-[15px] text-center mt-6 font-bold leading-relaxed"
            >
              "80% of users report less stress and more happiness in their first 7 days of daily resets"
            </motion.p>

            {/* CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.4 }}
              className="mt-8 w-full"
            >
              <NavyButton onClick={onNext}>
                Let's Go! →
              </NavyButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA — only in done phase */}
      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-6 pb-6 pt-2 relative z-40"
        >
          <div className="relative">
            {/* Sparking glow rings */}
            <div className="absolute -inset-2 rounded-3xl animate-pulse" style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.2), rgba(52,211,153,0.3))',
              filter: 'blur(12px)',
            }} />
            <div className="absolute -inset-1 rounded-2xl" style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.1), rgba(52,211,153,0.15))',
              animation: 'sparkGlow 2s ease-in-out infinite alternate',
            }} />
            <div className="relative">
              <NavyButton onClick={onNext}>Continue</NavyButton>
            </div>
            <div
              className="pointer-events-none absolute z-[60]"
              style={{
                top: '-52px',
                left: '50%',
                transform: 'translateX(-50%)',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
                animation: 'onboardingHandBounce 1.4s ease-in-out infinite',
              }}
            >
              <FluentEmoji emoji="👇" size={48} />
            </div>
            {/* Floating sparkle particles */}
            {['✦', '✧', '✦', '✧'].map((s, idx) => (
              <span
                key={idx}
                className="absolute text-white/60 animate-pulse pointer-events-none"
                style={{
                  fontSize: '10px',
                  top: `${-8 + (idx % 2) * 60}px`,
                  left: `${15 + idx * 25}%`,
                  animationDelay: `${idx * 0.4}s`,
                  animationDuration: `${1.5 + idx * 0.3}s`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Breathing overlay */}
      {showBreathing && (
        <OnboardingBreathingOverlay onComplete={handleBreathingComplete} />
      )}

      {/* Mood picker overlay */}
      {showMoodPicker && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 w-full bg-white rounded-t-3xl px-6 pt-6 pb-10 animate-slide-up">
            <h2 className="text-xl font-bold text-center text-[#1a1f3d] mb-2">How are you feeling?</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Tap the one that fits best</p>
            <div className="flex justify-center gap-4 mb-5">
              {MOODS.slice(0, 3).map((mood) => {
                const isSelected = selectedMoodValue === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => !selectedMoodValue && handleMoodSelect(mood.value)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${isSelected ? 'scale-110' : selectedMoodValue ? 'opacity-40 scale-90' : 'active:scale-95'}`}
                  >
                    <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-shadow duration-300 ${isSelected ? 'ring-4 ring-emerald-400 shadow-lg' : ''}`} style={{ background: mood.bg }}>
                      <FluentEmoji emoji={mood.emoji} size={42} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center gap-4">
              {MOODS.slice(3).map((mood) => {
                const isSelected = selectedMoodValue === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => !selectedMoodValue && handleMoodSelect(mood.value)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${isSelected ? 'scale-110' : selectedMoodValue ? 'opacity-40 scale-90' : 'active:scale-95'}`}
                  >
                    <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-shadow duration-300 ${isSelected ? 'ring-4 ring-emerald-400 shadow-lg' : ''}`} style={{ background: mood.bg }}>
                      <FluentEmoji emoji={mood.emoji} size={42} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mood feeling message overlay — shows after mood selection */}
      {showMoodFeeling && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="absolute inset-0 bg-black/60" onClick={handleFeelingDismiss} />
          <div className="relative z-10 w-full bg-emerald-50 rounded-t-3xl px-6 pt-8 pb-10 animate-slide-up">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <FluentEmoji emoji={MOODS.find(m => m.label === selectedMoodLabel)?.emoji || '🌤️'} size={40} />
              </div>
              <h2 className="text-xl font-bold text-[#1a1f3d] mb-1">
                You feel {selectedMoodLabel.toLowerCase()}
              </h2>
               <p className="text-sm text-[#1a1f3d]">
                Tracking your mood helps you spot patterns and understand what lifts you up or drags you down.
              </p>
            </div>

            {/* Continue button */}
            <button
              onClick={handleFeelingDismiss}
              className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-base active:scale-[0.97] transition-all shadow-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes sparkGlow {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        @keyframes onboardingHandBounce {
          0%   { transform: translateY(0px); }
          40%  { transform: translateY(8px); }
          55%  { transform: translateY(3px); }
          70%  { transform: translateY(8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function ConfettiMessageScreen({ step, onNext }: Props) {
  useEffect(() => {
    // Fire multiple confetti bursts for a grand celebration
    const myConfetti = confetti.create(undefined, { resize: true, useWorker: true });
    
    // Initial big burst from center
    myConfetti({ particleCount: 150, spread: 100, origin: { y: 0.35, x: 0.5 }, colors: ['#a855f7', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#f43f5e'] });
    
    // Left burst
    setTimeout(() => myConfetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.5 }, colors: ['#fbbf24', '#a78bfa', '#f472b6'] }), 300);
    // Right burst
    setTimeout(() => myConfetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.5 }, colors: ['#34d399', '#60a5fa', '#fb923c'] }), 300);
    
    // Second wave
    setTimeout(() => myConfetti({ particleCount: 100, spread: 120, origin: { y: 0.4 }, colors: ['#fbbf24', '#a855f7', '#ec4899', '#3b82f6'] }), 700);
    
    // Stars and circles burst
    setTimeout(() => myConfetti({ particleCount: 60, spread: 80, origin: { y: 0.3 }, shapes: ['circle'], colors: ['#fbbf24', '#f59e0b', '#fcd34d'] }), 1100);
    
    // Final shower
    setTimeout(() => myConfetti({ particleCount: 120, spread: 160, origin: { y: 0.2 }, startVelocity: 30, colors: ['#a855f7', '#ec4899', '#fbbf24', '#34d399', '#60a5fa'] }), 1500);

    const t = setTimeout(onNext, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#f8f5ff] relative overflow-hidden">
      {/* Floating emoji particles */}
      {['🎉', '🥳', '✨', '🌟', '💫', '🎊', '⭐', '💜'].map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-bounce opacity-60"
          style={{
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${1.5 + (i % 3) * 0.5}s`,
          }}
        >
          {emoji}
        </span>
      ))}

      {/* Main text with scale-in animation */}
      <div className="animate-scale-in text-center z-10">
        <h1 className="text-3xl font-extrabold text-[#1a1f3d] mb-2">{step.title}</h1>
        <p className="text-3xl font-extrabold text-[#1a1f3d]">{step.subtitle}</p>
        <div className="mt-6 text-5xl animate-bounce">🎉</div>
      </div>
    </div>
  );
}

// ─── Personalized Plan Screen ──────────────────────────────────

interface PlanItem {
  emoji: string;
  label: string;
  description: string;
}

function getPersonalizedPlan(answers: OnboardingAnswers = {}): PlanItem[] {
  const items: PlanItem[] = [];

  // Sleep-based recommendations (mp-5)
  const sleep = answers['mp-5'];
  if (sleep === 'Less than 6 hours' || sleep === 'More than 10 hours') {
    items.push({ emoji: '😴', label: 'Sleep Optimization', description: 'Personalized sleep routines and bedtime reminders' });
  }

  // Wake-up difficulty (mp-6)
  const wakeUp = answers['mp-6'];
  if (wakeUp === '20-30 minutes' || wakeUp === 'More than 30 minutes') {
    items.push({ emoji: '🌅', label: 'Morning Kickstart Routine', description: 'Gentle wake-up routines with breathing exercises' });
  }

  // Energy level (mp-7)
  const energy = answers['mp-7'];
  if (energy && typeof energy === 'string' && energy.includes('Low')) {
    items.push({ emoji: '⚡', label: 'Energy Boost Program', description: 'Micro-habits and movement breaks to recharge your day' });
  } else if (energy && typeof energy === 'string' && energy.includes('Medium')) {
    items.push({ emoji: '🔋', label: 'Energy Maintenance', description: 'Smart scheduling to keep your energy steady' });
  }

  // Goals (mp-10)
  const goal = answers['mp-10'];
  if (goal === 'More productive') {
    items.push({ emoji: '📋', label: 'Productivity Planner', description: 'Smart task scheduling and focus sessions' });
  } else if (goal === 'More active') {
    items.push({ emoji: '🏃', label: 'Activity Challenges', description: 'Daily movement goals and workout reminders' });
  } else if (goal === 'More disciplined') {
    items.push({ emoji: '🎯', label: 'Discipline Builder', description: 'Streak tracking and accountability tools' });
  } else if (goal === 'More mindfulness') {
    items.push({ emoji: '🧘', label: 'Mindfulness Journey', description: 'Guided meditations and breathing exercises' });
  }

  // Distraction (mp-12)
  const distraction = answers['mp-12'];
  if (distraction === 'Easily distracted') {
    items.push({ emoji: '🧠', label: 'Focus Mode', description: 'Distraction-free focus sessions with gentle reminders' });
  }

  // Procrastination (mp-13)
  const procrastination = answers['mp-13'];
  if (procrastination && typeof procrastination === 'string' && procrastination.includes('want to change')) {
    items.push({ emoji: '🚀', label: 'Anti-Procrastination System', description: '2-minute rule tasks and momentum builders' });
  }

  // Support system (mp-14)
  const support = answers['mp-14'];
  if (support && typeof support === 'string' && (support.includes('Weak') || support.includes('isolated'))) {
    items.push({ emoji: '🤝', label: 'Community Support', description: 'Connect with like-minded people in group challenges' });
  }

  // Motivation (mp-15)
  const motivation = answers['mp-15'];
  if (motivation && typeof motivation === 'string' && motivation.includes('health')) {
    items.push({ emoji: '💚', label: 'Health Dashboard', description: 'Water tracking, mood logs, and wellness insights' });
  } else if (motivation && typeof motivation === 'string' && motivation.includes('goals')) {
    items.push({ emoji: '🏆', label: 'Goal Tracker', description: 'Visual progress tracking with milestones and rewards' });
  }

  // ADHD flag (mp-17)
  const adhd = answers['mp-17'];
  if (adhd === 'Yes' || adhd === 'I suspect I might') {
    items.push({ emoji: '🌈', label: 'ADHD-Friendly Tools', description: 'Simplified routines with visual cues and gentle nudges' });
  }

  // Always include these universal items
  items.push({ emoji: '📊', label: 'Weekly Progress Reports', description: 'Personalized insights on your habits and growth' });
  items.push({ emoji: '🔔', label: 'Smart Reminders', description: 'Timed to your schedule, not random notifications' });

  return items;
}

function PersonalizedPlanScreen({ step, onNext, answers }: { step: OnboardingStep; onNext: () => void; answers?: OnboardingAnswers }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const plan = getPersonalizedPlan(answers);

  useEffect(() => {
    if (visibleCount < plan.length) {
      const timer = setTimeout(() => setVisibleCount(prev => prev + 1), 200);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, plan.length]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background image area */}
      <div className="h-[240px] shrink-0 relative">
        <img src={meplusPlanMascot} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>
      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-2">
          <h1 className="text-[22px] font-extrabold text-[#1a1f3d] leading-snug mb-1">{step.title}</h1>
          <p className="text-sm text-[#1a1f3d]/60 mb-5">{step.subtitle}</p>

          <div className="space-y-3">
            {plan.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-2xl bg-[#f4f2ff] p-3.5 transition-all duration-500 ${
                  i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <FluentEmoji emoji={item.emoji} size={28} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-[#1a1f3d]">{item.label}</span>
                    <span className="text-green-500 text-base">✓</span>
                  </div>
                  <p className="text-xs text-[#1a1f3d]/50 leading-snug mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#fff8e1] p-3">
            <FluentEmoji emoji="✨" size={18} className="shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#1a1f3d]/60 leading-snug">
              These features are coming soon — your answers help us prioritize what matters most to you.
            </p>
          </div>
        </div>

        {/* Fixed button */}
        <div className="shrink-0 px-5 pt-2 pb-6">
          <div className="relative">
            <div className="absolute -top-3 right-2 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm border border-border whitespace-nowrap animate-bounce" style={{ animationDuration: '2s' }}>
              ⚡ Takes only 2 minutes!
            </div>
            <NavyButton onClick={onNext}>{step.buttonLabel || 'Get Started!'}</NavyButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Reset Prompt ────────────────────────────────────────

const DAILY_RESET_WHEEL = [
  { emoji: '📱', title: 'Open App', color: '#FFEDD5' },
  { emoji: '🌤️', title: 'Mood', color: '#FEF3C7' },
  { emoji: '🫁', title: 'Breathe', color: '#DBEAFE' },
  { emoji: '📝', title: 'Journal', color: '#F3E8FF' },
];

function LoopWheel({ size = 240 }: { size?: number } = {}) {
  // Traveling dot: tracks which node is currently "active"
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % DAILY_RESET_WHEEL.length);
      haptic.light?.();
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - 28;
  const nodeSize = 54;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
    >
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          key={`pulse-${activeIdx}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-14 h-14 rounded-full bg-white shadow-[0_8px_24px_-8px_rgba(26,31,61,0.35)] flex items-center justify-center"
        >
          {/* Soft pulsing halo */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full bg-emerald-300/40"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
          <FluentEmoji emoji="🔄" size={26} />
        </motion.div>
      </div>

      {/* Connecting ring */}
      <div
        className="absolute rounded-full border-2 border-dashed border-[#1a1f3d]/15"
        style={{ inset: 28 }}
      />

      {/* Animated connecting ring glow */}
      <svg
        className="absolute"
        style={{ inset: 26, width: size - 52, height: size - 52 }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50" cy="50" r="48"
          fill="none"
          stroke="url(#wheelGrad)"
          strokeWidth="2"
          strokeDasharray="12 8"
          style={{ animation: 'spinWheel 20s linear infinite' }}
        />
        <defs>
          <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>

      {/* Traveling glow dot — orbits the dashed ring, lands on the active node */}
      {(() => {
        const angle = (activeIdx * 90 - 90) * (Math.PI / 180);
        const dx = cx + radius * Math.cos(angle);
        const dy = cy + radius * Math.sin(angle);
        return (
          <motion.div
            aria-hidden
            className="absolute rounded-full bg-emerald-400 shadow-[0_0_24px_8px_rgba(45,212,191,0.55)]"
            style={{ width: 14, height: 14 }}
            animate={{ left: dx - 7, top: dy - 7 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          />
        );
      })()}

      {/* 4 task nodes positioned around the circle (clockwise: top, right, bottom, left) */}
      {DAILY_RESET_WHEEL.map((task, i) => {
        const angle = (i * 90 - 90) * (Math.PI / 180);
        const x = cx + radius * Math.cos(angle) - nodeSize / 2;
        const y = cy + radius * Math.sin(angle) - nodeSize / 2;
        const isActive = i === activeIdx;

        return (
          <motion.div
            key={task.title}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: isActive ? 1.14 : 1,
              y: isActive ? -3 : 0,
            }}
            transition={{
              delay: 0.3 + i * 0.12,
              type: 'spring',
              stiffness: 240,
              damping: 18,
            }}
            className="absolute flex flex-col items-center"
            style={{ left: x, top: y, width: nodeSize }}
          >
            <div
              className={`w-[50px] h-[50px] rounded-2xl flex items-center justify-center transition-shadow ${
                isActive
                  ? 'shadow-[0_10px_24px_-8px_rgba(26,31,61,0.45)]'
                  : 'shadow-[0_4px_12px_-6px_rgba(26,31,61,0.25)]'
              }`}
              style={{ backgroundColor: task.color }}
            >
              <FluentEmoji emoji={task.emoji} size={26} />
            </div>
            <span
              className={`text-[11px] font-bold mt-1 text-center leading-tight transition-colors ${
                isActive ? 'text-[#1a1f3d]' : 'text-[#1a1f3d]/60'
              }`}
            >
              {task.title}
            </span>
          </motion.div>
        );
      })}

      {/* Directional arrow SVGs between nodes (clockwise) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
      >
        {DAILY_RESET_WHEEL.map((_, i) => {
          const startDeg = i * 90 - 90 + 28;
          const endDeg = i * 90 - 90 + 62;
          const r = radius;

          const toRad = (d: number) => d * (Math.PI / 180);
          const sx = cx + r * Math.cos(toRad(startDeg));
          const sy = cy + r * Math.sin(toRad(startDeg));
          const ex = cx + r * Math.cos(toRad(endDeg));
          const ey = cy + r * Math.sin(toRad(endDeg));

          // Arrowhead pointing along the arc tangent
          const arrowAngle = toRad(endDeg + 90);
          const aLen = 5;
          const ax1 = ex + aLen * Math.cos(arrowAngle - 2.5);
          const ay1 = ey + aLen * Math.sin(arrowAngle - 2.5);
          const ax2 = ex + aLen * Math.cos(arrowAngle + 2.5);
          const ay2 = ey + aLen * Math.sin(arrowAngle + 2.5);

          return (
            <motion.g
              key={`arrow-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 0.9 + i * 0.12 }}
            >
              <path
                d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
                fill="none"
                stroke="#1a1f3d"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <polygon
                points={`${ex},${ey} ${ax1},${ay1} ${ax2},${ay2}`}
                fill="#1a1f3d"
              />
            </motion.g>
          );
        })}
      </svg>

      <style>{`
        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function DailyResetPromptScreen({ step, onNext }: Props) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    haptic.success();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2dd4bf', '#34d399', '#a78bfa', '#fbbf24', '#ec4899'],
    });
    
    setTimeout(onNext, 1200);
  };

  // Fire celebration effects on mount
  useEffect(() => {
    haptic.success();
    // Initial burst
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.35 },
      colors: ['#2dd4bf', '#34d399', '#a78bfa', '#fbbf24', '#ec4899'],
    });
    // Delayed side bursts
    const t = setTimeout(() => {
      confetti({ particleCount: 30, angle: 60, spread: 50, origin: { x: 0, y: 0.5 }, colors: ['#FFD700', '#FFA500', '#9370DB'] });
      confetti({ particleCount: 30, angle: 120, spread: 50, origin: { x: 1, y: 0.5 }, colors: ['#FFD700', '#FFA500', '#9370DB'] });
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#F4FBF6] via-white to-[#F5F0FF]">
      {/* ───── Visual: Living Cycle ───── */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-2 relative z-10 min-h-0">
        <FadeUp delay={0.15}>
          <LoopWheel size={260} />
        </FadeUp>
      </div>

      {/* ───── Text + CTA (RiloTeach pattern) ───── */}
      <div className="shrink-0 px-6 pb-8 relative z-10">
        <FadeUp>
          <h1 className="text-[26px] leading-[1.2] font-extrabold text-[#1a1f3d] text-center">
            3 tools. One daily routine.
          </h1>
        </FadeUp>
        <FadeUp delay={0.08}>
          <p className="mt-3 text-[15.5px] text-[#1a1f3d]/75 text-center leading-[1.45] font-medium">
            We picked the 3 most popular self-care tools.
          </p>
        </FadeUp>

        <FadeUp delay={0.16}>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#FFE8EC] text-[#C2185B] text-[13px] font-bold flex items-center gap-1.5">
              <span>💗</span> Mood
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-[13px] font-bold flex items-center gap-1.5">
              <span>🌬️</span> Breathe
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[13px] font-bold flex items-center gap-1.5">
              <span>📓</span> Journal
            </span>
          </div>
        </FadeUp>

        <FadeUp delay={0.24} className="mt-6">
          {!added ? (
            <NavyButton onClick={handleAdd}>Add to my daily routine</NavyButton>
          ) : (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2"
            >
              <SealCheck className="w-5 h-5" />
              Added to your routine!
            </motion.div>
          )}
          <button
            onClick={onNext}
            className="w-full py-3 text-sm text-[#1a1f3d]/50 font-medium active:opacity-60 mt-2"
          >
            Skip
          </button>
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Routine Ready Teaser ──────────────────────────────────────

function RoutineReadyTeaserScreen({ step, onNext }: Props) {
  const previewItems = [
    { emoji: '🌤️', title: 'Morning Check-in', time: '2 min', color: 'bg-[#FFF492]', locked: false },
    { emoji: '🫁', title: 'Breathing Exercise', time: '3 min', color: 'bg-[#E0FBB8]', locked: false },
    { emoji: '📝', title: 'Daily Journal', time: '5 min', color: 'bg-[#D7E9FF]', locked: true },
    { emoji: '🎯', title: 'Focus Session', time: '10 min', color: 'bg-[#F0E3FF]', locked: true },
    { emoji: '🌙', title: 'Evening Reflection', time: '3 min', color: 'bg-[#FFE6C9]', locked: true },
  ];

  return (
    <ScreenWrapper>
      <div className="flex-1 flex flex-col items-center justify-center">
        <FadeUp>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mb-5 mx-auto shadow-lg">
            <FluentEmoji emoji="🗓️" size={40} />
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2 whitespace-pre-line">{step.title}</h1>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="text-sm text-[#1a1f3d] text-center mb-6 max-w-[280px] mx-auto font-medium">{step.subtitle}</p>
        </FadeUp>

        {/* Routine preview — planner-style task cards */}
        <StaggerContainer staggerDelay={0.08} className="w-full space-y-2.5">
          {previewItems.map((item, i) => (
            <StaggerItem key={i}>
              <div
                className={cn(
                  'rounded-3xl pl-3 pr-4 py-3 flex items-center gap-2 transition-all',
                  item.color,
                  item.locked && 'blur-[2.5px] opacity-50 select-none'
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <FluentEmoji emoji={item.emoji} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-black/60">{item.time}</span>
                  <p className="text-[13px] font-semibold text-[#1a1f3d] truncate">{item.title}</p>
                </div>
                {item.locked ? (
                  <FluentEmoji emoji="🔒" size={18} />
                ) : (
                  <SealCheck className="w-6 h-6 text-teal-400" />
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.5}>
          <p className="text-xs text-gray-400 text-center mt-3">
            Sign up to unlock your full routine
          </p>
        </FadeUp>
      </div>

      <FadeUp delay={0.55} className="mt-auto pt-4 sticky bottom-0 bg-white pb-1">
        <NavyButton onClick={onNext}>{step.buttonLabel || 'See My Routine'}</NavyButton>
      </FadeUp>
    </ScreenWrapper>
  );
}

function DynamicSingleSelectScreen({ step, onNext, onAnswer, answers }: Props) {
  const cluster = useMemo(() => computeTopCluster(answers || {}), [answers]);
  const variant = step.variants?.find(v => v.cluster === cluster) || step.variants?.[0];
  
  if (!variant) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No variants configured</div>;
  }

  const handleSelect = (label: string) => {
    onAnswer?.(step.id, label);
    haptic.light();
    setTimeout(onNext, 350);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="shrink-0 relative" style={{ height: '40%' }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-y-auto overscroll-contain">
        <div className="px-5 pt-5 pb-5 flex flex-col flex-1" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
          <FadeUp>
            <h1 className="text-[22px] font-extrabold text-foreground mb-1">{variant.title}</h1>
          </FadeUp>
          <FadeUp delay={0.05}>
            <p className="text-sm text-muted-foreground mb-5">Choose the one that resonates most</p>
          </FadeUp>
          <StaggerContainer className="space-y-2.5 flex-1" staggerDelay={0.08}>
            {variant.options.map((opt) => (
              <StaggerItem key={opt.label}>
                <button
                  onClick={() => handleSelect(opt.label)}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-border bg-card text-left active:scale-[0.98] transition-all hover:border-primary/30"
                >
                  {opt.emoji && <OptionEmoji emoji={opt.emoji} size={24} />}
                  <span className="text-[15px] font-semibold text-foreground">{opt.label}</span>
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}
