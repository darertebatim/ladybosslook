import { useState, useMemo, useCallback } from 'react';
import { haptic } from '@/lib/haptics';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Loader2, CalendarPlus, ChevronRight, Flame, Target, RotateCcw } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { RoutineBankCard } from '@/components/app/RoutineBankCard';
import {
  useRoutineBankCategories,
  useRoutinesBank,
  usePopularRoutinesBank,
  useFeaturedRoutinesBank,
  useCompletedRoutines,
} from '@/hooks/useRoutinesBank';
import { RoutinesTour, TourHelpButton } from '@/components/app/tour';
import { PromoBanner } from '@/components/app/PromoBanner';
import { FeaturedRoutineCard } from '@/components/app/FeaturedRoutineCard';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites';
import { cn } from '@/lib/utils';

export default function AppInspire() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);
  const { scrollRef, saveScroll } = useScrollRestore('routines_scroll');

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  const navigateWithScroll = useCallback((path: string) => {
    haptic.light();
    saveScroll();
    navigate(path, { state: { from: location.pathname } });
  }, [saveScroll, navigate, location.pathname]);

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: allRoutines, isLoading: routinesLoading } = useRoutinesBank();
  const { data: popularRoutines, isLoading: popularLoading } = usePopularRoutinesBank();
  const { data: featuredRoutines = [] } = useFeaturedRoutinesBank();
  const { data: completedRoutines } = useCompletedRoutines();

  const isLoading = categoriesLoading || routinesLoading || popularLoading;

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach(cat => map.set(cat.slug, cat.name));
    return map;
  }, [categories]);

  // Group routines by category
  const routinesByCategory = useMemo(() => {
    if (!allRoutines || !categories) return {};
    const grouped: Record<string, typeof allRoutines> = {};
    for (const cat of categories) {
      grouped[cat.slug] = allRoutines.filter(r => r.category === cat.slug);
    }
    return grouped;
  }, [allRoutines, categories]);

  // Filter by search
  const matchesSearch = (routine: typeof allRoutines extends (infer T)[] | undefined ? T : never) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return routine.title.toLowerCase().includes(q) || routine.subtitle?.toLowerCase().includes(q);
  };

  const filteredPopular = popularRoutines?.filter(matchesSearch);

  // Challenge routines
  const challengeRoutines = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines.filter(r => r.schedule_type === 'challenge').filter(matchesSearch);
  }, [allRoutines, searchQuery]);

  // Project routines
  const projectRoutines = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines.filter(r => r.schedule_type === 'project').filter(matchesSearch);
  }, [allRoutines, searchQuery]);

  // Reset routines (is_focus)
  const resetRoutines = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines.filter(r => r.is_focus === true).filter(matchesSearch);
  }, [allRoutines, searchQuery]);

  // Only show categories that have routines
  const nonEmptyCategories = useMemo(() => {
    if (!categories || !allRoutines) return [];
    return categories.filter(c => allRoutines.some(r => r.category === c.slug));
  }, [categories, allRoutines]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Routines Library</h1>
          </div>
          <div className="flex items-center gap-1">
            {startTour && <TourHelpButton onClick={startTour} />}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full active:bg-muted/50 transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-full active:bg-muted/50 transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-2 animate-in slide-in-from-top duration-200">
            <Input
              type="search"
              placeholder="Search routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
            />
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">
          {/* Promo Banner - Top */}
          <PromoBanner location="routines_top" className="px-4 pt-3" carousel />

          {/* Categories - quick nav */}
          {categories && categories.length > 0 && (
            <div className="mt-4">
              <ScrollArea className="w-full tour-routine-categories">
                <div className="flex gap-2 px-4 pb-2">
                  {resetRoutines.length > 0 && (
                    <CategoryCircle
                      name="Reset"
                      icon="RotateCcw"
                      emoji="🫧"
                      color="violet"
                      onClick={() => {
                        const el = document.getElementById('routine-category-reset');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    />
                  )}
                  {nonEmptyCategories.filter(c => c.slug !== 'pro').map((category) => (
                    <CategoryCircle
                      key={category.slug}
                      name={category.name}
                      icon={category.icon}
                      emoji={category.emoji}
                      color={category.color}
                      onClick={() => navigateWithScroll(`/app/routines/category/${category.slug}`)}
                    />
                  ))}
                  {nonEmptyCategories.find(c => c.slug === 'pro') && (
                    <CategoryCircle
                      name={nonEmptyCategories.find(c => c.slug === 'pro')!.name}
                      icon={nonEmptyCategories.find(c => c.slug === 'pro')!.icon}
                      emoji={nonEmptyCategories.find(c => c.slug === 'pro')!.emoji}
                      color={nonEmptyCategories.find(c => c.slug === 'pro')!.color}
                      onClick={() => navigateWithScroll(`/app/routines/category/pro`)}
                    />
                  )}
                  {challengeRoutines.length > 0 && (
                    <CategoryCircle
                      name="Challenges"
                      icon="Flame"
                      emoji="🔥"
                      color="orange"
                      onClick={() => {
                        const el = document.getElementById('routine-category-challenges');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    />
                  )}
                  {projectRoutines.length > 0 && (
                    <CategoryCircle
                      name="Projects"
                      icon="Target"
                      emoji="🎯"
                      color="blue"
                      onClick={() => {
                        const el = document.getElementById('routine-category-projects');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    />
                  )}
                  {filteredPopular && filteredPopular.length > 0 && (
                    <CategoryCircle
                      name="Popular"
                      icon="Star"
                      color="yellow"
                      onClick={() => {
                        const el = document.getElementById('routine-category-popular');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    />
                  )}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Featured Routines Carousel */}
          {featuredRoutines.length > 0 && (
            <div className="mt-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xl font-bold text-foreground">
                  Featured
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide snap-x snap-mandatory scroll-pl-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                {featuredRoutines.map((routine) => (
                  <div key={routine.id} className="shrink-0 w-[85%] snap-start">
                    <FeaturedRoutineCard routine={routine} categoryName={categoryNameMap.get(routine.category)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promo Banner - Under Categories */}
          <PromoBanner location="routines_after_categories" className="px-4 pb-2" carousel />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 mt-4 pb-8">
              {/* Popular Section */}
              {filteredPopular && filteredPopular.length > 0 && (
                <section id="routine-category-popular">
                  <div className="flex items-center justify-between mb-2 px-4">
                    <h2 className="text-xl font-bold text-foreground">Popular</h2>
                    <button
                      onClick={() => navigateWithScroll(`/app/routines/category/popular`)}
                      className="text-sm text-primary font-medium flex items-center gap-0.5"
                    >
                      All <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                    {filteredPopular.map((routine, index) => (
                      <div key={routine.id} className="shrink-0 w-40">
                        <RoutineBankCard
                          routine={routine}
                          onClick={() => navigateWithScroll(`/app/routines/${routine.id}`)}
                          className={index === 0 ? 'tour-routine-card' : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Per-category sections */}
              {nonEmptyCategories?.filter(c => c.slug !== 'pro').map((category) => {
                const catRoutines = routinesByCategory[category.slug]?.filter(matchesSearch) || [];
                if (catRoutines.length === 0) return null;

                return (
                  <section key={category.slug} id={`routine-category-${category.slug}`}>
                    <div className="flex items-center justify-between mb-2 px-4">
                      <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                      <button
                        onClick={() => navigateWithScroll(`/app/routines/category/${category.slug}`)}
                        className="text-sm text-primary font-medium flex items-center gap-0.5"
                      >
                        All <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                      {catRoutines.slice(0, 8).map((routine) => (
                        <div key={routine.id} className="shrink-0 w-40">
                          <RoutineBankCard
                            routine={routine}
                            onClick={() => navigateWithScroll(`/app/routines/${routine.id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Pro category at the end */}
              {nonEmptyCategories?.find(c => c.slug === 'pro') && (() => {
                const proRoutines = routinesByCategory['pro']?.filter(matchesSearch) || [];
                if (proRoutines.length === 0) return null;
                const proCat = nonEmptyCategories.find(c => c.slug === 'pro')!;

                return (
                  <section id="routine-category-pro">
                    <div className="flex items-center justify-between mb-2 px-4">
                      <h2 className="text-xl font-bold text-foreground">{proCat.name}</h2>
                      <button
                        onClick={() => navigateWithScroll(`/app/routines/category/pro`)}
                        className="text-sm text-primary font-medium flex items-center gap-0.5"
                      >
                        All <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                      {proRoutines.slice(0, 8).map((routine) => (
                        <div key={routine.id} className="shrink-0 w-40">
                          <RoutineBankCard
                            routine={routine}
                            onClick={() => navigateWithScroll(`/app/routines/${routine.id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* Reset Section */}
              {resetRoutines.length > 0 && (
                <section id="routine-category-reset">
                  <div className="flex items-center justify-between mb-2 px-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                      <RotateCcw className="h-5 w-5 text-violet-500" />
                      Reset
                    </h2>
                    <button
                      onClick={() => navigateWithScroll(`/app/routines/category/reset`)}
                      className="text-sm text-primary font-medium flex items-center gap-0.5"
                    >
                      All <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                    {resetRoutines.slice(0, 8).map((routine) => (
                      <div key={routine.id} className="shrink-0 w-40">
                        <RoutineBankCard
                          routine={routine}
                          onClick={() => navigateWithScroll(`/app/routines/${routine.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Challenges Section */}
              {challengeRoutines.length > 0 && (
                <section id="routine-category-challenges">
                  <div className="flex items-center justify-between mb-2 px-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Challenges
                    </h2>
                    <button
                      onClick={() => navigateWithScroll(`/app/routines/category/challenges`)}
                      className="text-sm text-primary font-medium flex items-center gap-0.5"
                    >
                      All <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                    {challengeRoutines.map((routine) => (
                      <div key={routine.id} className="shrink-0 w-40">
                        <RoutineBankCard
                          routine={routine}
                          onClick={() => navigateWithScroll(`/app/routines/${routine.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects Section */}
              {projectRoutines.length > 0 && (
                <section id="routine-category-projects">
                  <div className="flex items-center justify-between mb-2 px-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                      <Target className="h-5 w-5 text-blue-500" />
                      Projects
                    </h2>
                    <button
                      onClick={() => navigateWithScroll(`/app/routines/category/projects`)}
                      className="text-sm text-primary font-medium flex items-center gap-0.5"
                    >
                      All <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                    {projectRoutines.map((routine) => (
                      <div key={routine.id} className="shrink-0 w-40">
                        <RoutineBankCard
                          routine={routine}
                          onClick={() => navigateWithScroll(`/app/routines/${routine.id}`)}
                          isCompleted={completedRoutines?.has(routine.id)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA to support chat */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-sm text-muted-foreground">Not any routines you want above?</p>
                <button
                  onClick={() => navigate('/app/chat?draft=' + encodeURIComponent("Hi! I'd love to have a routine for: "))}
                  className="text-sm text-blue-500 font-medium flex items-center gap-1 mt-1"
                >
                  Tell us what you want <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Tour */}
      <RoutinesTour isFirstVisit={true} onTourReady={handleTourReady} />
    </div>
  );
}
