import { supabase } from '@/integrations/supabase/client';
import { usePrograms } from '@/hooks/usePrograms';
import { SEOHead } from '@/components/SEOHead';
import { Search, X, Loader2, ChevronRight, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useState, useMemo, useCallback } from 'react';
import { useEnrollments, useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import { ProgramCard } from '@/components/app/ProgramCard';
import { ToolCard } from '@/components/app/ToolCard';
import { Input } from '@/components/ui/input';
import { wellnessTools, audioTools, getVisibleComingSoon } from '@/lib/toolsConfig';
import { PromoBanner } from '@/components/app/PromoBanner';
import { HomeBanner } from '@/components/app/HomeBanner';
import { SelfCareQuizBanner } from '@/components/app/SelfCareQuizBanner';
import { ExploreTour, TourHelpButton } from '@/components/app/tour';
import { useReflections, type Reflection } from '@/hooks/useReflections';
import { useBreathingExercises, type BreathingExercise } from '@/hooks/useBreathingExercises';
import { useQuery } from '@tanstack/react-query';
import { CachedImage } from '@/components/ui/CachedImage';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { ToolShortcuts } from '@/components/app/ToolShortcuts';
import { useRoutinesBank, useRoutineBankCategories, useFeaturedRoutinesBank } from '@/hooks/useRoutinesBank';
import { FeaturedRoutineCard } from '@/components/app/FeaturedRoutineCard';
import { SelfCareGoalsCategoryCard } from '@/components/app/SelfCareGoalsCategoryCard';
import { useTaskTemplates } from '@/hooks/useTaskPlanner';

const AppStore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { programs, isLoading: programsLoading } = usePrograms();
  const [enrollingSlug, setEnrollingSlug] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  const { data: enrollments = [] } = useEnrollments();
  const invalidateAllEnrollmentData = useInvalidateAllEnrollmentData();

  const isEnrolled = (slug: string) => {
    return enrollments.includes(slug);
  };

  // Filter to show free programs, free-on-iOS, or programs with iOS Product ID (IAP)
  const freePrograms = useMemo(() => {
    return programs.filter(p => 
      p.isFree || 
      p.priceAmount === 0 || 
      p.is_free_on_ios === true ||
      !!p.ios_product_id
    );
  }, [programs]);

  // Fetch waitlist programs (show_in_app_waitlist = true, not already in freePrograms)
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

  // Combine free programs + waitlist programs for Browse Programs
  // Combine free programs + waitlist programs for Browse Programs
  // Waitlist slugs override free/IAP programs to show as waitlist-only
  const waitlistSlugs = useMemo(() => new Set(waitlistPrograms.map((p: any) => p.slug)), [waitlistPrograms]);
  
  const allBrowsePrograms = useMemo(() => {
    const freeSlugs = new Set(freePrograms.map(p => p.slug));
    
    // Mark existing free programs that are also waitlist
    const markedFree = freePrograms.map(p => ({
      ...p,
      _isWaitlist: waitlistSlugs.has(p.slug),
    }));
    
    // Add waitlist programs not already in free list
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
        priceAmount: 999, // non-zero to avoid FREE badge
        is_free_on_ios: false,
        ios_product_id: undefined,
        _isWaitlist: true,
      }));
    return [...markedFree, ...waitlistOnly];
  }, [freePrograms, waitlistPrograms, waitlistSlugs]);

  // Fetch reflections, breathing, and audio playlists for explore sections
  const { data: reflections } = useReflections();
  const { data: breathingExercises } = useBreathingExercises();
  const { data: audioPlaylists } = useQuery({
    queryKey: ['explore-audio-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url, category, is_free, is_hidden, requires_subscription')
        .eq('is_hidden', false)
        .in('category', ['meditate', 'soundscape'])
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const meditatePlaylists = useMemo(() => audioPlaylists?.filter(p => p.category === 'meditate') || [], [audioPlaylists]);
  const soundscapePlaylists = useMemo(() => audioPlaylists?.filter(p => p.category === 'soundscape') || [], [audioPlaylists]);

  // Fetch routines bank and task templates for explore sections
  const { data: routinesBankData } = useRoutinesBank();
  const { data: taskTemplatesData } = useTaskTemplates();

  const { data: featuredRoutines = [] } = useFeaturedRoutinesBank();

  const displayRoutines = useMemo(() => {
    if (!routinesBankData) return featuredRoutines;
    const featuredIds = new Set(featuredRoutines.map(r => r.id));
    const popular = routinesBankData.filter(r => r.is_popular && !featuredIds.has(r.id));
    return [...featuredRoutines, ...popular].slice(0, 10);
  }, [routinesBankData, featuredRoutines]);

  const popularTasks = useMemo(() => {
    if (!taskTemplatesData) return [];
    return taskTemplatesData.filter(t => t.is_popular).slice(0, 8);
  }, [taskTemplatesData]);

  const { data: routineCategories } = useRoutineBankCategories();
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    routineCategories?.forEach(c => map.set(c.slug, c.name));
    return map;
  }, [routineCategories]);

  const goalCategories = useMemo(() => {
    if (!routineCategories || !taskTemplatesData) return [];
    return routineCategories
      .filter(c => (c.task_display_order ?? 0) > 0 && taskTemplatesData.some(t => t.category === c.slug))
      .sort((a, b) => (a.task_display_order ?? 0) - (b.task_display_order ?? 0));
  }, [routineCategories, taskTemplatesData]);

  const taskCountByCategory = useMemo(() => {
    if (!taskTemplatesData) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const t of taskTemplatesData) {
      map.set(t.category, (map.get(t.category) || 0) + 1);
    }
    return map;
  }, [taskTemplatesData]);

  // Filter tools by search
  const filteredWellnessTools = useMemo(() => {
    const visible = wellnessTools.filter(t => !t.hidden);
    if (!searchQuery.trim()) return visible;
    const query = searchQuery.toLowerCase();
    return visible.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredAudioTools = useMemo(() => {
    if (!searchQuery.trim()) return audioTools;
    const query = searchQuery.toLowerCase();
    return audioTools.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter programs by search only (no category filter anymore)
  const filteredPrograms = useMemo(() => {
    let result = allBrowsePrograms;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p: any) => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [allBrowsePrograms, searchQuery]);

  // Check if any tools match search
  const hasToolMatches = filteredWellnessTools.length > 0 || filteredAudioTools.length > 0;
  const hasProgramMatches = filteredPrograms.length > 0;

  const handleEnroll = async (program: typeof freePrograms[0]) => {
    if (!user?.id) {
      toast.error('Please sign in to enroll');
      return;
    }
    
    setEnrollingSlug(program.slug);
    
    try {
      let roundId: string | null = null;
      const { data: autoEnroll } = await supabase
        .from('program_auto_enrollment')
        .select('round_id')
        .eq('program_slug', program.slug)
        .maybeSingle();
      
      if (autoEnroll?.round_id) {
        roundId = autoEnroll.round_id;
      }
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_name: program.title,
          program_slug: program.slug,
          round_id: roundId,
          status: 'active'
        });
      
      if (error) {
        toast.error('Failed to enroll. Please try again.');
      } else {
        toast.success('Enrolled successfully!');
        invalidateAllEnrollmentData();
        navigate('/app/myprograms');
      }
    } finally {
      setEnrollingSlug(null);
    }
  };

  const comingSoonTools = getVisibleComingSoon();

  return (
    <div className="h-full overflow-hidden flex flex-col bg-background">
      <SEOHead 
        title="Explore - Rilo"
        description="Explore tools, audio experiences, and educational programs"
      />

      {/* Fixed Header */}
      <header 
        className="shrink-0 z-40 bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-4">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search tools & programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10 bg-white/80 dark:bg-black/20 border-border/50 rounded-xl"
                autoFocus
              />
              <button 
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-2 rounded-full transition-transform active:scale-95"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground">Self-Care Tools</h1>
              <div className="flex items-center">
                {startTour && (
                  <TourHelpButton onClick={startTour} />
                )}
                <button 
                  onClick={() => setShowSearch(true)}
                  className="tour-search-button p-2 rounded-full transition-transform active:scale-95"
                >
                  <Search className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Explore Tour */}
      <ExploreTour isFirstVisit={true} onTourReady={handleTourReady} />

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain px-4 space-y-4 pb-24"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {programsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Promo Banner - Explore Page */}
            <PromoBanner location="explore" className="mb-2" />
            <HomeBanner location="explore" className="mb-2" />

            {/* Tools Section */}
            {(!searchQuery || filteredWellnessTools.length > 0 || filteredAudioTools.length > 0) && (
              <section className="tour-tools-section">
                <h2 className="text-sm font-semibold text-foreground mb-2 px-1">
                  All Tools
                </h2>
                {/* All tools in single scrollable row */}
                <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pt-3 pb-2 scrollbar-hide">
                  {filteredWellnessTools.map((tool) => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool}
                      size="compact"
                      className={`tour-tool-${tool.id}`}
                    />
                  ))}
                  {filteredAudioTools
                    .filter(t => t.id === 'meditate' || t.id === 'soundscape')
                    .map((tool) => (
                      <ToolCard 
                        key={tool.id} 
                        tool={tool}
                        size="compact"
                        className={`tour-tool-${tool.id}`}
                      />
                    ))}
                </div>
              </section>
            )}
            {/* Self-Care Goals */}
            {!searchQuery && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-foreground">Self-Care Goals</h2>
                  <Link to="/app/tasksbank" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>
            )}

            {/* Routines Templates Section */}
            {!searchQuery && displayRoutines.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-foreground">Routines Templates</h2>
                  <Link to="/app/routines" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide snap-x snap-mandatory scroll-pl-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {displayRoutines.map((r) => (
                    <div key={r.id} className="shrink-0 w-[85%] snap-start">
                      <FeaturedRoutineCard routine={r} categoryName={categoryNameMap.get(r.category)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* My Shortcuts - right after tools */}
            {!searchQuery && (
              <ToolShortcuts />
            )}

            {/* Self-Care Quiz Banner - Under Tools */}
            <SelfCareQuizBanner className="mb-2" />

            {/* Promo Banner - Under Tools */}
            <PromoBanner location="explore_tools" className="mb-2" />
            <HomeBanner location="explore_tools" className="mb-2" />

            {/* Programs Section */}
            {(!searchQuery || hasProgramMatches) && allBrowsePrograms.length > 0 && (
              <section className="tour-programs-section">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="tour-programs-section-header text-sm font-semibold text-foreground">
                    Academy Programs
                  </h2>
                  <Link to="/app/academy" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Programs Horizontal Scroll */}
                {filteredPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      No programs found
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 overflow-x-auto -mx-4 px-4 pt-3 pb-2 scrollbar-hide">
                    {filteredPrograms.map((program: any) => {
                      const enrolled = isEnrolled(program.slug);
                      const isEnrolling = enrollingSlug === program.slug;
                      const isFree = !enrolled && !program._isWaitlist && (program.isFree || program.priceAmount === 0);
                      
                      return (
                        <button
                          key={program.slug}
                          onClick={() => navigate(`/app/myprograms/${program.slug}`, { state: { from: location.pathname } })}
                          className="relative shrink-0 w-32 text-left transition-transform active:scale-[0.97]"
                        >
                          <div className="relative h-32 w-32 overflow-visible mb-1.5">
                            <div className="h-full w-full rounded-2xl overflow-hidden bg-muted shadow-lg">
                              {program.image ? (
                                <CachedImage src={program.image} alt={program.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                  <Sparkles className="h-8 w-8 text-primary/40" />
                                </div>
                              )}
                            </div>
                            {enrolled ? (
                              <div className="absolute -top-2.5 left-1 z-10 bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Enrolled
                              </div>
                            ) : isFree ? (
                              <div className="absolute -top-2.5 left-1 z-10 bg-[#E2F9F0] text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                <FluentEmoji emoji="🔥" size={10} /> FREE
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs font-medium line-clamp-2 leading-tight">{program.title}</p>
                          {isEnrolling && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* My Shortcuts moved above programs */}

            {/* Reflections Section */}
            {!searchQuery && reflections && reflections.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-foreground">Guided Reflections</h2>
                  <Link to="/app/reflections" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {[0, 1].map((rowIdx) => (
                    <div key={rowIdx} className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-hide">
                      {reflections.slice(rowIdx * 4, rowIdx * 4 + 4).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => navigate(`/app/reflections/${r.id}`, { state: { from: location.pathname } })}
                          className="shrink-0 w-[200px] flex items-center gap-3 p-2.5 text-left transition-transform active:scale-[0.97] bg-accent/60 rounded-xl border border-border/40"
                        >
                          <div className="relative shrink-0">
                            {r.cover_image_url ? (
                              <CachedImage src={r.cover_image_url} alt={r.title} className="h-12 w-12 rounded-xl object-cover" />
                            ) : (
                              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: r.cover_color || '#f3f4f6' }}>
                                <FluentEmoji emoji={r.emoji || '🪞'} size={26} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13px] leading-tight">{r.title}</p>
                            {r.subtitle && (
                              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{r.subtitle}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Breathe Section */}
            {!searchQuery && breathingExercises && breathingExercises.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-foreground">Breathe Practice</h2>
                  <Link to="/app/breathe" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
                  {breathingExercises.filter(e => e.is_active).slice(0, 8).map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => navigate(`/app/breathe?exercise=${exercise.id}`, { state: { from: location.pathname } })}
                      className="shrink-0 w-[140px] flex items-center gap-2 py-2 text-left transition-transform active:scale-[0.97] bg-accent/60 rounded-xl px-2 border border-border/40"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FluentEmoji emoji={exercise.emoji || '🌬️'} size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-tight line-clamp-2">{exercise.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}


            {!searchQuery && meditatePlaylists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-foreground">Guided Meditation</h2>
                  <Link to="/app/player?category=meditate" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex items-start gap-3 overflow-x-auto -mx-4 px-4 pt-3 pb-2 scrollbar-hide">
                  {meditatePlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => navigate(`/app/player/playlist/${playlist.id}`, { state: { from: location.pathname } })}
                      className="shrink-0 w-32 text-left transition-transform active:scale-[0.97]"
                    >
                      <div className="relative h-32 w-32 overflow-visible mb-1.5">
                         <div className="h-full w-full rounded-2xl overflow-hidden bg-muted shadow-lg">
                          {playlist.cover_image_url ? (
                            <CachedImage src={playlist.cover_image_url} alt={playlist.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                              <FluentEmoji emoji="🧘" size={36} />
                            </div>
                          )}
                        </div>
                        {playlist.requires_subscription ? (
                          <div className="absolute -top-2.5 left-1 z-10 bg-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            <Crown className="h-2.5 w-2.5" /> PLUS
                          </div>
                        ) : (
                          <div className="absolute -top-2.5 left-1 z-10 bg-[#E2F9F0] text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            <FluentEmoji emoji="🔥" size={10} /> FREE
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2 leading-tight">{playlist.name}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Soundscapes Section */}
            {!searchQuery && soundscapePlaylists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-foreground">Sound Scapes</h2>
                  <Link to="/app/player?category=soundscape" className="text-xs text-primary font-medium flex items-center gap-0.5">
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex items-start gap-3 overflow-x-auto -mx-4 px-4 pt-3 pb-2 scrollbar-hide">
                  {soundscapePlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => navigate(`/app/player/playlist/${playlist.id}`, { state: { from: location.pathname } })}
                      className="shrink-0 w-32 text-left transition-transform active:scale-[0.97]"
                    >
                      <div className="relative h-32 w-32 overflow-visible mb-1.5">
                        <div className="h-full w-full rounded-2xl overflow-hidden bg-muted shadow-lg">
                          {playlist.cover_image_url ? (
                            <CachedImage src={playlist.cover_image_url} alt={playlist.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-cyan-100">
                              <FluentEmoji emoji="🌊" size={36} />
                            </div>
                          )}
                        </div>
                        {playlist.requires_subscription ? (
                          <div className="absolute -top-2.5 left-1 z-10 bg-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            <Crown className="h-2.5 w-2.5" /> PLUS
                          </div>
                        ) : (
                          <div className="absolute -top-2.5 left-1 z-10 bg-[#E2F9F0] text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            <FluentEmoji emoji="🔥" size={10} /> FREE
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2 leading-tight">{playlist.name}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* No Results */}
            {searchQuery && !hasToolMatches && !hasProgramMatches && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-1">No Results Found</h2>
                <p className="text-muted-foreground text-sm">
                  No tools or programs match "{searchQuery}"
                </p>
              </div>
            )}
          </>
        )}

        {/* CTA to support chat */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm text-muted-foreground">Not finding what you need?</p>
          <button
            onClick={() => navigate('/app/chat?draft=' + encodeURIComponent("Hi! I'd love to have a tool for: "))}
            className="text-sm text-blue-500 font-medium flex items-center gap-1 mt-1"
          >
            Tell us what you want <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppStore;
