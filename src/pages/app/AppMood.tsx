import { BackButton } from '@/components/app/BackButton';
import { MoodDashboard } from '@/components/mood/MoodDashboard';
import { SEOHead } from '@/components/SEOHead';

export default function AppMood() {
  return (
    <>
      <SEOHead 
        title="Mood Check-in | Simora"
        description="Track your daily mood and emotional well-being"
      />
      <div 
        className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 flex flex-col"
        style={{ height: '100dvh' }}
      >
        {/* Header with iOS safe area */}
        <header 
          className="shrink-0 px-4 flex items-center gap-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}
        >
          <BackButton to="/app/home" />
          <h1 className="text-xl font-semibold flex-1">Mood Check-in</h1>
        </header>

        {/* Main Content */}
        <MoodDashboard />
      </div>
    </>
  );
}
