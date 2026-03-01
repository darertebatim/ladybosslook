import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Loader2, Wand2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { RoutineBankCard } from '@/components/app/RoutineBankCard';
import {
  useRoutineBankCategories,
  useRoutinesBank,
  usePopularRoutinesBank,
  useFeaturedRoutinesBank,
} from '@/hooks/useRoutinesBank';
import { RitualsTour, TourHelpButton } from '@/components/app/tour';

export default function AppInspire() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: featuredRoutines } = useFeaturedRoutinesBank();
  const { data: popularRoutines, isLoading: popularLoading } = usePopularRoutinesBank();
  const { data: filteredRoutines, isLoading: routinesLoading } = useRoutinesBank(
    selectedCategory && selectedCategory !== 'popular' && selectedCategory !== 'all'
      ? selectedCategory
      : undefined
  );

  const displayRoutines = useMemo(() => {
    if (selectedCategory === 'popular') {
      return popularRoutines;
    }
    if (selectedCategory === 'all') {
      return filteredRoutines;
    }
    return filteredRoutines;
  }, [selectedCategory, filteredRoutines, popularRoutines]);

  const isLoading = categoriesLoading || popularLoading || (selectedCategory && selectedCategory !== 'popular' && routinesLoading);

  const searchedRoutines = displayRoutines?.filter(routine => 
    !searchQuery || 
    routine.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Rituals</h1>
          </div>
          <div className="flex items-center gap-1">
            {startTour && (
              <TourHelpButton onClick={startTour} />
            )}
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
              placeholder="Search rituals..."
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
          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-3">
                BROWSE CATEGORIES
              </h2>
              <ScrollArea className="w-full tour-ritual-categories">
                <div className="flex gap-2 px-4 pb-2">
                  <CategoryCircle
                    name="All Rituals"
                    icon="Sparkles"
                    color="purple"
                    isSelected={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                  />
                  {categories.filter(c => c.slug !== 'pro').map((category) => (
                    <CategoryCircle
                      key={category.slug}
                      name={category.name}
                      icon={category.icon}
                      emoji={category.emoji}
                      color={category.color}
                      isSelected={selectedCategory === category.slug}
                      onClick={() => setSelectedCategory(category.slug)}
                    />
                  ))}
                  {categories.find(c => c.slug === 'pro') && (
                    <CategoryCircle
                      name={categories.find(c => c.slug === 'pro')!.name}
                      icon={categories.find(c => c.slug === 'pro')!.icon}
                      emoji={categories.find(c => c.slug === 'pro')!.emoji}
                      color={categories.find(c => c.slug === 'pro')!.color}
                      isSelected={selectedCategory === 'pro'}
                      onClick={() => setSelectedCategory('pro')}
                    />
                  )}
                  <CategoryCircle
                    name="Popular"
                    icon="Star"
                    color="yellow"
                    isSelected={selectedCategory === 'popular'}
                    onClick={() => setSelectedCategory('popular')}
                  />
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Routines Grid */}
          {searchedRoutines && searchedRoutines.length > 0 && (
            <div className="mt-5 px-4 w-full max-w-full overflow-hidden pb-8">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {selectedCategory === 'popular'
                  ? 'POPULAR RITUALS'
                  : selectedCategory === 'all'
                  ? 'ALL RITUALS'
                  : categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'RITUALS'
                }
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full max-w-full">
                  {searchedRoutines.map((routine, index) => (
                    <RoutineBankCard
                      key={routine.id}
                      routine={routine}
                      onClick={() => navigate(`/app/rituals/${routine.id}`, { state: { from: location.pathname } })}
                      className={index === 0 ? 'tour-ritual-card' : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Tour */}
      <RitualsTour isFirstVisit={true} onTourReady={handleTourReady} />
    </div>
  );
}
