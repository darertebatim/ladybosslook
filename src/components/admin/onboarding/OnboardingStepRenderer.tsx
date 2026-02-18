import { OnboardingStep } from '@/types/onboarding';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  step: OnboardingStep;
}

export function OnboardingStepRenderer({ step }: Props) {
  switch (step.type) {
    case 'welcome':
      return <WelcomeScreen step={step} />;
    case 'greeting':
      return <GreetingScreen step={step} />;
    case 'multi-select':
      return <MultiSelectScreen step={step} />;
    case 'single-select':
      return <SingleSelectScreen step={step} />;
    case 'single-select-descriptions':
      return <SingleSelectDescScreen step={step} />;
    case 'yes-no':
      return <YesNoScreen step={step} />;
    case 'do-you-want':
      return <DoYouWantScreen step={step} />;
    case 'info-stat':
      return <InfoStatScreen step={step} />;
    case 'motivational':
      return <MotivationalScreen step={step} />;
    case 'notification-permission':
      return <NotificationScreen step={step} />;
    case 'results-chart':
      return <ResultsChartScreen step={step} />;
    case 'habit-loop':
      return <HabitLoopScreen step={step} />;
    case 'loading-testimonials':
      return <LoadingTestimonialsScreen step={step} />;
    case 'personal-summary':
      return <PersonalSummaryScreen step={step} />;
    case 'first-habit':
      return <FirstHabitScreen step={step} />;
    case 'breathing-prep':
      return <BreathingPrepScreen step={step} />;
    case 'breathing':
      return <BreathingScreen step={step} />;
    case 'breathing-done':
      return <BreathingDoneScreen step={step} />;
    case 'streak':
      return <StreakScreen step={step} />;
    case 'paywall':
      return <PaywallScreen step={step} />;
    case 'before-after':
      return <BeforeAfterScreen step={step} />;
    case 'science-backed':
      return <ScienceBackedScreen step={step} />;
    case 'rating':
      return <RatingScreen step={step} />;
    default:
      return <div className="flex items-center justify-center h-full text-sm text-gray-400">Unknown step type: {step.type}</div>;
  }
}

// Shared components
function NavyButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`w-full py-3.5 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-sm ${className}`}>
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-full py-3 text-sm text-gray-500 font-medium">
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
      <div className="flex flex-col h-full min-h-[700px] px-5 py-6">
        {children}
      </div>
    </ScrollArea>
  );
}

// Screen implementations
function WelcomeScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <IllustrationPlaceholder label="App hero illustration" className="h-48 mb-6" />
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center mb-3">{step.title}</h1>
      <div className="flex justify-center mb-3">
        <span className="text-3xl font-black text-[#1a1f3d]">{step.statHighlight}</span>
      </div>
      <div className="flex gap-2 justify-center mb-8">
        {step.statBadges?.map((b, i) => (
          <span key={i} className="px-3 py-1.5 bg-amber-50 rounded-full text-xs font-medium text-amber-700">{b.value} {b.label}</span>
        ))}
      </div>
      <div className="mt-auto space-y-2">
        <NavyButton>{step.buttonLabel}</NavyButton>
        <SecondaryButton>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function GreetingScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <IllustrationPlaceholder label={step.illustrationLabel || 'Mascot'} className="h-56 mb-8" />
      <h1 className="text-2xl font-bold text-[#1a1f3d] text-center">{step.title}</h1>
      <p className="text-base text-gray-500 text-center mt-2 mb-8">{step.subtitle}</p>
      <div className="mt-auto">
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MultiSelectScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
      <div className="space-y-3 mb-6">
        {step.options?.map((opt, i) => (
          <button key={i} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white text-left hover:border-indigo-300 transition-colors">
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            <span className="text-sm font-medium text-[#1a1f3d]">{opt.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-auto">
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function SingleSelectScreen({ step }: Props) {
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
          <button key={i} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white text-left hover:border-indigo-300 transition-colors">
            {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
            <span className="text-sm font-medium text-[#1a1f3d]">{opt.label}</span>
          </button>
        ))}
      </div>
    </ScreenWrapper>
  );
}

function SingleSelectDescScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.title}</h1>
      <div className="space-y-3">
        {step.options?.map((opt, i) => (
          <button key={i} className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-left hover:border-indigo-300 transition-colors">
            <span className="text-sm font-semibold text-[#1a1f3d]">{opt.label}</span>
            {opt.description && <p className="text-xs text-gray-400 mt-1">{opt.description}</p>}
          </button>
        ))}
      </div>
    </ScreenWrapper>
  );
}

function YesNoScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
      <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="h-40 mb-4" />
      <p className="text-base text-[#1a1f3d] font-medium text-center mb-8">{step.description}</p>
      <div className="mt-auto flex gap-3">
        <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600">No</button>
        <button className="flex-1 py-3.5 rounded-2xl bg-[#1a1f3d] text-white text-sm font-semibold">Yes</button>
      </div>
    </ScreenWrapper>
  );
}

function DoYouWantScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <p className="text-sm text-gray-400 mb-2">{step.title}</p>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-5">{step.subtitle}</h1>
      <IllustrationPlaceholder label={step.illustrationLabel || 'Illustration'} className="h-48 mb-8" />
      <div className="mt-auto space-y-3">
        <NavyButton>{step.buttonLabel}</NavyButton>
        <SecondaryButton>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function InfoStatScreen({ step }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <IllustrationPlaceholder label={step.illustrationLabel || 'Statistic'} className="h-36 mb-6" />
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-3">{step.statHighlight}</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">{step.description}</p>
      <div className="mt-auto">
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function MotivationalScreen({ step }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      {step.illustrationLabel && <IllustrationPlaceholder label={step.illustrationLabel} className="h-44 mb-6" />}
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-xl font-bold text-[#1a1f3d] mb-3">{step.title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
      </div>
      <div className="mt-auto">
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function NotificationScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <IllustrationPlaceholder label="Bell notification icon" className="h-40 mb-6" />
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      {step.subtitle && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 my-4 text-center">
          <p className="text-sm font-semibold text-[#1a1f3d] mb-1">{step.subtitle}</p>
          <p className="text-xs text-gray-400">Notifications may include alerts, sounds, and icon badges.</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 text-xs font-medium text-blue-500">Don't Allow</button>
            <button className="flex-1 py-2 text-xs font-semibold text-blue-500">Allow</button>
          </div>
        </div>
      )}
      <div className="mt-auto space-y-2">
        <NavyButton>{step.buttonLabel}</NavyButton>
        <SecondaryButton>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}

function ResultsChartScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-4">{step.title}</h1>
      {/* Chart placeholder */}
      <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-2xl p-5 mb-4 h-48 flex flex-col justify-end">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Your expectation</span>
          <span className="text-indigo-500 font-bold">Actually happen</span>
        </div>
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 bg-indigo-200 rounded-t" style={{ height: `${Math.min(100, 15 + i * 8)}%` }} />
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function HabitLoopScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] mb-2">{step.title}</h1>
      {step.subtitle && <p className="text-base font-semibold text-[#1a1f3d] mb-3">{step.subtitle}</p>}
      {step.illustrationLabel ? (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-4 h-44 flex items-center justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-300" />
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function LoadingTestimonialsScreen({ step }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
      <p className="text-sm text-gray-400 text-center mb-6">{step.subtitle}</p>
      {/* Progress ring */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full border-4 border-gray-200 border-t-indigo-500 flex items-center justify-center">
          <span className="text-sm font-bold text-[#1a1f3d]">72%</span>
        </div>
      </div>
      {/* Testimonial cards */}
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

function PersonalSummaryScreen({ step }: Props) {
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
              <div className="bg-gradient-to-r from-red-400 to-orange-400 h-2.5 rounded-full" style={{ width: `${bar.value}%` }} />
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function FirstHabitScreen({ step }: Props) {
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function BreathingPrepScreen({ step }: Props) {
  return (
    <ScreenWrapper bg="bg-[#1a1f3d]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <IllustrationPlaceholder label={step.illustrationLabel || 'Meditation'} className="h-48 w-48 mb-8 bg-gradient-to-br from-indigo-400/30 to-purple-400/30" />
        <h1 className="text-2xl font-bold text-white text-center">{step.title}</h1>
      </div>
    </ScreenWrapper>
  );
}

function BreathingScreen({ step }: Props) {
  return (
    <ScreenWrapper bg="bg-[#1a1f3d]">
      <p className="text-sm text-gray-300 text-center mt-4">{step.title}</p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-40 h-40 rounded-full border-4 border-indigo-400/50 flex items-center justify-center mb-4">
          <div className="w-28 h-28 rounded-full bg-indigo-400/20 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{step.description}</span>
          </div>
        </div>
        <p className="text-lg font-semibold text-white">{step.subtitle}</p>
      </div>
    </ScreenWrapper>
  );
}

function BreathingDoneScreen({ step }: Props) {
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function StreakScreen({ step }: Props) {
  const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
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
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center mb-4">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">{step.title}</p>
        <p className="text-4xl font-black text-[#1a1f3d] mt-2">{step.statHighlight}</p>
        <p className="text-sm font-semibold text-[#1a1f3d] mt-1">{step.subtitle}</p>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-6">{step.description}</p>
      <div className="mt-auto">
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function PaywallScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-5">{step.title}</h1>
      <div className="space-y-3 mb-4">
        {step.pricingTiers?.map((tier, i) => (
          <div key={i} className={`relative rounded-2xl border-2 p-4 ${i === 1 ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200'}`}>
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
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold text-[#1a1f3d] text-center mb-4">{step.subtitle}</p>
      <div className="mt-auto">
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
      <p className="text-[10px] text-gray-300 text-center mt-3">Terms & Conditions · Privacy Policy</p>
    </ScreenWrapper>
  );
}

function BeforeAfterScreen({ step }: Props) {
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function ScienceBackedScreen({ step }: Props) {
  return (
    <ScreenWrapper>
      {step.subtitle && (
        <>
          <h1 className="text-lg font-bold text-[#1a1f3d] mb-3">{step.title}</h1>
          <IllustrationPlaceholder label={step.illustrationLabel || step.subtitle} className="h-36 mb-4" />
          <p className="text-xs text-gray-500 leading-relaxed mb-4">{step.description}</p>
        </>
      )}
      {!step.subtitle && (
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
        <NavyButton>{step.buttonLabel}</NavyButton>
      </div>
    </ScreenWrapper>
  );
}

function RatingScreen({ step }: Props) {
  return (
    <ScreenWrapper bg="bg-[#fdf8f4]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-xl font-bold text-[#1a1f3d] text-center mb-2">{step.title}</h1>
        {step.subtitle && <p className="text-sm text-gray-400 text-center mb-2">{step.subtitle}</p>}
        <p className="text-sm text-gray-500 text-center mb-4">{step.description}</p>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} className="text-2xl text-amber-400">★</span>
          ))}
        </div>
      </div>
      <div className="mt-auto space-y-2">
        <NavyButton>{step.buttonLabel}</NavyButton>
        <SecondaryButton>{step.secondaryButtonLabel}</SecondaryButton>
      </div>
    </ScreenWrapper>
  );
}
