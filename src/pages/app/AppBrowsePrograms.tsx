import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, GraduationCap, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Users, UserCheck, Headphones, Video, Calendar, Sparkles, Dumbbell, Waves, Heart, Lock } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useEnrollments } from '@/hooks/useAppData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { CachedImage } from '@/components/ui/CachedImage';
import { HostBadges } from '@/components/app/HostBadges';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { useUserPreferredLanguage, preferredLanguageSorter } from '@/hooks/useUserPreferredLanguage';
import { useTranslation } from 'react-i18next';
import { IOSIconButton } from '@/components/app/ui/IOSIconButton';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
};

// LANGUAGE_OPTIONS and typeConfig are built inside the component so labels are translated.
const TYPE_ICONS: Record<string, typeof BookOpen> = {
  'course': BookOpen,
  'group-coaching': Users,
  '1o1-session': UserCheck,
  'audiobook': Headphones,
  'meditate': Sparkles,
  'workout': Dumbbell,
  'soundscape': Waves,
  'affirmations': Heart,
  'webinar': Video,
  'event': Calendar,
  'subscription': Sparkles,
};
const TYPE_LABEL_KEYS: Record<string, string> = {
  'course': 'browseProgramsPage.typeCourse',
  'group-coaching': 'browseProgramsPage.typeCoaching',
  '1o1-session': 'browseProgramsPage.type1on1',
  'audiobook': 'browseProgramsPage.typeAudiobook',
  'meditate': 'browseProgramsPage.typeMeditate',
  'workout': 'browseProgramsPage.typeWorkout',
  'soundscape': 'browseProgramsPage.typeSoundscape',
  'affirmations': 'browseProgramsPage.typeAffirmations',
  'webinar': 'browseProgramsPage.typeWebinar',
  'event': 'browseProgramsPage.typeEvent',
  'subscription': 'browseProgramsPage.typeClub',
};

// --- Horizontal Program Card (matches PlaylistCard style) ---
interface AcademyProgramCardProps {
  title: string;
  slug: string;
  image?: string;
  type?: string;
  language?: string;
  isFree?: boolean;
  isEnrolled?: boolean;
  isWaitlist?: boolean;
  onClick?: () => void;
}

const AcademyProgramCard = ({ title, slug, image, type, language, isFree, isEnrolled, isWaitlist, onClick }: AcademyProgramCardProps) => {
  const { t } = useTranslation();
  const TypeIcon = (type && TYPE_ICONS[type]) || Sparkles;
  const typeLabel = type && TYPE_LABEL_KEYS[type] ? t(TYPE_LABEL_KEYS[type]) : null;

  return (
    <button
      className={cn(
        "relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
        "bg-card-warm shadow-card-warm"
      )}
      onClick={() => { haptic.light(); onClick?.(); }}
    >
      <div className="flex gap-3 p-3">
        {/* Square thumbnail */}
        <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-visible">
          <div className="h-full w-full rounded-xl overflow-hidden">
            {image ? (
              <CachedImage src={image} alt={title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-peach flex items-center justify-center">
                <TypeIcon className="h-8 w-8 text-brand/50" />
              </div>
            )}
          </div>
          {/* Enrolled badge */}
          {isEnrolled && (
            <div className="absolute -top-2 -left-1 z-10 bg-mint text-fg-warm text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-ios">
              <CheckCircle2 className="h-2.5 w-2.5" /> {t('browseProgramsPage.enrolled')}
            </div>
          )}
          {/* FREE badge */}
          {isFree && !isEnrolled && (
            <div className="absolute -top-2 -left-1 z-10 bg-card text-brand text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-ios">
              {t('browseProgramsPage.free')}
            </div>
          )}
          {/* Lock icon for waitlist */}
          {isWaitlist && !isEnrolled && (
            <div className="absolute bottom-1.5 left-1.5">
              <div className="w-6 h-6 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-ios">
                <Lock className="h-3 w-3 text-fg-warm-muted" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-[11px] text-fg-warm-muted">
            {typeLabel && <span className="capitalize">{typeLabel}</span>}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-fg-warm line-clamp-2 leading-snug">{title}</h3>

          {/* Hosts / Instructors */}
          <HostBadges
            contentType="program"
            contentId={slug}
            size="sm"
            prefix="with"
            className="text-fg-warm-muted"
          />

          {/* Language flag */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {language && language !== 'all' && (
              language === 'persian'
                ? <PersianFlag size={10} />
                : LANG_FLAGS[language] && <span className="text-[10px] flex-shrink-0 leading-none">{LANG_FLAGS[language]}</span>
            )}
          </div>
        </div>
      </div>

      {/* Enroll CTA for waitlist */}
      {isWaitlist && !isEnrolled && (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-peach text-brand text-xs font-semibold">
          <span>{t('browseProgramsPage.tapToEnroll')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
};

// --- Main Page ---
const AppBrowsePrograms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { programs, isLoading } = usePrograms();
  const { data: enrollments = [] } = useEnrollments();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const { scrollRef: academyScrollRef } = useScrollRestore('academy_scroll', { autoSave: true });
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return localStorage.getItem('academy-language') || 'all';
  });

  const LANGUAGE_OPTIONS = useMemo(() => [
    { value: 'all', label: t('browseProgramsPage.all'), flag: '🌐' },
    { value: 'american', label: t('browseProgramsPage.langEnglish'), flag: '🇺🇸' },
    { value: 'persian', label: t('browseProgramsPage.langPersian'), flag: null as string | null },
    { value: 'turkish', label: 'Türkçe', flag: '🇹🇷' },
    { value: 'spanish', label: 'Español', flag: '🇪🇸' },
  ], [t]);

  const handleLanguageChange = useCallback((lang: string) => {
    setPreferredLanguage(lang);
    localStorage.setItem('academy-language', lang);
  }, []);

  const selectedLang = LANGUAGE_OPTIONS.find(l => l.value === preferredLanguage) || LANGUAGE_OPTIONS[0];

  const isEnrolled = (slug: string) => enrollments.includes(slug);

  // Free / IAP programs
  const freePrograms = useMemo(() => {
    return programs.filter(p =>
      p.isFree || p.priceAmount === 0 || p.is_free_on_ios === true || !!p.ios_product_id
    );
  }, [programs]);

  // Waitlist programs
  const { data: waitlistPrograms = [] } = useQuery({
    queryKey: ['waitlist-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title, type, cover_image_url, description, language')
        .eq('show_in_app_waitlist', true)
        .eq('is_active', true) as any;
      if (error) throw error;
      return data || [];
    },
  });

  const waitlistSlugs = useMemo(() => new Set(waitlistPrograms.map((p: any) => p.slug)), [waitlistPrograms]);

  const allPrograms = useMemo(() => {
    const includedSlugs = new Set<string>();
    const result: any[] = [];

    // 1. Add all free/IAP programs
    freePrograms.forEach(p => {
      includedSlugs.add(p.slug);
      result.push({ ...p, _isWaitlist: waitlistSlugs.has(p.slug) });
    });

    // 2. Add waitlist-only programs not already included
    waitlistPrograms
      .filter((p: any) => !includedSlugs.has(p.slug))
      .forEach((p: any) => {
        includedSlugs.add(p.slug);
        result.push({
          title: p.title,
          slug: p.slug,
          description: p.description || '',
          image: p.cover_image_url || '',
          type: p.type,
          language: p.language,
          isFree: false,
          priceAmount: 999,
          is_free_on_ios: false,
          ios_product_id: undefined,
          _isWaitlist: true,
        });
      });

    // 3. Add enrolled programs not already included (paid programs the user has access to)
    programs.forEach(p => {
      if (!includedSlugs.has(p.slug) && enrollments.includes(p.slug)) {
        includedSlugs.add(p.slug);
        result.push({ ...p, _isWaitlist: false });
      }
    });

    return result;
  }, [freePrograms, waitlistPrograms, waitlistSlugs, programs, enrollments]);

  const availableTypes = useMemo(() => {
    const types = new Set(allPrograms.map((p: any) => p.type).filter(Boolean));
    const dynamicFilters = Array.from(types).map((typeKey) => {
      const labelKey = TYPE_LABEL_KEYS[typeKey as string];
      return { value: typeKey as string, label: labelKey ? t(labelKey) : (typeKey as string) };
    });
    return [{ value: 'all', label: t('browseProgramsPage.all') }, ...dynamicFilters];
  }, [allPrograms, t]);

  const userLang = useUserPreferredLanguage();

  const filtered = useMemo(() => {
    let result = allPrograms;
    if (selectedType !== 'all') {
      result = result.filter((p: any) => p.type === selectedType);
    }
    if (preferredLanguage !== 'all') {
      result = result.filter((p: any) => p.language === preferredLanguage);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) =>
        p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    // Sort by user's preferred language
    result = [...result].sort(preferredLanguageSorter(userLang));
    return result;
  }, [allPrograms, searchQuery, selectedType, preferredLanguage, userLang]);

  const enrolledPrograms = useMemo(() => {
    return filtered.filter((p: any) => isEnrolled(p.slug));
  }, [filtered, enrollments]);

  const notEnrolledPrograms = useMemo(() => {
    return filtered.filter((p: any) => !isEnrolled(p.slug));
  }, [filtered, enrollments]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-12 flex items-center px-4"><Skeleton className="h-6 w-32" /></div>
          <div className="px-4 pb-3 flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-20 h-8 rounded-full" />)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead title={t('browseProgramsPage.seoTitle')} description={t('browseProgramsPage.seoDesc')} />

      <div ref={academyScrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Header */}
          <div className="sticky z-20 px-4 pt-3 pb-2 bg-background" style={{ top: 'env(safe-area-inset-top)' }}>
          {/* Title bar */}
          <div className="min-h-[44px] grid grid-cols-[auto_1fr_auto] items-center">
            {showSearch ? (
              <div className="flex-1 flex items-center gap-2 col-span-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-warm-muted" />
                  <Input
                    placeholder={t('browseProgramsPage.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-card border-0 text-fg-warm placeholder:text-fg-warm-muted focus-visible:ring-0 shadow-ios rounded-full"
                    autoFocus
                  />
                </div>
                <IOSIconButton size="sm" onClick={() => { setShowSearch(false); setSearchQuery(''); }} aria-label={t('browseProgramsPage.academy')}>
                  <X className="h-5 w-5 text-fg-warm" />
                </IOSIconButton>
              </div>
            ) : (
              <>
                <IOSIconButton size="sm" onClick={() => navigate(-1)} aria-label="Back">
                  <ChevronLeft className="h-5 w-5 text-brand" />
                </IOSIconButton>
                <h1 className="text-center text-2xl font-bold text-fg-warm tracking-tight">{t('browseProgramsPage.academy')}</h1>
                <IOSIconButton size="sm" onClick={() => setShowSearch(true)} aria-label="Search">
                  <Search className="h-4 w-4 text-brand" />
                </IOSIconButton>
              </>
            )}
          </div>
          </div>

          {/* Type pills + Language filter row */}
          <div className="px-4 pb-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide flex-1">
                {availableTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => { haptic.selection(); setSelectedType(type.value); }}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all active:scale-95",
                      selectedType === type.value ? "bg-brand text-white shadow-ios" : "bg-peach text-fg-warm-muted"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {/* Language popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <IOSIconButton size="sm" aria-label="Language">
                    {selectedLang.flag ? selectedLang.flag : <PersianFlag size={14} />}
                  </IOSIconButton>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="end">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-fg-warm active:bg-bg-warm transition-colors",
                        preferredLanguage === lang.value && "bg-bg-warm font-medium"
                      )}
                    >
                      {lang.flag ? <span className="text-base">{lang.flag}</span> : <PersianFlag size={14} />}
                      {lang.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>

        <div className="p-4 pb-safe space-y-6">
          {/* Enrolled Programs */}
          {enrolledPrograms.length > 0 && selectedType === 'all' && !searchQuery && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-fg-warm-muted uppercase tracking-wider">
                {t('browseProgramsPage.yourPrograms')}
              </h2>
              <div className="space-y-3">
                {enrolledPrograms.map((program: any) => (
                  <AcademyProgramCard
                    key={program.slug}
                    title={program.title}
                    slug={program.slug}
                    image={program.image}
                    type={program.type}
                    language={program.language}
                    isFree={!program._isWaitlist && (program.isFree || program.priceAmount === 0)}
                    isEnrolled={true}
                    isWaitlist={false}
                    onClick={() => navigate(`/app/programs/${program.slug}`, { state: { from: location.pathname } })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All / Not Enrolled Programs */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-fg-warm-muted uppercase tracking-wider">
              {searchQuery ? t('browseProgramsPage.results') : selectedType === 'all' ? t('browseProgramsPage.allPrograms') : availableTypes.find(f => f.value === selectedType)?.label || t('browseProgramsPage.programs')}
            </h2>

            {notEnrolledPrograms.length === 0 && enrolledPrograms.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-peach flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-brand/50" />
                </div>
                <p className="text-fg-warm-muted text-sm">
                  {searchQuery ? t('browseProgramsPage.noMatch', { query: searchQuery }) : t('browseProgramsPage.noPrograms')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notEnrolledPrograms.map((program: any) => (
                  <AcademyProgramCard
                    key={program.slug}
                    title={program.title}
                    slug={program.slug}
                    image={program.image}
                    type={program.type}
                    language={program.language}
                    isFree={!program._isWaitlist && (program.isFree || program.priceAmount === 0)}
                    isEnrolled={false}
                    isWaitlist={program._isWaitlist}
                    onClick={() => navigate(`/app/programs/${program.slug}`, { state: { from: location.pathname } })}
                  />
                ))}
              </div>
            )}

            {/* CTA to support chat */}
            <div className="pt-4 pb-2">
              <p className="text-sm text-fg-warm-muted">{t('browseProgramsPage.tellUsWant')}</p>
              <button
                onClick={() => navigate('/app/chat?draft=' + encodeURIComponent(t('browseProgramsPage.chatDraft')))}
                className="text-sm text-brand font-semibold flex items-center gap-1 mt-1 active:opacity-70"
              >
                {t('browseProgramsPage.tellUsCta')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppBrowsePrograms;
