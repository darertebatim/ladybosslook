import { useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, GraduationCap, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Users, UserCheck, Headphones, Video, Calendar, Sparkles, Dumbbell, Waves, Heart, Lock } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useEnrollments } from '@/hooks/useAppData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { WatchCategoryPill } from '@/components/video/WatchCategoryPill';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { CachedImage } from '@/components/ui/CachedImage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import heroStormVideo from '@/assets/watch-hero-storm.mp4';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { useUserPreferredLanguage, preferredLanguageSorter } from '@/hooks/useUserPreferredLanguage';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
};

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All', flag: '🌐' },
  { value: 'american', label: 'English', flag: '🇺🇸' },
  { value: 'persian', label: 'Persian', flag: null },
  { value: 'turkish', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'spanish', label: 'Español', flag: '🇪🇸' },
];

const typeConfig: Record<string, { label: string; icon: typeof BookOpen }> = {
  'course': { label: 'Course', icon: BookOpen },
  'group-coaching': { label: 'Coaching', icon: Users },
  '1o1-session': { label: '1-on-1', icon: UserCheck },
  'audiobook': { label: 'Audiobook', icon: Headphones },
  'meditate': { label: 'Meditate', icon: Sparkles },
  'workout': { label: 'Workout', icon: Dumbbell },
  'soundscape': { label: 'Soundscape', icon: Waves },
  'affirmations': { label: 'Affirmations', icon: Heart },
  'webinar': { label: 'Webinar', icon: Video },
  'event': { label: 'Event', icon: Calendar },
  'subscription': { label: 'Club', icon: Sparkles },
};

// --- Horizontal Program Card (matches PlaylistCard style) ---
interface AcademyProgramCardProps {
  title: string;
  image?: string;
  type?: string;
  language?: string;
  isFree?: boolean;
  isEnrolled?: boolean;
  isWaitlist?: boolean;
  onClick?: () => void;
}

const AcademyProgramCard = ({ title, image, type, language, isFree, isEnrolled, isWaitlist, onClick }: AcademyProgramCardProps) => {
  const typeInfo = type ? typeConfig[type] : null;
  const TypeIcon = typeInfo?.icon || Sparkles;

  return (
    <button
      className={cn(
        "relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
        "bg-white/10 backdrop-blur-sm"
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
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <TypeIcon className="h-8 w-8 text-white/30" />
              </div>
            )}
          </div>
          {/* Enrolled badge */}
          {isEnrolled && (
            <div className="absolute -top-2 -left-1 z-10 bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
              <CheckCircle2 className="h-2.5 w-2.5" /> Enrolled
            </div>
          )}
          {/* FREE badge */}
          {isFree && !isEnrolled && (
            <div className="absolute -top-2 -left-1 z-10 bg-white text-[#132240] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              FREE
            </div>
          )}
          {/* Lock icon for waitlist */}
          {isWaitlist && !isEnrolled && (
            <div className="absolute bottom-1.5 left-1.5">
              <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Lock className="h-3 w-3 text-white/80" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            {typeInfo && <span className="capitalize">{typeInfo.label}</span>}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug">{title}</h3>

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
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/10 text-white text-xs font-medium">
          <span>Tap to enroll</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
};

// --- Main Page ---
const AppBrowsePrograms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { programs, isLoading } = usePrograms();
  const { data: enrollments = [] } = useEnrollments();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollRef: academyScrollRef } = useScrollRestore('academy_scroll', { autoSave: true });
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return localStorage.getItem('academy-language') || 'all';
  });

  const handleLanguageChange = useCallback((lang: string) => {
    setPreferredLanguage(lang);
    localStorage.setItem('academy-language', lang);
  }, []);

  const selectedLang = LANGUAGE_OPTIONS.find(l => l.value === preferredLanguage) || LANGUAGE_OPTIONS[0];

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  }, []);

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
    const dynamicFilters = Array.from(types).map(t => {
      const config = typeConfig[t];
      return { value: t, label: config?.label || t };
    });
    return [{ value: 'all', label: 'All' }, ...dynamicFilters];
  }, [allPrograms]);

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
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#132240' }}>
        <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-12 flex items-center px-4"><Skeleton className="h-6 w-32 bg-white/10" /></div>
          <div className="px-4 pb-3 flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-20 h-8 rounded-full bg-white/10" />)}
          </div>
        </div>
        <div style={{ height: 'calc(130px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#132240' }}>
      <SEOHead title="Academy Programs - Simora" description="Browse all academy programs" />

      {/* Hero Video Background */}
      <div ref={heroRef} className="fixed top-0 left-0 right-0 z-0 h-[420px] overflow-hidden" style={{ transform: `translateY(${-scrollY * 0.4}px)` }}>
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50" src={heroStormVideo} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 30%, rgba(19,34,64,0.5) 60%, #132240 100%)' }} />
        <div className="absolute inset-0 bg-white/5 animate-[lightning-flash_8s_ease-in-out_infinite]" />
      </div>

      {/* Glass Header */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="relative z-10">
          {/* Title bar */}
          <div className="h-12 flex items-center justify-between px-4">
            {showSearch ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                    autoFocus
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-2 -mr-2">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 -ml-1 rounded-full bg-white/10 backdrop-blur-sm transition-transform active:scale-90"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <h1 className="text-xl font-bold text-white tracking-tight">Academy</h1>
                </div>
                <button onClick={() => setShowSearch(true)} className="p-2 -mr-2">
                  <Search className="h-5 w-5 text-white/70" />
                </button>
              </>
            )}
          </div>

          {/* Type pills + Language filter row */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide flex-1">
                {availableTypes.map((t) => (
                  <WatchCategoryPill
                    key={t.value}
                    name={t.label}
                    isSelected={selectedType === t.value}
                    onClick={() => setSelectedType(t.value)}
                  />
                ))}
              </div>
              {/* Language popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                    {selectedLang.flag ? selectedLang.flag : <PersianFlag size={14} />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1 bg-[#1e2d4a] border-white/10" align="end">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 active:bg-white/10 transition-colors",
                        preferredLanguage === lang.value && "bg-white/10 text-white font-medium"
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
        </div>
      </div>

      {/* Header Spacer */}
      <div style={{ height: 'calc(120px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Scrollable Content */}
      <div
        ref={academyScrollRef}
        className="flex-1 overflow-y-auto overscroll-contain relative z-10"
        onScroll={handleScroll}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 24px)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 24px)',
        }}
      >
        <div className="p-4 pb-safe space-y-6">
          {/* Enrolled Programs */}
          {enrolledPrograms.length > 0 && selectedType === 'all' && !searchQuery && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Your Programs
              </h2>
              <div className="space-y-3">
                {enrolledPrograms.map((program: any) => (
                  <AcademyProgramCard
                    key={program.slug}
                    title={program.title}
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
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {searchQuery ? 'Results' : selectedType === 'all' ? 'All Programs' : availableTypes.find(f => f.value === selectedType)?.label || 'Programs'}
            </h2>

            {notEnrolledPrograms.length === 0 && enrolledPrograms.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white/30" />
                </div>
                <p className="text-white/50 text-sm">
                  {searchQuery ? `No programs match "${searchQuery}"` : 'No programs available'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notEnrolledPrograms.map((program: any) => (
                  <AcademyProgramCard
                    key={program.slug}
                    title={program.title}
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
              <p className="text-sm text-white/50">Not any programs you want above?</p>
              <button
                onClick={() => navigate('/app/chat?draft=' + encodeURIComponent("Hi! I'd love to have a program for: "))}
                className="text-sm text-blue-400 font-medium flex items-center gap-1 mt-1"
              >
                Tell us what you want <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppBrowsePrograms;
