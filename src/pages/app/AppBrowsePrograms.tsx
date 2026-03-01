import { useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Search, X, GraduationCap, ChevronLeft } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useEnrollments } from '@/hooks/useAppData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProgramCard } from '@/components/app/ProgramCard';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { WatchCategoryPill } from '@/components/video/WatchCategoryPill';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'course', label: 'Course' },
  { value: 'group-coaching', label: 'Coaching' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'event', label: 'Event' },
  { value: 'subscription', label: 'Club' },
];

const AppBrowsePrograms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { programs, isLoading } = usePrograms();
  const { data: enrollments = [] } = useEnrollments();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [scrollY, setScrollY] = useState(0);

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
    const freeSlugs = new Set(freePrograms.map(p => p.slug));
    const markedFree = freePrograms.map(p => ({
      ...p,
      _isWaitlist: waitlistSlugs.has(p.slug),
    }));
    const waitlistOnly = waitlistPrograms
      .filter((p: any) => !freeSlugs.has(p.slug))
      .map((p: any) => ({
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
      }));
    return [...markedFree, ...waitlistOnly];
  }, [freePrograms, waitlistPrograms, waitlistSlugs]);

  // Available type filters based on actual data
  const availableTypes = useMemo(() => {
    const types = new Set(allPrograms.map((p: any) => p.type).filter(Boolean));
    return TYPE_FILTERS.filter(f => f.value === 'all' || types.has(f.value));
  }, [allPrograms]);

  const filtered = useMemo(() => {
    let result = allPrograms;
    if (selectedType !== 'all') {
      result = result.filter((p: any) => p.type === selectedType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) =>
        p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPrograms, searchQuery, selectedType]);

  // Enrolled programs shown separately
  const enrolledPrograms = useMemo(() => {
    return filtered.filter((p: any) => isEnrolled(p.slug));
  }, [filtered, enrollments]);

  const notEnrolledPrograms = useMemo(() => {
    return filtered.filter((p: any) => !isEnrolled(p.slug));
  }, [filtered, enrollments]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#1a1a2e' }}>
        <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-12 flex items-center px-4"><Skeleton className="h-6 w-32 bg-white/10" /></div>
          <div className="px-4 pb-3 flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-20 h-8 rounded-full bg-white/10" />)}
          </div>
        </div>
        <div style={{ height: 'calc(130px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl bg-white/10" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#1a1a2e' }}>
      <SEOHead title="Academy Programs - Simora" description="Browse all academy programs" />

      {/* Gradient background */}
      <div className="fixed top-0 left-0 right-0 z-0 h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-indigo-900/20 to-[#1a1a2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent" />
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

          {/* Type pills */}
          {availableTypes.length > 2 && (
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
                {availableTypes.map((t) => (
                  <WatchCategoryPill
                    key={t.value}
                    name={t.label}
                    isSelected={selectedType === t.value}
                    onClick={() => setSelectedType(t.value)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header Spacer */}
      <div style={{ height: `calc(${availableTypes.length > 2 ? '120' : '80'}px + env(safe-area-inset-top, 0px))` }} className="shrink-0" />

      {/* Scrollable Content */}
      <div
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
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Your Programs
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {enrolledPrograms.map((program: any) => (
                  <ProgramCard
                    key={program.slug}
                    title={program.title}
                    image={program.image}
                    type={program.type}
                    language={program.language}
                    isFree={!program._isWaitlist && (program.isFree || program.priceAmount === 0)}
                    isEnrolled={true}
                    onClick={() => navigate(`/app/programs/${program.slug}`, { state: { from: location.pathname } })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All / Not Enrolled Programs */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              {searchQuery ? 'Results' : selectedType === 'all' ? 'All Programs' : TYPE_FILTERS.find(f => f.value === selectedType)?.label || 'Programs'}
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
              <div className="grid grid-cols-2 gap-3">
                {notEnrolledPrograms.map((program: any) => (
                  <ProgramCard
                    key={program.slug}
                    title={program.title}
                    image={program.image}
                    type={program.type}
                    language={program.language}
                    isFree={!program._isWaitlist && (program.isFree || program.priceAmount === 0)}
                    isEnrolled={false}
                    onClick={() => navigate(`/app/programs/${program.slug}`, { state: { from: location.pathname } })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppBrowsePrograms;
