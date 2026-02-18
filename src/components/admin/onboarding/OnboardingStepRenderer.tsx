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

function StatusBar({ light = false }: { light?: boolean }) {
  const color = light ? 'text-white' : 'text-[#1a1f3d]';
  const fill = light ? 'bg-white' : 'bg-[#1a1f3d]';
  const border = light ? 'border-white' : 'border-[#1a1f3d]';
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
      <span className={`text-xs font-semibold ${color}`}>9:41</span>
      <div className="flex gap-1 items-center">
        <div className="w-4 h-2.5 flex gap-px">
          <div className={`w-0.5 h-1 ${fill} rounded-sm self-end`} />
          <div className={`w-0.5 h-1.5 ${fill} rounded-sm self-end`} />
          <div className={`w-0.5 h-2 ${fill} rounded-sm self-end`} />
          <div className={`w-0.5 h-2.5 ${fill} rounded-sm self-end`} />
        </div>
        <span className={`text-[8px] ${color}`}>5G</span>
        <div className={`w-5 h-2.5 border ${border} rounded-sm relative`}>
          <div className={`absolute inset-0.5 ${fill} rounded-sm`} style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

function BackHeader({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center px-4 py-2 shrink-0">
      <div className={`w-8 h-8 rounded-full ${dark ? 'bg-white/20' : 'bg-gray-100'} flex items-center justify-center`}>
        <ChevronLeft className={`h-4 w-4 ${dark ? 'text-white' : 'text-[#1a1f3d]'}`} />
      </div>
    </div>
  );
}

function ProgressBar({ value = 50 }: { value?: number }) {
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full mx-5 mb-3 shrink-0" style={{ width: 'calc(100% - 40px)' }}>
      <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

// ─── Screen Implementations ──────────────────────────────────────

// Page 1: Welcome - full-bleed light blue bg, illustration top 60%, stars, laurel badges
function WelcomeScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[#e8f4f8]">
      <StatusBar />
      {/* Full-bleed illustration top 55% */}
      <div className="flex-[0_0_55%] flex items-center justify-center overflow-hidden px-4">
        {step.illustrationImage && (
          <LazyImage src={step.illustrationImage} alt="Welcome" className="w-full h-full object-contain" />
        )}
      </div>
      {/* Bottom content */}
      <div className="flex-1 flex flex-col px-6 pb-6">
        <h1 className="text-lg font-bold text-[#1a1f3d] text-center leading-tight mb-2">{step.title}</h1>
        {/* Star rating + stat */}
        <div className="flex items-center justify-center gap-1 mb-1">
          {[1,2,3,4,5].map(i => (
            <span key={i} className="text-amber-400 text-sm">★</span>
          ))}
        </div>
        <p className="text-center text-sm font-black text-[#1a1f3d] mb-3">{step.statHighlight}</p>
        {/* Laurel badges */}
        <div className="flex gap-2 justify-center mb-4">
          {step.statBadges?.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <span className="text-lg">{b.value}</span>
              </div>
              <span className="text-[9px] font-medium text-[#1a1f3d] text-center leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
          <SecondaryButton>{step.secondaryButtonLabel}</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

// Pages 2-3: Greeting - full-screen background illustration, text overlay, button pinned to bottom
function GreetingScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full relative">
      {/* Full-screen background */}
      {step.illustrationImage && (
        <LazyImage src={step.illustrationImage} alt="Greeting" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col">
        <StatusBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="text-3xl font-bold text-[#1a1f3d] text-center">{step.title}</h1>
          {step.subtitle && <p className="text-lg text-gray-600 text-center mt-2">{step.subtitle}</p>}
        </div>
        <div className="px-6 pb-8">
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </div>
    </div>
  );
}

// Pages 4-5: Multi-select - illustration top ~40%, progress bar, gray-fill pill options
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
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <BackHeader />
      {/* Illustration top section */}
      {step.illustrationImage && (
        <div className="flex-[0_0_35%] overflow-hidden px-4 flex items-center justify-center">
          <LazyImage src={step.illustrationImage} alt="Focus" className="w-full h-full object-contain" />
        </div>
      )}
      <ProgressBar value={40} />
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6">
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
          <div className="space-y-2.5">
            {step.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                  selected.has(i)
                    ? 'bg-[#1a1f3d]/10 ring-2 ring-[#1a1f3d]'
                    : 'bg-gray-100'
                }`}
              >
                {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
                <span className="text-sm font-medium text-[#1a1f3d] flex-1">{opt.label}</span>
                {selected.has(i) && <span className="text-[#22c55e] text-base font-bold">✓</span>}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div className="mt-5">
              <NavyButton onClick={onNext}>{step.buttonLabel || 'Continue'}</NavyButton>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Pages 6-8: Yes/No - large illustration card with caption at bottom, two navy buttons
function YesNoScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const handleChoose = (choice: string) => {
    setChosen(choice);
    setTimeout(() => onNext?.(), 400);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <BackHeader />
      <div className="flex-1 flex flex-col px-5 pb-6">
        <h1 className="text-lg font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
        {/* Large illustration card with text overlay at bottom */}
        <div className="flex-1 relative rounded-2xl overflow-hidden mb-5">
          {step.illustrationImage && (
            <LazyImage src={step.illustrationImage} alt="Illustration" className="w-full h-full object-cover" />
          )}
          {/* Text at bottom of card */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
            <p className="text-white text-sm font-medium leading-snug">"{step.description}"</p>
          </div>
        </div>
        {/* Two equal navy buttons */}
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => handleChoose('no')}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
              chosen === 'no' ? 'bg-[#1a1f3d] text-white' : 'bg-[#1a1f3d] text-white'
            }`}
          >No</button>
          <button 
            onClick={() => handleChoose('yes')}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
              chosen === 'yes' ? 'bg-[#1a1f3d] text-white' : 'bg-[#1a1f3d] text-white'
            }`}
          >Yes</button>
        </div>
      </div>
    </div>
  );
}

// Pages 9-11: Do-You-Want - cream bg, large illustration card, asymmetric buttons
function DoYouWantScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[#fdf8f4]">
      <StatusBar />
      <BackHeader />
      <div className="flex-1 flex flex-col px-5 pb-6">
        <h1 className="text-sm text-gray-400 text-center mb-1">{step.title}</h1>
        <p className="text-xl font-bold text-[#1a1f3d] text-center mb-4">{step.subtitle}</p>
        {/* Large illustration card with subtitle embedded */}
        <div className="flex-1 relative rounded-2xl overflow-hidden mb-5">
          {step.illustrationImage && (
            <LazyImage src={step.illustrationImage} alt="Illustration" className="w-full h-full object-cover" />
          )}
        </div>
        {/* Asymmetric buttons - No smaller, CTA wider */}
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={onNext}
            className="flex-[0.4] py-3.5 rounded-2xl text-sm font-semibold border border-gray-300 text-gray-500"
          >{step.secondaryButtonLabel || 'No'}</button>
          <NavyButton onClick={onNext} className="flex-[0.6]">{step.buttonLabel}</NavyButton>
        </div>
      </div>
    </div>
  );
}

// Pages 14-18: Single select - gray-fill no-border options, auto-advance
function SingleSelectScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const handleSelect = (i: number) => {
    setSelected(i);
    setTimeout(() => onNext?.(), 400);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <BackHeader />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6">
          {step.subtitle ? (
            <>
              <h1 className="text-lg font-bold text-[#1a1f3d] mb-1">{step.title}</h1>
              <p className="text-sm text-gray-400 mb-5">{step.subtitle}</p>
            </>
          ) : (
            <h1 className="text-lg font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
          )}
          <div className="space-y-2.5">
            {step.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                  selected === i
                    ? 'bg-[#1a1f3d]/10 ring-2 ring-[#1a1f3d]'
                    : 'bg-gray-100'
                }`}
              >
                {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
                <span className="text-sm font-medium text-[#1a1f3d]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Page 21, 25, 31: Single select with descriptions - gray-fill no-border
function SingleSelectDescScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const handleSelect = (i: number) => {
    setSelected(i);
    setTimeout(() => onNext?.(), 400);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <BackHeader />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6">
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
          <div className="space-y-2.5">
            {step.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selected === i
                    ? 'bg-[#1a1f3d]/10 ring-2 ring-[#1a1f3d]'
                    : 'bg-gray-100'
                }`}
              >
                <span className="text-sm font-semibold text-[#1a1f3d]">{opt.label}</span>
                {opt.description && <p className="text-xs text-gray-400 mt-1">{opt.description}</p>}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Page 19, 32: Info stat - full-bleed illustration top half, colored bottom, stat text
function InfoStatScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[#fdf0f5]">
      {/* Full-bleed illustration top half */}
      <div className="flex-[0_0_50%] relative overflow-hidden">
        <StatusBar />
        {step.illustrationImage && (
          <LazyImage src={step.illustrationImage} alt="Stat illustration" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      {/* Bottom content with lavender/pink bg */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-6">
        <h1 className="text-lg font-bold text-[#1a1f3d] mb-3 leading-snug">
          <span className="text-[#8b5cf6]">{step.statHighlight?.split(' ').slice(0, 3).join(' ')}</span>{' '}
          {step.statHighlight?.split(' ').slice(3).join(' ')}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{step.description}</p>
        <div className="mt-auto">
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </div>
    </div>
  );
}

// Page 22, 47: Motivational - full-bleed illustration top, gradient bottom, text with highlights
function MotivationalScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[#e8f4f8]">
      {/* Full-bleed illustration top half */}
      <div className="flex-[0_0_50%] relative overflow-hidden">
        <StatusBar />
        {step.illustrationImage && (
          <LazyImage src={step.illustrationImage} alt="Motivational" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      {/* Bottom content */}
      <div className="flex-1 flex flex-col px-6 pt-5 pb-6">
        <h1 className="text-xl font-bold text-[#1a1f3d] mb-3 leading-snug">{step.title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
        <div className="mt-auto">
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </div>
    </div>
  );
}

// Pages 23-24: Notification - larger illustration, iOS dialog simulation
function NotificationScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-white relative">
      <StatusBar />
      <BackHeader />
      <div className="flex-1 flex flex-col px-5 pb-6">
        {/* Illustration */}
        {step.illustrationImage && (
          <div className="flex-[0_0_40%] flex items-center justify-center mb-4">
            <LazyImage src={step.illustrationImage} alt="Notification" className="h-full object-contain" />
          </div>
        )}
        <h1 className="text-lg font-bold text-[#1a1f3d] text-center mb-4">{step.title}</h1>
        <div className="mt-auto space-y-2">
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
          <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
        </div>
      </div>
      {/* iOS notification dialog overlay */}
      {step.subtitle && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 px-8">
          <div className="bg-white rounded-2xl w-full shadow-xl overflow-hidden">
            <div className="p-5 text-center">
              <p className="text-sm font-semibold text-[#1a1f3d] mb-1">"{step.subtitle}"</p>
              <p className="text-xs text-gray-400 leading-relaxed">Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button className="flex-1 py-3 text-sm font-medium text-blue-500 border-r border-gray-200" onClick={onNext}>Don't Allow</button>
              <button className="flex-1 py-3 text-sm font-semibold text-blue-500" onClick={onNext}>Allow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pages 26-27: Results chart - green/mint bg, line chart (flat gray vs exponential green)
function ResultsChartScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  // SVG line chart data
  const width = 280;
  const height = 120;
  const padding = 10;
  // Flat gray line (your expectation)
  const grayPoints = Array.from({ length: 12 }, (_, i) => ({
    x: padding + (i / 11) * (width - 2 * padding),
    y: height - padding - 20,
  }));
  // Exponential green line (actually happen)
  const greenPoints = Array.from({ length: 12 }, (_, i) => ({
    x: padding + (i / 11) * (width - 2 * padding),
    y: height - padding - 10 - (Math.pow(1.35, i) / Math.pow(1.35, 11)) * (height - 2 * padding - 20),
  }));
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="h-full flex flex-col bg-[#f0f9f0]">
      <StatusBar />
      <BackHeader />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{step.title}</p>
          {/* Line chart */}
          <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm">
            <div className="flex justify-between text-[10px] text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-gray-300 rounded" />
                <span>Your expectation</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-[#22c55e] rounded" />
                <span className="text-[#22c55e] font-semibold">Actually happen</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
              {/* Grid lines */}
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1={padding} x2={width - padding} y1={padding + i * 30} y2={padding + i * 30} stroke="#f0f0f0" strokeWidth="1" />
              ))}
              {/* Gray flat line */}
              <path d={toPath(grayPoints)} fill="none" stroke="#d1d5db" strokeWidth="2" strokeDasharray="4 4" />
              {/* Green exponential line */}
              <path 
                d={toPath(greenPoints)} 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{ 
                  strokeDasharray: animated ? '0' : '1000',
                  strokeDashoffset: animated ? '0' : '1000',
                }}
              />
              {/* Green fill area */}
              <path 
                d={`${toPath(greenPoints)} L${width - padding},${height - padding} L${padding},${height - padding} Z`}
                fill="url(#greenGradient)"
                opacity={animated ? 0.15 : 0}
                className="transition-opacity duration-1000"
              />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Now</span>
              <span>Next year</span>
            </div>
          </div>
          {/* Stat text */}
          <p className="text-lg font-bold text-[#1a1f3d] mb-2">
            Reach a <span className="text-[#22c55e] text-3xl font-black">{step.statHighlight}</span> better you
          </p>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">{step.description}</p>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Pages 28-29: Habit loop - illustration or animated diagram
function HabitLoopScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <BackHeader />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6">
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-2">{step.title}</h1>
          {step.subtitle && <p className="text-sm font-semibold text-[#1a1f3d] mb-4">{step.subtitle}</p>}
          {step.illustrationImage ? (
            <div className="mb-4 rounded-2xl overflow-hidden">
              <LazyImage src={step.illustrationImage} alt="Habit Loop" className="w-full h-48 object-contain" />
            </div>
          ) : (
            /* Circular habit loop diagram */
            <div className="bg-gray-50 rounded-2xl p-6 mb-4 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="86 260" strokeLinecap="round" transform="rotate(-90 80 80)" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="86 260" strokeLinecap="round" transform="rotate(0 80 80)" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="86 260" strokeLinecap="round" transform="rotate(90 80 80)" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="86 260" strokeLinecap="round" transform="rotate(180 80 80)" />
                </svg>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Cue</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Craving</div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Response</div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Reward</div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-500">Habit<br/>Loop</div>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 leading-relaxed mb-6">{step.description}</p>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Pages 34-35: Loading - orange ring, orange title, horizontal testimonial cards, cream bg
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
    <div className="h-full flex flex-col bg-[#fdf8f4]">
      <StatusBar />
      <div className="flex-1 flex flex-col px-5 pb-4 pt-4">
        {/* Orange progress ring */}
        <div className="flex justify-center mb-4">
          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f5e6d3" strokeWidth="5" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-100"
            />
            <text x="50" y="55" textAnchor="middle" className="text-sm font-bold" fill="#f59e0b">{progress}%</text>
          </svg>
        </div>
        <h1 className="text-lg font-bold text-[#f59e0b] text-center mb-1">{step.title}</h1>
        <p className="text-xs text-gray-400 text-center mb-4">{step.subtitle}</p>
        {/* Horizontal scrolling testimonials */}
        <div className="overflow-x-auto -mx-5 px-5 mb-4">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {step.testimonials?.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm min-w-[140px] max-w-[160px]" 
                style={{ opacity: progress > (i * 20) ? 1 : 0.3, transition: 'opacity 0.5s' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600 shrink-0">
                    {t.name[0]}
                  </div>
                  <p className="text-[10px] font-semibold text-[#1a1f3d]">{t.name}</p>
                </div>
                <p className="text-[10px] text-gray-400 leading-snug">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Illustration at bottom */}
        {step.illustrationImage && (
          <div className="mt-auto flex justify-center">
            <LazyImage src={step.illustrationImage} alt="Loading" className="h-36 object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

// Page 36: Personal summary - gradient bg, yellow pill bars, laurel badges
function PersonalSummaryScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  const barEmojis = ['💪', '🧘', '⚡'];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#e8f4f8] to-[#fdf0f5]">
      <StatusBar />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 pt-2">
          <h1 className="text-lg font-bold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
          {/* Yellow/gold pill bars */}
          <div className="space-y-3 mb-5">
            {step.summaryBars?.map((bar, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{barEmojis[i] || '📊'}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#1a1f3d]">{bar.label}</span>
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{bar.status}</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-300 to-amber-400 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: animated ? `${bar.value}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Illustration */}
          {step.illustrationImage && (
            <div className="flex justify-center mb-4">
              <LazyImage src={step.illustrationImage} alt="Summary" className="h-28 object-contain" />
            </div>
          )}
          {/* Stat text */}
          <p className="text-center text-sm font-bold text-[#1a1f3d] mb-1">
            <span className="text-[#f59e0b]">94%</span> of users meet their best self
          </p>
          {/* Laurel badges */}
          <div className="flex gap-2 justify-center my-4">
            {step.statBadges?.map((b, i) => (
              <div key={i} className="bg-white rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] text-gray-400">{b.label}</p>
                <p className="text-[10px] font-semibold text-[#1a1f3d]">{b.value}</p>
              </div>
            ))}
          </div>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Page 37: First habit - calendar with green checks, blue gradient habit card
function FirstHabitScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 pt-4">
          <h1 className="text-lg font-bold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
          <p className="text-xs text-gray-400 mb-2">Today</p>
          <div className="flex gap-1 mb-5">
            {days.map((d, i) => (
              <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs ${
                i === 3 ? 'bg-[#1a1f3d] text-white font-bold' : 'text-gray-400'
              }`}>
                <div>{d}</div>
                <div className="mt-1">{i < 3 ? <span className="text-[#22c55e]">✓</span> : 12 + i}</div>
              </div>
            ))}
          </div>
          {/* Blue gradient habit card */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <span className="text-2xl">🧘</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{step.subtitle}</p>
              <p className="text-xs text-blue-100">{step.description}</p>
            </div>
            <div className="w-10 h-6 bg-white/30 rounded-full flex items-center justify-end pr-0.5">
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          </div>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Page 38: Breathing prep - dark navy bg
function BreathingPrepScreen({ step, onNext }: Props & { onNext?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onNext?.(), 3000);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <div className="h-full flex flex-col bg-[#1a1f3d]">
      <StatusBar light />
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {step.illustrationImage && (
          <LazyImage src={step.illustrationImage} alt="Meditation" className="h-48 w-48 mb-8 object-contain" />
        )}
        <h1 className="text-2xl font-bold text-white text-center">{step.title}</h1>
      </div>
    </div>
  );
}

// Page 39: Breathing exercise
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
    <div className="h-full flex flex-col bg-[#1a1f3d]">
      <StatusBar light />
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <p className="text-sm text-gray-300 mb-8">{step.title}</p>
        <div className={`w-40 h-40 rounded-full border-4 border-indigo-400/50 flex items-center justify-center mb-4 transition-transform duration-[2s] ${scale}`}>
          <div className="w-28 h-28 rounded-full bg-indigo-400/20 flex items-center justify-center animate-pulse">
            <span className="text-4xl font-bold text-white">{countdown}</span>
          </div>
        </div>
        <p className="text-lg font-semibold text-white">{phaseLabel}</p>
      </div>
    </div>
  );
}

// Page 40: Breathing done
function BreathingDoneScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 pt-4">
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-2">{step.title}</h1>
          <p className="text-sm text-gray-400 mb-4">{step.description}</p>
          <p className="text-xs text-gray-400 mb-2">Today</p>
          <div className="flex gap-1 mb-4">
            {days.map((d, i) => (
              <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs ${
                i <= 3 ? 'bg-green-50 text-[#22c55e]' : 'text-gray-300'
              }`}>
                <div>{d}</div>
                <div className="mt-1">{i <= 3 ? '✓' : '·'}</div>
              </div>
            ))}
          </div>
          {/* Completed habit card */}
          <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 mb-6 border border-green-200">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-[#1a1f3d]">{step.subtitle}</p>
              <p className="text-xs text-gray-400">Today • Now</p>
            </div>
          </div>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Pages 41-42: Streak - light green bg, white calendar card, separate streak card with fire emoji
function StreakScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  return (
    <div className="h-full flex flex-col bg-[#f0f9f0]">
      <StatusBar />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 pt-4">
          {/* White calendar card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <p className="text-xs text-gray-400 mb-2">Today</p>
            <div className="flex gap-1">
              {days.map((d, i) => (
                <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs transition-all duration-500 ${
                  animated ? 'text-[#22c55e]' : 'text-gray-300'
                }`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="text-gray-400">{d}</div>
                  <div className="mt-1 text-sm">{animated ? '✓' : '·'}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Streak card */}
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm mb-4">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{step.title}</p>
            <p className={`text-4xl font-black text-[#1a1f3d] transition-all duration-700 ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>{step.statHighlight}</p>
            <p className="text-sm font-semibold text-[#1a1f3d] mt-1">{step.subtitle}</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-5">
            By dedicating yourself for just <span className="text-[#22c55e] font-semibold">21 days</span>, you'll form a new habit that is here to last!
          </p>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Pages 43-46: Paywall - Restore link, illustration, 3 horizontal pricing columns, colored badges
function PaywallScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [selectedTier, setSelectedTier] = useState<number>(
    step.pricingTiers?.findIndex(t => t.badge) ?? 0
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      {/* Top bar with close and Restore */}
      <div className="flex justify-between items-center px-4 py-2 shrink-0">
        <button onClick={onNext} className="text-gray-400 text-lg">✕</button>
        <button className="text-xs text-gray-400 font-medium">Restore</button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6">
          <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-3">{step.title}</h1>
          {/* Illustration */}
          {step.illustrationImage && (
            <div className="flex justify-center mb-4">
              <LazyImage src={step.illustrationImage} alt="Paywall" className="h-32 object-contain" />
            </div>
          )}
          {/* Horizontal pricing columns */}
          <div className="flex gap-2 mb-4">
            {step.pricingTiers?.map((tier, i) => {
              const isSelected = selectedTier === i;
              const badgeColor = tier.badge?.toLowerCase().includes('best') 
                ? 'bg-[#22c55e] text-white' 
                : tier.badge?.toLowerCase().includes('popular') 
                  ? 'bg-[#8b5cf6] text-white' 
                  : 'bg-gray-200 text-gray-600';
              return (
                <button
                  key={i}
                  onClick={() => setSelectedTier(i)}
                  className={`flex-1 rounded-xl p-3 text-center transition-all relative ${
                    isSelected
                      ? 'bg-amber-50 ring-2 ring-[#f59e0b]'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {tier.badge && (
                    <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 ${badgeColor} text-[8px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap`}>{tier.badge}</span>
                  )}
                  <p className="text-xs font-bold text-[#1a1f3d] mt-1">{tier.label}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{tier.perWeek}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{tier.total}</p>
                </button>
              );
            })}
          </div>
          <p className="text-sm font-semibold text-[#1a1f3d] text-center mb-4">{step.subtitle}</p>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
          <p className="text-[10px] text-gray-300 text-center mt-3">Terms & Conditions · Privacy Policy</p>
        </div>
      </ScrollArea>
    </div>
  );
}

// Page 49: Before/After - cream bg, overlapping cards with arrows
function BeforeAfterScreen({ step, onNext }: Props & { onNext?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-[#fdf8f4]">
      <StatusBar />
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 pt-4">
          <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-1">{step.title}</h1>
          <p className="text-sm text-gray-500 text-center mb-5">{step.subtitle}</p>
          {/* Overlapping cards */}
          <div className="relative mb-6" style={{ minHeight: '320px' }}>
            {/* Before card */}
            <div className="absolute left-0 top-0 w-[55%] bg-gray-100 rounded-2xl p-4 shadow-sm z-0">
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Before</p>
              <ul className="space-y-2.5">
                {step.beforeItems?.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-400">–</span> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-3xl text-center">😔</div>
            </div>
            {/* Curved arrow */}
            <div className="absolute left-[48%] top-[40%] text-2xl text-gray-300 z-10 -rotate-12">➜</div>
            {/* After card */}
            <div className="absolute right-0 top-6 w-[55%] bg-amber-50 rounded-2xl p-4 shadow-md z-20 border border-amber-100">
              <p className="text-xs font-bold text-amber-600 uppercase mb-3">After</p>
              <ul className="space-y-2.5">
                {step.afterItems?.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-[#22c55e]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-3xl text-center">🌟</div>
            </div>
          </div>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Page 33, 48: Science backed - full-bleed illustration, pink bg, white badge cards / checklist
function ScienceBackedScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const isChecklist = !!step.checklistItems;
  
  return (
    <div className={`h-full flex flex-col ${isChecklist ? 'bg-white' : 'bg-[#fdf0f5]'}`}>
      {/* Full-bleed illustration */}
      <div className={`flex-[0_0_${isChecklist ? '35' : '45'}%] relative overflow-hidden`}>
        <StatusBar />
        {step.illustrationImage && (
          <LazyImage src={step.illustrationImage} alt="Science" className="absolute inset-0 w-full h-full object-contain" />
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 pt-4">
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-3 leading-snug">{step.title}</h1>
          {isChecklist ? (
            <div className="space-y-3 mb-6">
              {step.checklistItems?.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{step.description}</p>
              {/* Institution badges as white cards */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {step.statBadges?.map((b, i) => (
                  <div key={i} className="bg-white rounded-xl px-3 py-3 text-center shadow-sm">
                    <span className="text-lg">{b.value}</span>
                    <p className="text-[10px] font-semibold text-gray-500 mt-1">{b.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
        </div>
      </ScrollArea>
    </div>
  );
}

// Pages 12-13: Rating - full-screen illustration bg, stars, iOS dialog
function RatingScreen({ step, onNext }: Props & { onNext?: () => void }) {
  const [rating, setRating] = useState(0);
  const hasDialog = !!step.subtitle;

  return (
    <div className="h-full relative">
      {/* Full-screen background */}
      {step.illustrationImage ? (
        <LazyImage src={step.illustrationImage} alt="Rating" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8f4f8] to-[#fdf8f4]" />
      )}
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col">
        <StatusBar />
        <div className="flex-1 flex flex-col items-center justify-end px-6 pb-8">
          <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
          <p className="text-sm text-gray-500 text-center mb-4">{step.description}</p>
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="text-3xl transition-transform active:scale-125">
                <span className={s <= rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
              </button>
            ))}
          </div>
          <NavyButton onClick={onNext}>{step.buttonLabel}</NavyButton>
          <SecondaryButton onClick={onNext}>{step.secondaryButtonLabel}</SecondaryButton>
        </div>
      </div>
      {/* iOS rating dialog overlay */}
      {hasDialog && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 px-8">
          <div className="bg-white rounded-2xl w-full shadow-xl overflow-hidden">
            <div className="p-5 text-center">
              <p className="text-sm font-semibold text-[#1a1f3d] mb-2">{step.subtitle}</p>
              <div className="flex gap-1 justify-center mb-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="text-2xl">
                    <span className={s <= rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex border-t border-gray-200">
              <button className="flex-1 py-3 text-sm font-medium text-blue-500 border-r border-gray-200" onClick={onNext}>Cancel</button>
              <button className="flex-1 py-3 text-sm font-semibold text-blue-500" onClick={onNext}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Page 50: Home screen
function HomeScreen({ step }: Props) {
  return (
    <div className="h-full bg-white flex flex-col">
      <StatusBar />
      {step.illustrationImage ? (
        <div className="flex-1 overflow-hidden">
          <LazyImage src={step.illustrationImage} alt="Home screen" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">App Home Screen</p>
        </div>
      )}
    </div>
  );
}
