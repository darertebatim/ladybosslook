import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, Calendar, Minus, Plus, X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useUpsertPeriodSettings } from '@/hooks/usePeriodTracker';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

type OnboardingStep = 'welcome' | 'last_period' | 'cycle_length';

export const PeriodOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(undefined);
  const [cycleLength, setCycleLength] = useState(28);
  
  const upsertSettings = useUpsertPeriodSettings();

  const handleComplete = async () => {
    try {
      await upsertSettings.mutateAsync({
        last_period_start: lastPeriodDate ? format(lastPeriodDate, 'yyyy-MM-dd') : null,
        average_cycle: cycleLength,
        average_period: 5,
        onboarding_done: true,
      });
      
      haptic.success();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EC4899', '#F43F5E', '#FB7185', '#FDA4AF'],
      });
      
      toast.success('Period tracking set up!');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleSkipToFinish = async () => {
    try {
      await upsertSettings.mutateAsync({
        average_cycle: 28,
        average_period: 5,
        onboarding_done: true,
      });
      
      haptic.light();
      toast.success("You're all set! Log your first period when it starts.");
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 50%, #FFFFFF 100%)',
        }}
      />

      {/* Close button */}
      <div 
        className="relative z-10 flex items-center justify-end px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => {
            haptic.light();
            navigate('/app/home');
          }}
          className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="h-5 w-5 text-pink-700" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {step === 'welcome' && (
          <div className="text-center max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-pink-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-pink-800 mb-3">
              🌸 Period Tracker
            </h1>
            
            <p className="text-pink-600 mb-8 leading-relaxed">
              Track your cycle with ease. Get predictions, insights, and reminders for your period and ovulation.
            </p>
            
            <Button
              onClick={() => {
                haptic.light();
                setStep('last_period');
              }}
              className="w-full h-14 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-semibold text-lg"
            >
              Get Started
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 'last_period' && (
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-pink-500" />
              </div>
              <h2 className="text-xl font-bold text-pink-800 mb-2">
                When did your last period start?
              </h2>
              <p className="text-sm text-pink-600">
                This helps us predict your next cycle
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm mb-6">
              <CalendarComponent
                mode="single"
                selected={lastPeriodDate}
                onSelect={(date) => {
                  haptic.light();
                  setLastPeriodDate(date);
                }}
                disabled={(date) => date > new Date()}
                initialFocus
                className="mx-auto"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  haptic.light();
                  setStep('cycle_length');
                }}
                className="flex-1 h-12 rounded-full border-pink-200 text-pink-600"
              >
                Skip
              </Button>
              <Button
                onClick={() => {
                  haptic.light();
                  setStep('cycle_length');
                }}
                disabled={!lastPeriodDate}
                className="flex-1 h-12 rounded-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'cycle_length' && (
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-pink-800 mb-2">
                What's your average cycle length?
              </h2>
              <p className="text-sm text-pink-600">
                Don't know? We'll learn from your data over time.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    haptic.light();
                    setCycleLength(prev => Math.max(21, prev - 1));
                  }}
                  className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Minus className="h-6 w-6 text-pink-600" />
                </button>
                
                <div className="text-center">
                  <span className="text-5xl font-bold text-pink-700">{cycleLength}</span>
                  <p className="text-pink-500 mt-1">days</p>
                </div>
                
                <button
                  onClick={() => {
                    haptic.light();
                    setCycleLength(prev => Math.min(45, prev + 1));
                  }}
                  className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus className="h-6 w-6 text-pink-600" />
                </button>
              </div>
              
              <p className="text-xs text-center text-pink-400 mt-4">
                Average cycle is 21-35 days
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  haptic.light();
                  handleSkipToFinish();
                }}
                className="flex-1 h-12 rounded-full border-pink-200 text-pink-600"
              >
                Skip
              </Button>
              <Button
                onClick={() => {
                  haptic.light();
                  handleComplete();
                }}
                disabled={upsertSettings.isPending}
                className="flex-1 h-12 rounded-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                {upsertSettings.isPending ? 'Saving...' : 'Finish'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-8">
        <div className={`w-2 h-2 rounded-full transition-colors ${step === 'welcome' ? 'bg-pink-500' : 'bg-pink-200'}`} />
        <div className={`w-2 h-2 rounded-full transition-colors ${step === 'last_period' ? 'bg-pink-500' : 'bg-pink-200'}`} />
        <div className={`w-2 h-2 rounded-full transition-colors ${step === 'cycle_length' ? 'bg-pink-500' : 'bg-pink-200'}`} />
      </div>
    </div>
  );
};
