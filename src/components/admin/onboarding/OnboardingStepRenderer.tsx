import { useState, useEffect, useCallback } from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';
import appIcon from '@/assets/app-icon.png';
import SealCheck from '@/components/app/SealCheck';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onMilestone?: (type: 'review' | 'notification' | 'discount-paywall') => void;
}

export function OnboardingStepRenderer({ step, onNext, onMilestone }: Props) {
  switch (step.type) {
    case 'welcome':
      return <WelcomeScreen step={step} onNext={onNext} />;
    case 'greeting':
      return <GreetingScreen step={step} onNext={onNext} />;
    case 'multi-select':
      return <MultiSelectScreen step={step} onNext={onNext} />;
    case 'single-select':
      return <SingleSelectScreen step={step} onNext={onNext} />;
    case 'single-select-descriptions':
      return <SingleSelectDescScreen step={step} onNext={onNext} />;
    case 'yes-no':
      return <YesNoScreen step={step} onNext={onNext} />;
    case 'do-you-want':
      return <DoYouWantScreen step={step} onNext={onNext} />;
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
      return <PersonalSummaryScreen step={step} onNext={onNext} />;
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
  // Laurel leaf SVG path for reuse
  const LaurelBranch = ({ flip = false }: { flip?: boolean }) => (
    <svg
      width="48" height="80" viewBox="0 0 48 80"
      className={`text-green-500 ${flip ? 'scale-x-[-1]' : ''}`}
      fill="currentColor"
    >
      <ellipse cx="18" cy="14" rx="10" ry="6" transform="rotate(-30 18 14)" opacity="0.85" />
      <ellipse cx="14" cy="28" rx="10" ry="6" transform="rotate(-15 14 28)" opacity="0.8" />
      <ellipse cx="12" cy="42" rx="10" ry="6" transform="rotate(0 12 42)" opacity="0.75" />
      <ellipse cx="14" cy="56" rx="10" ry="6" transform="rotate(15 14 56)" opacity="0.7" />
      <ellipse cx="18" cy="68" rx="9" ry="5" transform="rotate(25 18 68)" opacity="0.65" />
      <rect x="22" y="8" width="3" height="68" rx="1.5" opacity="0.5" transform="rotate(2 24 40)" />
    </svg>
  );

  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-b from-[#e8eaf6] via-[#edeef8] to-white">
      {/* App icon top-left */}
      <div className="absolute top-3 left-4 z-10">
        <img src={appIcon} alt="Simora" className="w-10 h-10 rounded-xl shadow-md" />
      </div>

      {/* Mascot image — top area */}
      {step.image ? (
        <div className="absolute inset-x-0 top-0 h-[55%]">
          <img src={step.image} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 45%' }} />
        </div>
      ) : (
        <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#d1d5f0] to-transparent" />
      )}

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-white rounded-t-[28px] flex flex-col items-center px-6 pb-5 pt-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* Title */}
        <h1 className="text-lg font-bold text-[#1a1f3d] text-center leading-snug mb-1">
          {step.title}
        </h1>

        {/* Stat highlight with laurel leaves */}
        {step.statHighlight && (
          <div className="flex items-center justify-center gap-1 my-1">
            <LaurelBranch />
            <span className="text-[32px] font-black text-[#1a1f3d] leading-none">
              {step.statHighlight}
            </span>
            <LaurelBranch flip />
          </div>
        )}

        {/* 5 stars */}
        <div className="flex items-center gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="#f5b100">
              <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21l-4-3.9 5.53-.8z" />
            </svg>
          ))}
        </div>

        {/* Stat badges row */}
        {step.statBadges && step.statBadges.length > 0 && (
          <div className="flex items-center justify-center gap-4 mb-4">
            {step.statBadges.map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <LaurelSmall />
                  <span className="text-[11px] font-semibold text-gray-500 text-center leading-tight">{badge.label}</span>
                  <LaurelSmall flip />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Get Started button */}
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
        >
          {step.buttonLabel || 'Get started'}
        </button>

        {/* Already a member */}
        {step.secondaryButtonLabel && (
          <button onClick={onNext} className="mt-3 text-sm text-gray-500 font-medium">
            Already a member? <span className="text-green-600 font-semibold">Sign in.</span>
          </button>
        )}
      </div>
    </div>
  );
}

function LaurelSmall({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="20" height="28" viewBox="0 0 20 28"
      className={`text-gray-400 ${flip ? 'scale-x-[-1]' : ''}`}
      fill="currentColor"
    >
      <ellipse cx="8" cy="5" rx="5" ry="3" transform="rotate(-25 8 5)" opacity="0.7" />
      <ellipse cx="6" cy="12" rx="5" ry="3" transform="rotate(-10 6 12)" opacity="0.6" />
      <ellipse cx="6" cy="19" rx="5" ry="3" transform="rotate(10 6 19)" opacity="0.5" />
      <ellipse cx="8" cy="25" rx="4" ry="2.5" transform="rotate(20 8 25)" opacity="0.4" />
      <rect x="10" y="3" width="1.5" height="23" rx="0.75" opacity="0.35" />
    </svg>
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

function MultiSelectScreen({ step, onNext }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const hasBg = !!step.illustrationLabel;

  if (hasBg) {
    return (
      <BottomSheetWrapper bgImage={meplusMascotBg}>
        <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
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

function SingleSelectScreen({ step, onNext }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const select = (i: number) => {
    setPicked(i);
    setTimeout(onNext, 400);
  };

  // Check if this step has an illustrationLabel (Me+ style with background)
  const hasBg = !!step.illustrationLabel;

  if (hasBg) {
    return (
      <BottomSheetWrapper bgImage={meplusMascotBg}>
        <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
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
          <h1 className="text-xl font-bold text-[#1a1f3d] mb-1">{step.title}</h1>
          <p className="text-base text-gray-500 mb-5">{step.subtitle}</p>
        </>
      ) : (
        <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
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

function SingleSelectDescScreen({ step, onNext }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const select = (i: number) => {
    setPicked(i);
    setTimeout(onNext, 400);
  };

  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
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

function YesNoScreen({ step, onNext }: Props) {
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
          <NavyButton onClick={onNext} className="flex-1">No</NavyButton>
          <NavyButton onClick={onNext} className="flex-1">Yes</NavyButton>
        </div>
      </div>
    </ScrollArea>
  );
}

function DoYouWantScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
      {step.image ? (
        <div className="flex-1 flex items-center justify-center">
          <img src={step.image} alt="" className="w-full max-w-[300px] object-contain" />
        </div>
      ) : (
        <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="flex-1" />
      )}
      <div className="mt-auto flex gap-3 pt-6">
        <button onClick={onNext} className="px-8 py-3.5 rounded-full border border-gray-300 text-sm font-medium text-[#1a1f3d] active:scale-[0.98] transition-all">
          {step.secondaryButtonLabel}
        </button>
        <button onClick={onNext} className="flex-1 py-3.5 rounded-full bg-[#1a1f3d] text-white font-semibold text-sm active:scale-[0.98] transition-all">
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-3">{step.statHighlight}</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MotivationalScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      {step.image ? (
        <div className="flex items-center justify-center mb-6">
          <img src={step.image} alt="" className="w-full max-w-[280px] object-contain" />
        </div>
      ) : step.illustrationLabel ? (
        <IllustrationPlaceholder label={step.illustrationLabel} className="h-44 mb-6" />
      ) : null}
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-xl font-bold text-[#1a1f3d] mb-3">{step.title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
      </div>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-2">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
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

function PersonalSummaryScreen({ step, onNext }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
      <div className="space-y-4 mb-6">
        {step.summaryBars?.map((bar, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-[#1a1f3d]">{bar.label}</span>
              <span className="text-xs text-gray-400">{bar.status}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-red-400 to-orange-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animated ? `${bar.value}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold text-[#1a1f3d] text-center mb-4">{step.description}</p>
      <div className="flex gap-2 justify-center mb-6">
        {step.statBadges?.map((b, i) => (
          <div key={i} className="bg-indigo-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-gray-400">{b.label}</p>
            <p className="text-xs font-semibold text-indigo-600">{b.value}</p>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-2">{step.title}</h1>
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
    step.pricingTiers?.findIndex(t => t.badge) ?? 0
  );

  return (
    <ScreenWrapper>
      <button onClick={onNext} className="self-end text-gray-400 text-lg mb-2 active:opacity-60">✕</button>
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
      <div className="space-y-3 mb-4">
        {step.pricingTiers?.map((tier, i) => (
          <button
            key={i}
            onClick={() => setSelectedTier(i)}
            className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
              i === selectedTier ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200'
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-2.5 right-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{tier.badge}</span>
            )}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-[#1a1f3d]">{tier.label}</p>
                <p className="text-xs text-gray-400">{tier.total}</p>
              </div>
              <p className="text-sm font-bold text-[#1a1f3d]">{tier.perWeek}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold text-[#1a1f3d] text-center mb-4">{step.subtitle}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
      <p className="text-[10px] text-gray-300 text-center mt-3">Terms & Conditions · Privacy Policy</p>
    </ScreenWrapper>
  );
}

function BeforeAfterScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
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
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-3">{step.title}</h1>
          {step.image ? (
            <div className="flex items-center justify-center mb-4">
              <img src={step.image} alt="" className="w-full max-w-[280px] object-contain" />
            </div>
          ) : (
            <IllustrationPlaceholder label={step.illustrationLabel || step.subtitle} className="h-36 mb-4" />
          )}
          <p className="text-xs text-gray-500 leading-relaxed mb-4">{step.description}</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
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
        <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
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
  return (
    <ScreenWrapper bg="bg-[#f5f0ff]">
      <div className="text-4xl mb-2">💜</div>
      <h1 className="text-2xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
      <ul className="space-y-3 mb-6">
        {step.options?.map((opt, i) => (
          <li key={i} className="text-base font-medium text-[#1a1f3d]">• {opt.label}</li>
        ))}
      </ul>
      <div className="bg-gray-100 rounded-2xl p-4 mb-2 h-28 flex items-center justify-center">
        <p className="text-sm text-gray-400">Sign your name using finger:</p>
      </div>
      <p className="text-xs text-gray-400 text-center mb-4">*Your signature will not be recorded</p>
      <div className="mt-auto">
        <button onClick={onNext} className="mx-auto block px-10 py-3 rounded-full bg-[#1a1f3d] text-white font-semibold text-sm">{step.buttonLabel}</button>
      </div>
    </ScreenWrapper>
  );
}

function DistressGridScreen({ step, onNext }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-5 whitespace-pre-line">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-3">{step.title}</h1>
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
      <h1 className="text-xl font-bold text-white text-center mb-3">{step.subtitle}</h1>
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
      <h1 className="text-xl font-bold text-white text-center mb-1">{step.title}</h1>
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
