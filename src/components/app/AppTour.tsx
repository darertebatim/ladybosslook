import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppTour } from '@/hooks/useAppTour';

// Tour step definitions - only targeting elements that are always present
export const tourSteps: Step[] = [
  {
    target: '.tour-header',
    content: 'Welcome! 👋 This is your personal dashboard. Track your daily tasks and see your progress at a glance.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.tour-calendar',
    content: 'Swipe through days to see your tasks. Flame icons 🔥 show days you completed tasks!',
    placement: 'bottom',
  },
  {
    target: '.tour-streak',
    content: 'Your streak! Complete tasks daily to keep it growing. Can you reach 30 days?',
    placement: 'bottom',
  },
  {
    target: '.tour-add-task',
    content: 'Tap here to add new tasks or choose from popular suggestions ✨',
    placement: 'left',
  },
  {
    target: '.tour-programs-carousel',
    content: 'Your enrolled programs appear here. Tap any to see course content and upcoming sessions.',
    placement: 'top',
  },
  {
    target: '.tour-nav-routines',
    content: 'Explore ready-made routines to build healthy habits. Morning, evening, focus time - we\'ve got you covered!',
    placement: 'top',
  },
  {
    target: '.tour-nav-programs',
    content: 'Access your courses and learning materials here.',
    placement: 'top',
  },
  {
    target: '.tour-nav-chat',
    content: 'Need help? Chat directly with our support team anytime! 💬',
    placement: 'top',
  },
];

// Custom styles matching app theme
const tourStyles = {
  options: {
    primaryColor: 'hsl(271, 70%, 85%)', // violet-300 matching D8C0F3
    textColor: 'hsl(0, 0%, 10%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
    arrowColor: 'hsl(0, 0%, 100%)',
  },
  tooltip: {
    borderRadius: 16,
    padding: 20,
    fontSize: 15,
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  tooltipContent: {
    padding: '12px 0 0',
    lineHeight: 1.5,
  },
  buttonNext: {
    backgroundColor: 'hsl(0, 0%, 10%)',
    borderRadius: 12,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
  },
  buttonBack: {
    color: 'hsl(0, 0%, 40%)',
    marginRight: 10,
    fontSize: 14,
  },
  buttonSkip: {
    color: 'hsl(0, 0%, 50%)',
    fontSize: 13,
  },
};

interface AppTourProps {
  run: boolean;
  stepIndex: number;
  onStepChange: (index: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function AppTour({ 
  run, 
  stepIndex, 
  onStepChange, 
  onComplete, 
  onSkip 
}: AppTourProps) {
  const handleCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if (type === 'step:after') {
      onStepChange(index + 1);
    }
    
    if (status === STATUS.FINISHED) {
      onComplete();
    } else if (status === STATUS.SKIPPED) {
      onSkip();
    }
  };

  return (
    <Joyride
      run={run}
      steps={tourSteps}
      stepIndex={stepIndex}
      callback={handleCallback}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      scrollOffset={120}
      disableOverlayClose
      spotlightClicks={false}
      styles={tourStyles}
      locale={{
        back: 'Back',
        close: 'Got it!',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
}

// Standalone hook-based component for simpler usage
export function AppTourController() {
  const { run, stepIndex, setStepIndex, completeTour, skipTour } = useAppTour();
  
  return (
    <AppTour
      run={run}
      stepIndex={stepIndex}
      onStepChange={setStepIndex}
      onComplete={completeTour}
      onSkip={skipTour}
    />
  );
}
