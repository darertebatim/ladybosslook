import { useState, useEffect, useCallback } from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft } from 'lucide-react';
import { LazyImage } from '@/components/ui/LazyImage';

interface Props {
  step: OnboardingStep;
  onNext?: () => void;
}

export function OnboardingStepRenderer({ step, onNext }: Props) {
  switch (step.type) {
    case 'welcome': return <WelcomeScreen step={step} onNext={onNext} />;
    case 'greeting': return <GreetingScreen step={step} onNext={onNext} />;
    case 'multi-select': return <MultiSelectScreen step={step} onNext={onNext} />;
    case 'single-select': return <SingleSelectScreen step={step} onNext={onNext} />;
    case 'single-select-descriptions': return <SingleSelectDescScreen step={step} onNext={onNext} />;
    case 'yes-no': return <YesNoScreen step={step} onNext={onNext} />;
    case 'do-you-want': return <DoYouWantScreen step={step} onNext={onNext} />;
    case 'info-stat': return <InfoStatScreen step={step} onNext={onNext} />;
    case 'motivational': return <MotivationalScreen step={step} onNext={onNext} />;
    case 'notification-permission': return <NotificationScreen step={step} onNext={onNext} />;
    case 'results-chart': return <ResultsChartScreen step={step} onNext={onNext} />;
    case 'habit-loop': return <HabitLoopScreen step={step} onNext={onNext} />;
    case 'loading-testimonials': return <LoadingTestimonialsScreen step={step} onNext={onNext} />;
    case 'personal-summary': return <PersonalSummaryScreen step={step} onNext={onNext} />;
    case 'first-habit': return <FirstHabitScreen step={step} onNext={onNext} />;
    case 'breathing-prep': return <BreathingPrepScreen step={step} onNext={onNext} />;
    case 'breathing': return <BreathingScreen step={step} onNext={onNext} />;
    case 'breathing-done': return <BreathingDoneScreen step={step} onNext={onNext} />;
    case 'streak': return <StreakScreen step={step} onNext={onNext} />;
    case 'paywall': return <PaywallScreen step={step} onNext={onNext} />;
    case 'before-after': return <BeforeAfterScreen step={step} onNext={onNext} />;
    case 'science-backed': return <ScienceBackedScreen step={step} onNext={onNext} />;
    case 'rating': return <RatingScreen step={step} onNext={onNext} />;
    case 'home-screen': return <HomeScreen step={step} />;
    default:
      return <div className="flex items-center justify-center h-full text-sm text-gray-400">Unknown: {step.type}</div>;
  }
}

// ─── Shared Components ───────────────────────────────────────────

function NavyButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full py-3.5 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-sm active:scale-[0.98] transition-transform ${className}`}
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

function StepImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  if (!src) return null;
  return <LazyImage src={src} alt={alt} className={`rounded-2xl ${className}`} />;
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1">
      <span className="text-xs font-semibold text-[#1a1f3d]">9:41</span>
      <div className="flex gap-1 items-center">
        <div className="w-4 h-2.5 flex gap-px">
          <div className="w-0.5 h-1 bg-[#1a1f3d] rounded-sm self-end" />
          <div className="w-0.5 h-1.5 bg-[#1a1f3d] rounded-sm self-end" />
          <div className="w-0.5 h-2 bg-[#1a1f3d] rounded-sm self-end" />
          <div className="w-0.5 h-2.5 bg-[#1a1f3d] rounded-sm self-end" />
        </div>
        <span className="text-[8px] text-[#1a1f3d]">5G</span>
        <div className="w-5 h-2.5 border border-[#1a1f3d] rounded-sm relative">
          <div className="absolute inset-0.5 bg-[#1a1f3d] rounded-sm" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

function BackHeader({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center px-4 py-2">
      <ChevronLeft className={`h-5 w-5 ${dark ? 'text-white' : 'text-[#1a1f3d]'}`} />
    </div>
  );
}

function ScreenWrapper({ children, bg = 'bg-white', dark = false, noHeader = false, noPadding = false }: { 
  children: React.ReactNode; bg?: string; dark?: boolean; noHeader?: boolean; noPadding?: boolean 
}) {
  return (
    <div className={`h-full flex flex-col ${bg}`}>
      <StatusBar />
      {!noHeader && <BackHeader dark={dark} />}
      <ScrollArea className="flex-1">
        <div className={`flex flex-col min-h-[650px] ${noPadding ? '' : 'px-5 pb-6'}`}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Screen Implementations ──────────────────────────────────────

function WelcomeScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper noHeader>
      <div className="px-5 pb-6 flex flex-col flex-1 min-h-[650px]">
        <StepImage src={step.illustrationImage} alt="Welcome" className="h-48 mb-4" />
        <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-3 leading-tight">{step.title}</h1>
        <div className="flex justify-center mb-3">
          <span className="text-3xl font-black text-[#1a1f3d]">{step.statHighlight}</span>
        </div>
        <div className="flex gap-2 justify-center mb-8">
          {step.statBadges?.map((b, i) => (
            <span key={i} className="px-3 py-1.5 bg-amber-50 rounded-full text-xs font-medium text-amber-700">{b.value} {b.label}</span>
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
          <SecondaryButton>{step.secondaryButtonLabel}</SecondaryButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function GreetingScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper>
      <StepImage src={step.illustrationImage} alt="Greeting" className="h-56 mb-6" />
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center">{step.title}</h1>
      <p className="text-base text-gray-500 text-center mt-2 mb-8">{step.subtitle}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MultiSelectScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
      <div className="space-y-3 mb-6">
        {step.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
              selected.has(i)
                ? 'border-[#1a1f3d] bg-[#1a1f3d]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
            {selected.has(i) && <span className="text-[#1a1f3d] text-lg">✓</span>}
          </button>
        ))}
      </div>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function SingleSelectScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const handleSelect = (i: number) => {
    setSelected(i);
    setTimeout(() => onNext?.(), 400);
  };

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
            onClick={() => handleSelect(i)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
              selected === i
                ? 'border-[#1a1f3d] bg-[#1a1f3d]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
            <span className="text-sm font-medium text-[#1a1f3d]">{opt.label}</span>
          </button>
        ))}
      </div>
    </ScreenWrapper>
  );
}

function SingleSelectDescScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const handleSelect = (i: number) => {
    setSelected(i);
    setTimeout(() => onNext?.(), 400);
  };

  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
      <div className="space-y-3">
        {step.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              selected === i
                ? 'border-[#1a1f3d] bg-[#1a1f3d]/5'
                : 'border-gray-200 bg-white'
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

function YesNoScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const handleChoose = (choice: string) => {
    setChosen(choice);
    setTimeout(() => onNext?.(), 400);
  };

  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
      <StepImage src={step.illustrationImage} alt="Illustration" className="h-40 mb-4" />
      <p className="text-base text-[#1a1f3d] font-medium text-center mb-8">{step.description}</p>
      <div className="mt-auto flex gap-3">
        <button 
          onClick={() => handleChoose('no')}
          className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            chosen === 'no' ? 'bg-gray-200 text-gray-700' : 'border border-gray-200 text-gray-600'
          }`}
        >No</button>
        <button 
          onClick={() => handleChoose('yes')}
          className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            chosen === 'yes' ? 'bg-[#1a1f3d] text-white' : 'bg-[#1a1f3d] text-white'
          }`}
        >Yes</button>
      </div>
    </ScreenWrapper>
  );
}

function DoYouWantScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper>
      <p className="text-sm text-gray-400 mb-2">{step.title}</p>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.subtitle}</h1>
      <StepImage src={step.illustrationImage} alt="Illustration" className="h-48 mb-8" />
      <div className="mt-auto space-y-3">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function InfoStatScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <StepImage src={step.illustrationImage} alt="Stat illustration" className="h-36 mb-6" />
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-3">{step.statHighlight}</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MotivationalScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <StepImage src={step.illustrationImage} alt="Motivational" className="h-44 mb-6" />
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

function NotificationScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper>
      <StepImage src={step.illustrationImage} alt="Notification" className="h-40 mb-6" />
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      {step.subtitle && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 my-4 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#1a1f3d] mb-1">{step.subtitle}</p>
          <p className="text-xs text-gray-400">Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.</p>
          <div className="flex gap-2 mt-3 border-t pt-3">
            <button className="flex-1 py-2 text-xs font-medium text-blue-500">Don't Allow</button>
            <button className="flex-1 py-2 text-xs font-semibold text-blue-500 border-l" onClick={onNext}>Allow</button>
          </div>
        </div>
      )}
      <div className="mt-auto space-y-2">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function ResultsChartScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
      <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-2xl p-5 mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Your expectation</span>
          <span className="text-indigo-500 font-bold">Actually happen</span>
        </div>
        <div className="flex items-end gap-1 h-28">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-indigo-400 to-indigo-300 rounded-t transition-all duration-700 ease-out"
              style={{ height: animated ? `${Math.min(100, 8 + i * 8)}%` : '4%' }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Now</span>
          <span>Next year</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-4xl font-black text-indigo-500 transition-all duration-700 ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>{step.statHighlight}</span>
        <span className="text-sm text-gray-500">better</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function HabitLoopScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-2">{step.title}</h1>
      {step.subtitle && <p className="text-base font-semibold text-[#1a1f3d] mb-3">{step.subtitle}</p>}
      {step.illustrationImage ? (
        <StepImage src={step.illustrationImage} alt="Habit Loop" className="h-44 mb-4" />
      ) : (
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
      )}
      <p className="text-xs text-gray-500 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function LoadingTestimonialsScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => onNext?.(), 500);
      return () => clearTimeout(t);
    }
  }, [progress, onNext]);

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <ScreenWrapper bg="bg-[#fdf8f4]" noHeader>
      <div className="px-5 pb-6 flex flex-col flex-1 min-h-[650px]">
        <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2 mt-4">{step.title}</h1>
        <p className="text-sm text-gray-400 text-center mb-6">{step.subtitle}</p>
        <div className="flex justify-center mb-6">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="#6366f1" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-100"
            />
            <text x="50" y="55" textAnchor="middle" className="text-sm font-bold fill-[#1a1f3d]">{progress}%</text>
          </svg>
        </div>
        <div className="space-y-3 mt-auto">
          {step.testimonials?.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-3 flex gap-3 items-start shadow-sm" 
              style={{ opacity: progress > (i * 20) ? 1 : 0.3, transition: 'opacity 0.5s' }}>
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
      </div>
    </ScreenWrapper>
  );
}

function PersonalSummaryScreen({ step, onNext }: Props & { onNext?: () => void }) {
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

function FirstHabitScreen({ step, onNext }: Props & { onNext?: () => void }) {
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

function BreathingPrepScreen({ step, onNext }: Props & { onNext?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onNext?.(), 3000);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <ScreenWrapper bg="bg-[#1a1f3d]" dark noHeader>
      <div className="px-5 pb-6 flex-1 flex flex-col items-center justify-center">
        <StepImage src={step.illustrationImage} alt="Meditation" className="h-48 w-48 mb-8" />
        <h1 className="text-2xl font-bold text-white text-center">{step.title}</h1>
      </div>
    </ScreenWrapper>
  );
}

function BreathingScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (phase === 'in') { setPhase('hold'); return 2; }
          if (phase === 'hold') { setPhase('out'); return 3; }
          clearInterval(timer);
          setTimeout(() => onNext?.(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, onNext]);

  const phaseLabel = phase === 'in' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out';
  const scale = phase === 'in' ? 'scale-110' : phase === 'out' ? 'scale-90' : 'scale-100';

  return (
    <ScreenWrapper bg="bg-[#1a1f3d]" dark noHeader>
      <div className="px-5 pb-6 flex-1 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-300 mb-8">{step.title}</p>
        <div className={`w-40 h-40 rounded-full border-4 border-indigo-400/50 flex items-center justify-center mb-4 transition-transform duration-[2s] ${scale}`}>
          <div className="w-28 h-28 rounded-full bg-indigo-400/20 flex items-center justify-center animate-pulse">
            <span className="text-4xl font-bold text-white">{countdown}</span>
          </div>
        </div>
        <p className="text-lg font-semibold text-white">{phaseLabel}</p>
      </div>
    </ScreenWrapper>
  );
}

function BreathingDoneScreen({ step, onNext }: Props & { onNext?: () => void }) {
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

function StreakScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  return (
    <ScreenWrapper>
      <p className="text-sm text-gray-400 mb-2">Today</p>
      <div className="flex gap-1 mb-5">
        {days.map((d, i) => (
          <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs transition-all duration-500 ${animated ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'}`}
            style={{ transitionDelay: `${i * 100}ms` }}>
            <div>{d}</div>
            <div className="mt-1">{animated ? '✓' : '·'}</div>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center mb-4">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">{step.title}</p>
        <p className={`text-4xl font-black text-[#1a1f3d] mt-2 transition-all duration-700 ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>{step.statHighlight}</p>
        <p className="text-sm font-semibold text-[#1a1f3d] mt-1">{step.subtitle}</p>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function PaywallScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selectedTier, setSelectedTier] = useState<number>(
    step.pricingTiers?.findIndex(t => t.badge) ?? 0
  );

  return (
    <ScreenWrapper>
      <div className="flex justify-end mb-2">
        <button onClick={onNext} className="text-gray-300 text-xs">✕</button>
      </div>
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
      <div className="space-y-3 mb-4">
        {step.pricingTiers?.map((tier, i) => (
          <button
            key={i}
            onClick={() => setSelectedTier(i)}
            className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
              selectedTier === i
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-gray-200'
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

function BeforeAfterScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper>
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
      <p className="text-lg font-semibold text-[#1a1f3d] text-center mb-6">{step.subtitle}</p>
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
      <div className="mt-auto">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function ScienceBackedScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <ScreenWrapper>
      {step.checklistItems ? (
        <>
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-3">{step.title}</h1>
          <StepImage src={step.illustrationImage} alt={step.subtitle || 'Science'} className="h-36 mb-4" />
          <div className="space-y-2 mb-6">
            {step.checklistItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p className="text-xs text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <StepImage src={step.illustrationImage} alt="Science" className="h-36 mb-4" />
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

function RatingScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [rating, setRating] = useState(0);

  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
        {step.subtitle && <p className="text-sm text-gray-400 text-center mb-2">{step.subtitle}</p>}
        <p className="text-sm text-gray-500 text-center mb-4">{step.description}</p>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} className="text-2xl transition-transform active:scale-125">
              <span className={s <= rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto space-y-2">
        <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function HomeScreen({ step }: Props) {
  return (
    <div className="h-full bg-white flex flex-col">
      <StatusBar />
      {step.illustrationImage ? (
        <div className="flex-1 overflow-hidden">
          <LazyImage src={step.illustrationImage} alt="Home screen" className="w-full h-full" />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">App Home Screen</p>
        </div>
      )}
    </div>
  );
}
