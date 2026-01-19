import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { RoutinePlanCard } from '@/components/app/RoutinePlanCard';
import { InspireBanner } from '@/components/app/InspireBanner';
import {
  useRoutineCategories,
  useRoutinePlans,
  useFeaturedPlans,
  usePopularPlans,
  useProRoutinePlans,
} from '@/hooks/useRoutinePlans';

export default function AppInspire() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useRoutineCategories();
  const { data: featuredPlans } = useFeaturedPlans();
  const { data: popularPlans, isLoading: popularLoading } = usePopularPlans();
  const { data: proPlans } = useProRoutinePlans();
  const { data: filteredPlans, isLoading: plansLoading } = useRoutinePlans(
    selectedCategory || undefined
  );

  const displayPlans = selectedCategory ? filteredPlans : popularPlans;
  const isLoading = categoriesLoading || popularLoading || (selectedCategory && plansLoading);

  // Filter by search query
  const searchedPlans = displayPlans?.filter(plan => 
    !searchQuery || 
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Inspire</h1>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Search Bar */}
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
          {/* Featured Banner Carousel */}
          {featuredPlans && featuredPlans.length > 0 && !selectedCategory && !searchQuery && (
            <div className="px-4 pt-4">
              <InspireBanner plans={featuredPlans} />
            </div>
          )}

          {/* Pro Routines Section */}
          {proPlans && proPlans.length > 0 && !selectedCategory && !searchQuery && (
            <div className="mt-5">
              <div className="flex items-center gap-2 px-4 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  PRO ROUTINES
                </h2>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-3 px-4 pb-2">
                  {proPlans.map((plan) => (
                    <div key={plan.id} className="w-40 shrink-0 relative">
                      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-md">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <RoutinePlanCard
                        plan={plan}
                        onClick={() => navigate(`/app/inspire/${plan.id}`)}
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-3">
                BROWSE CATEGORIES
              </h2>
              <ScrollArea className="w-full">
                <div className="flex gap-2 px-4 pb-2">
                  <CategoryCircle
                    name="All"
                    icon="LayoutGrid"
                    color="purple"
                    isSelected={!selectedCategory}
                    onClick={() => setSelectedCategory(null)}
                  />
                  {categories.map((category) => (
                    <CategoryCircle
                      key={category.id}
                      name={category.name}
                      icon={category.icon}
                      color={category.color}
                      isSelected={selectedCategory === category.slug}
                      onClick={() => setSelectedCategory(
                        selectedCategory === category.slug ? null : category.slug
                      )}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Plans Grid */}
          <div className="mt-5 px-4 w-full max-w-full overflow-hidden">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              {selectedCategory 
                ? categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'ROUTINES'
                : 'POPULAR ROUTINES'
              }
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchedPlans && searchedPlans.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 w-full max-w-full">
                {searchedPlans.map((plan) => (
                  <RoutinePlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => navigate(`/app/inspire/${plan.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No routines found' : 'No routines available yet'}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Check back soon for new content!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
