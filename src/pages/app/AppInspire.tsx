import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Loader2, CalendarPlus, ChevronRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { RoutineBankCard } from '@/components/app/RoutineBankCard';
import {
  useRoutineBankCategories,
  useRoutinesBank,
  usePopularRoutinesBank,
} from '@/hooks/useRoutinesBank';
import { RoutinesTour, TourHelpButton } from '@/components/app/tour';

export default function AppInspire() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: allRoutines, isLoading: routinesLoading } = useRoutinesBank();
  const { data: popularRoutines, isLoading: popularLoading } = usePopularRoutinesBank();

  const isLoading = categoriesLoading || routinesLoading || popularLoading;

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
            <h1 className="text-xl font-bold text-foreground">Routines</h1>
          </div>
          <div className="flex items-center gap-1">
            {startTour && <TourHelpButton onClick={startTour} />}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">
          {/* Categories - quick nav */}
          {categories && categories.length > 0 && (
            <div className="mt-4">
              <ScrollArea className="w-full tour-routine-categories">
                <div className="flex gap-2 px-4 pb-2">
                  {nonEmptyCategories.filter(c => c.slug !== 'pro').map((category) => (
                    <CategoryCircle
                      key={category.slug}
                      name={category.name}
                      icon={category.icon}
                      emoji={category.emoji}
                      color={category.color}
                      onClick={() => navigate(`/app/routines/category/${category.slug}`, { state: { from: location.pathname } })}
                    />
                  ))}
                  {nonEmptyCategories.find(c => c.slug === 'pro') && (
                    <CategoryCircle
                      name={nonEmptyCategories.find(c => c.slug === 'pro')!.name}
                      icon={nonEmptyCategories.find(c => c.slug === 'pro')!.icon}
                      emoji={nonEmptyCategories.find(c => c.slug === 'pro')!.emoji}
                      color={nonEmptyCategories.find(c => c.slug === 'pro')!.color}
                      onClick={() => navigate(`/app/routines/category/pro`, { state: { from: location.pathname } })}
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
                    <h2 className="text-base font-bold text-foreground">Popular</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                    {filteredPopular.map((routine, index) => (
                      <div key={routine.id} className="shrink-0 w-40">
                        <RoutineBankCard
                          routine={routine}
                          onClick={() => navigate(`/app/routines/${routine.id}`, { state: { from: location.pathname } })}
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
                      <h2 className="text-base font-bold text-foreground">{category.name}</h2>
                      <button
                        onClick={() => navigate(`/app/routines/category/${category.slug}`, { state: { from: location.pathname } })}
                        className="text-xs text-primary font-medium flex items-center gap-0.5"
                      >
                        All <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                      {catRoutines.slice(0, 8).map((routine) => (
                        <div key={routine.id} className="shrink-0 w-40">
                          <RoutineBankCard
                            routine={routine}
                            onClick={() => navigate(`/app/routines/${routine.id}`, { state: { from: location.pathname } })}
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
                      <h2 className="text-base font-bold text-foreground">{proCat.name}</h2>
                      <button
                        onClick={() => navigate(`/app/routines/category/pro`, { state: { from: location.pathname } })}
                        className="text-xs text-primary font-medium flex items-center gap-0.5"
                      >
                        All <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                      {proRoutines.slice(0, 8).map((routine) => (
                        <div key={routine.id} className="shrink-0 w-40">
                          <RoutineBankCard
                            routine={routine}
                            onClick={() => navigate(`/app/routines/${routine.id}`, { state: { from: location.pathname } })}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Feature Tour */}
      <RoutinesTour isFirstVisit={true} onTourReady={handleTourReady} />
    </div>
  );
}
