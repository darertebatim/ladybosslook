import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';
import appIcon from '@/assets/app-icon.png';
import SealCheck from '@/components/app/SealCheck';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onMilestone?: (type: 'review' | 'notification' | 'discount-paywall') => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

export function OnboardingStepRenderer({ step, onNext, onMilestone, onAnswer, answers }: Props) {
  switch (step.type) {
    case 'welcome':
      return <WelcomeScreen step={step} onNext={onNext} />;
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
      className={`w-full py-3.5 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-sm active:scale-[0.98] transition-all ${disabled ? 'opacity-40' : ''} ${className}`}
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

function ScreenWrapper({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) {
  return (
    <ScrollArea className={`h-full ${bg}`}>
      <div className="flex flex-col h-full min-h-[700px] px-5 pt-[72px] pb-6">
        {children}
      </div>
    </ScrollArea>
  );
}

// ─── Screens ───────────────────────────────────────────────────

function WelcomeScreen({ step, onNext }: Props) {
  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-b from-purple-400 via-purple-300 to-purple-100">
      {/* App icon top-left */}
      <div className="absolute top-3 left-4 z-10">
        <img src={appIcon} alt="Simora" className="w-10 h-10 rounded-xl shadow-md" />
      </div>

      {/* Mascot image — top area, centered on mouth */}
      {step.image && (
        <div className="absolute inset-x-0 top-0 h-[58%]">
          <img src={step.image} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 45%' }} />
        </div>
      )}

      {/* Bottom sheet with rounded top */}
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-white rounded-t-[28px] flex flex-col items-center justify-end px-6 pb-5 pt-7 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
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

        <h1 className="text-[26px] font-extrabold text-[#1a1f3d] text-center mb-3 leading-tight relative z-10">{step.title}</h1>
        <p className="text-[17px] font-semibold text-[#1a1f3d] text-center mb-6 leading-relaxed max-w-[260px] whitespace-pre-line relative z-10">{step.subtitle}</p>
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative z-10"
        >
          {step.buttonLabel}
          <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
}

function GreetingScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <IllustrationPlaceholder label={step.illustrationLabel || 'Mascot'} className="h-56 mb-8" />
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center">{step.title}</h1>
      <p className="text-base text-gray-500 text-center mt-2 mb-8">{step.subtitle}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MultiSelectScreen({ step, onNext, onAnswer }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      // Report selected labels
      const labels = Array.from(next).map(idx => step.options?.[idx]?.label || '');
      onAnswer?.(step.id, labels);
      return next;
    });
  };

  const hasBg = !!step.illustrationLabel;

  if (hasBg) {
    return (
      <BottomSheetWrapper bgImage={meplusMascotBg}>
        <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
        <div className="space-y-3 mb-6">
          {step.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                selected.has(i) ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
              }`}
            >
              {opt.emoji && <FluentEmoji emoji={opt.emoji} size={24} />}
              <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
              {selected.has(i) && <SealCheck showParticles className="w-7 h-7 text-purple-500 animate-seal-pop" />}
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <NavyButton onClick={onNext} disabled={selected.size === 0}>{step.buttonLabel}</NavyButton>
        </div>
      </BottomSheetWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
      <div className="space-y-3 mb-6">
        {step.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
              selected.has(i) ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
            }`}
          >
            {opt.emoji && <FluentEmoji emoji={opt.emoji} size={24} />}
            <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
            {selected.has(i) && <SealCheck showParticles className="w-7 h-7 text-purple-500 animate-seal-pop" />}
          </button>
        ))}
      </div>
      <div className="mt-auto">
        <NavyButton onClick={onNext} disabled={selected.size === 0}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function BottomSheetWrapper({ children, bgImage }: { children: React.ReactNode; bgImage?: string }) {
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background image area - taller to show more */}
      <div className="h-[240px] shrink-0 relative">
        {bgImage ? (
          <img src={bgImage} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-purple-400 to-purple-300" />
        )}
      </div>
      {/* White bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 overflow-y-auto">
        <div className="px-5 pt-6 pb-6 flex flex-col min-h-full">
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
    return (
      <BottomSheetWrapper bgImage={meplusMascotBg}>
        <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
        <div className="space-y-3">
          {step.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                picked === i ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
              }`}
            >
              {opt.emoji && <FluentEmoji emoji={opt.emoji} size={28} />}
              <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
              {picked === i && <SealCheck showParticles className="w-7 h-7 text-purple-500 animate-seal-pop" />}
            </button>
          ))}
        </div>
      </BottomSheetWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {step.subtitle ? (
        <>
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
          <p className="text-base text-gray-500 mb-5">{step.subtitle}</p>
        </>
      ) : (
        <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
      )}
      <div className="space-y-3">
        {step.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
              picked === i ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
            }`}
          >
            {opt.emoji && <FluentEmoji emoji={opt.emoji} size={24} />}
            <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
            {picked === i && <SealCheck showParticles className="w-7 h-7 text-purple-500 animate-seal-pop" />}
          </button>
        ))}
      </div>
    </ScreenWrapper>
  );
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
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
      <div className="space-y-3">
        {step.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
              picked === i ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
            }`}
          >
            <span className="text-sm font-semibold text-[#1a1f3d]">{opt.label}</span>
            {opt.description && <p className="text-xs text-gray-400 mt-1">{opt.description}</p>}
          </button>
        ))}
      </div>
    </ScreenWrapper>
  );
}

function YesNoScreen({ step, onNext, onAnswer }: Props) {
  const handleAnswer = (val: string) => {
    onAnswer?.(step.id, val);
    onNext();
  };
  return (
    <ScrollArea className="h-full bg-white">
      <div className="flex flex-col h-full min-h-[700px] px-5 pt-14 pb-6">
        <h1 className="text-[22px] font-bold text-[#1a1f3d] text-center mb-5 leading-tight">{step.title}</h1>
        {/* 4:5 image card */}
        <div className="relative rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '4/5' }}>
          {step.image ? (
            <img src={step.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="w-full h-full" />
          )}
        </div>
        <div className="mt-auto flex gap-3">
          <NavyButton onClick={() => handleAnswer('No')} className="flex-1">No</NavyButton>
          <NavyButton onClick={() => handleAnswer('Yes')} className="flex-1">Yes</NavyButton>
        </div>
      </div>
    </ScrollArea>
  );
}

function DoYouWantScreen({ step, onNext, onAnswer }: Props) {
  const handleChoice = (val: string) => {
    onAnswer?.(step.id, val);
    onNext();
  };
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
      {step.image ? (
        <div className="flex-1 flex items-center justify-center">
          <img src={step.image} alt="" className="w-full max-w-[300px] object-contain" />
        </div>
      ) : (
        <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="flex-1" />
      )}
      <div className="mt-auto flex gap-3 pt-6">
        <button onClick={() => handleChoice('No')} className="px-8 py-3.5 rounded-full border border-gray-300 text-sm font-medium text-[#1a1f3d] active:scale-[0.98] transition-all">
          {step.secondaryButtonLabel}
        </button>
        <button onClick={() => handleChoice('Yes')} className="flex-1 py-3.5 rounded-full bg-[#1a1f3d] text-white font-semibold text-sm active:scale-[0.98] transition-all">
          {step.buttonLabel}
        </button>
      </div>
    </ScreenWrapper>
  );
}

function InfoStatScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <IllustrationPlaceholder label={step.illustrationLabel || 'Statistic'} className="h-36 mb-6" />
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-3">{step.statHighlight}</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MotivationalScreen({ step, onNext }: Props) {
  // Full-screen background mode when image is present and no description (page 35 style)
  const isFullScreenBg = step.image && !step.description;

  if (isFullScreenBg) {
    // Parse title to highlight "build momentum" in yellow
    const titleParts = step.title?.split(/(build momentum)/i) || [step.title];
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <img src={step.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-10 h-full">
          <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] text-[20px] font-extrabold text-white text-center leading-snug drop-shadow-lg">
            {titleParts.map((part, i) =>
              /build momentum/i.test(part) ? (
                <span key={i} className="text-yellow-300 font-extrabold">{part}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h1>
          <button
            onClick={onNext}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[70%] py-4 rounded-full bg-[#1a1f3d] text-white font-bold text-base active:scale-95 transition-transform shadow-xl"
          >
            {step.buttonLabel}
          </button>
        </div>
      </div>
    );
  }

  // Default motivational with stat + description
  const descMatch = step.description?.match(/^(\d+%)\s*(.*)/s);
  
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4 leading-tight whitespace-pre-line">{step.title}</h1>
      {step.image ? (
        <div className="flex items-center justify-center mb-5">
          <img src={step.image} alt="" className="w-full max-w-[300px] object-contain" />
        </div>
      ) : step.illustrationLabel ? (
        <IllustrationPlaceholder label={step.illustrationLabel} className="h-44 mb-5" />
      ) : null}
      {descMatch ? (
        <p className="text-[15px] text-gray-600 leading-relaxed text-center mb-4">
          <span className="text-[#1a1f3d] font-extrabold text-2xl">{descMatch[1]}</span>{' '}
          {descMatch[2]}
        </p>
      ) : step.description ? (
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{step.description}</p>
      ) : null}
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
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

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onNext, 500);
          return 100;
        }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [step.id]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      <p className="text-sm text-gray-400 text-center mb-6">{step.subtitle}</p>
      <div className="flex justify-center mb-6">
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle
            cx="48" cy="48" r="40"
            stroke="#6366f1"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100"
          />
        </svg>
        <span className="absolute mt-8 text-lg font-bold text-[#1a1f3d]">{progress}%</span>
      </div>
      <div className="space-y-3">
        {step.testimonials?.map((t, i) => (
          <div key={i} className="bg-white rounded-xl p-3 flex gap-3 items-start shadow-sm">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-500 shrink-0">
              {t.name[0]}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1a1f3d]">{t.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </ScreenWrapper>
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
    <ScreenWrapper>
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

      {/* Bottom stats */}
      <div className="flex items-start justify-center gap-4 mb-5 px-2">
        <div className="flex flex-col items-center text-center w-20">
          <span className="text-lg">🏅</span>
          <p className="text-[10px] text-gray-500 mt-1 leading-tight">{step.description}</p>
        </div>
        {step.statBadges?.map((b, i) => (
          <div key={i} className="flex flex-col items-center text-center w-24">
            <p className="text-xl font-extrabold text-[#1a1f3d]">{b.value}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{b.label}</p>
          </div>
        ))}
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
    if (cycles >= 3) { onNext(); return; }
    
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

function PaywallScreen({ step, onNext }: Props) {
  const [selectedTier, setSelectedTier] = useState(
    step.pricingTiers?.findIndex(t => t.badge?.includes('Trial') || t.badge?.includes('Free')) ?? 1
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = step.images || (step.image ? [step.image] : []);

  // Auto-swipe carousel
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <ScreenWrapper>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onNext} className="text-gray-400 text-lg active:opacity-60">✕</button>
        <button className="text-sm font-medium text-indigo-500 active:opacity-60">Restore</button>
      </div>
      <h1 className="text-[22px] font-extrabold text-[#1a1f3d] text-center mb-4 leading-tight">{step.title}</h1>

      {/* Auto-swiping image carousel */}
      {slides.length > 0 && (
        <div className="relative mb-5 overflow-hidden rounded-2xl -mx-5" style={{ height: 200 }}>
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((src, i) => (
              <img key={i} src={src} alt="" className="w-full h-full object-cover shrink-0" />
            ))}
          </div>
          {/* Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-4 bg-indigo-500' : 'w-1.5 bg-gray-300'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing tiers - centered 2-card layout */}
      <div className="flex justify-center gap-3 mb-4">
        {step.pricingTiers?.map((tier, i) => {
          const isSelected = i === selectedTier;
          return (
            <button
              key={i}
              onClick={() => setSelectedTier(i)}
              className={`relative rounded-2xl border-2 pt-5 pb-3 px-4 text-center transition-all active:scale-[0.97] w-[140px] ${
                isSelected ? 'border-indigo-500 bg-indigo-50/60' : 'border-gray-200 bg-white'
              }`}
            >
              {tier.badge && (
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  tier.badge.includes('Trial') || tier.badge.includes('Free') ? 'bg-indigo-500 text-white' : 'bg-purple-200 text-purple-700'
                }`}>{tier.badge}</span>
              )}
              <p className="text-base font-extrabold text-[#1a1f3d] leading-tight">{tier.label.split(' ')[0]}</p>
              <p className="text-[11px] text-[#1a1f3d] font-medium">{tier.label.split(' ').slice(1).join(' ')}</p>
              <p className={`text-[11px] text-gray-400 mt-1 ${tier.perWeek?.includes('/mo.') && tier.label.startsWith('1') ? 'line-through' : ''}`}>{tier.perWeek}</p>
              {tier.discount && (
                <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">{tier.discount}</span>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2">
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
          onClick={onNext}
          className="w-full py-4 rounded-full bg-[#1a1f3d] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {step.buttonLabel}
          <span className="text-lg">→</span>
        </button>
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-400">
        <a href="/sms-terms" className="underline">Terms of Use</a>
        <span>·</span>
        <a href="/privacy" className="underline">Privacy Policy</a>
      </div>
    </ScreenWrapper>
  );
}

function BeforeAfterScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
      <p className="text-lg font-semibold text-[#1a1f3d] text-center mb-5">{step.subtitle}</p>
      {step.image ? (
        <div className="flex-1 flex items-center justify-center mb-6">
          <img src={step.image} alt="" className="w-full max-w-[300px] object-contain" />
        </div>
      ) : (
        <div className="flex gap-3 mb-6">
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

function ScienceBackedScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      {step.subtitle ? (
        <>
          <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4 leading-tight">{step.title}</h1>
          {step.image ? (
            <div className="flex items-center justify-center mb-5">
              <img src={step.image} alt="" className="w-full max-w-[300px] object-contain" />
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
                  of Simora users have accomplished at least one goal and built healthy habits.
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

function WelcomeAboardScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-gradient-to-b from-indigo-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
        <p className="text-lg font-semibold text-indigo-500 text-center mb-2">{step.subtitle}</p>
        <p className="text-sm text-gray-500 text-center mb-6">{step.description}</p>
        <IllustrationPlaceholder label={step.illustrationLabel || 'Celebration'} className="w-40 h-40" />
      </div>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
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
      <div className="bg-gray-100 rounded-2xl p-3 mb-2">
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
    </ScreenWrapper>
  );
}

function DistressGridScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-5 whitespace-pre-line">{step.title}</h1>
      {step.image ? (
        <div className="flex-1 flex items-center justify-center mb-6">
          <img src={step.image} alt="" className="w-full max-w-[300px] object-contain" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
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
      <h1 className="text-2xl font-extrabold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
      {step.image ? (
        <div className="flex items-center justify-center mb-4">
          <img src={step.image} alt="" className="w-full max-w-[280px] object-contain rounded-2xl" />
        </div>
      ) : (
        <IllustrationPlaceholder label={step.illustrationLabel || 'Brain comparison'} className="h-40 mb-4" />
      )}
      <div className="bg-gray-50 rounded-2xl p-4 mb-4">
        <p className="text-sm font-bold text-[#1a1f3d] mb-3">Me+ can help ADHD:</p>
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

function ConfettiMessageScreen({ step, onNext }: Props) {
  useEffect(() => { const t = setTimeout(onNext, 2500); return () => clearTimeout(t); }, []);
  return (
    <ScreenWrapper bg="bg-[#f8f5ff]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-[#1a1f3d] text-center">{step.title}</h1>
        <p className="text-2xl font-bold text-[#1a1f3d] text-center">{step.subtitle}</p>
      </div>
    </ScreenWrapper>
  );
}
