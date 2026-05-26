import { BackButton } from '@/components/app/BackButton';
import { MoodDashboard } from '@/components/mood/MoodDashboard';
import { SEOHead } from '@/components/SEOHead';
import { SlideUpPage } from '@/components/app/SlideUpPage';
import { useTranslation } from 'react-i18next';

export default function AppMood() {
  const { t } = useTranslation();
  return (
    <SlideUpPage defaultBack="/app/home">
      <SEOHead 
        title={t('moodPage.seoTitle')}
        description={t('moodPage.seoDescription')}
      />
      <div 
        className="flex flex-col"
        style={{ height: '100dvh' }}
      >
        {/* Header with iOS safe area */}
        <header 
          className="shrink-0 px-4 flex items-center gap-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}
        >
          <BackButton />
          <h1 className="text-xl font-semibold flex-1">{t('moodPage.title')}</h1>
        </header>

        {/* Main Content */}
        <MoodDashboard />
      </div>
    </SlideUpPage>
  );
}
