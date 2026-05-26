import { useState, useMemo, useCallback } from "react";
import { haptic } from "@/lib/haptics";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  Loader2,
  CalendarPlus,
  ChevronRight,
  Flame,
  Target,
  RotateCcw,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CategoryCircle } from "@/components/app/CategoryCircle";
import { RoutineBankCard } from "@/components/app/RoutineBankCard";
import { BackButton } from "@/components/app/BackButton";
import { IOSIconButton } from "@/components/app/ui/IOSIconButton";
import {
  useRoutineBankCategories,
  useRoutinesBank,
  usePopularRoutinesBank,
  useFeaturedRoutinesBank,
  useCompletedRoutines,
} from "@/hooks/useRoutinesBank";
import { PromoBanner } from "@/components/app/PromoBanner";
import { HomeBanner } from "@/components/app/HomeBanner";
import { FeaturedRoutineCard } from "@/components/app/FeaturedRoutineCard";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { useRoutineFavorites } from "@/hooks/useRoutineFavorites";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function AppInspire() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const { scrollRef, saveScroll } = useScrollRestore("routines_scroll");

  const navigateWithScroll = useCallback(
    (path: string) => {
      haptic.light();
      saveScroll();
      navigate(path, { state: { from: location.pathname } });
    },
    [saveScroll, navigate, location.pathname],
  );

  const { data: categories, isLoading: categoriesLoading } =
    useRoutineBankCategories();
  const { data: allRoutines, isLoading: routinesLoading } = useRoutinesBank();
  const { data: popularRoutines, isLoading: popularLoading } =
    usePopularRoutinesBank();
  const { data: featuredRoutines = [] } = useFeaturedRoutinesBank();
  const { data: completedRoutines } = useCompletedRoutines();
  const { favoriteIds } = useRoutineFavorites();

  const isLoading = categoriesLoading || routinesLoading || popularLoading;

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((cat) => map.set(cat.slug, cat.name));
    return map;
  }, [categories]);

  // Group routines by category
  const routinesByCategory = useMemo(() => {
    if (!allRoutines || !categories) return {};
    const grouped: Record<string, typeof allRoutines> = {};
    for (const cat of categories) {
      grouped[cat.slug] = allRoutines.filter((r) => r.category === cat.slug);
    }
    return grouped;
  }, [allRoutines, categories]);

  // Filter by search
  const matchesSearch = (
    routine: typeof allRoutines extends (infer T)[] | undefined ? T : never,
  ) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      routine.title.toLowerCase().includes(q) ||
      routine.subtitle?.toLowerCase().includes(q)
    );
  };

  const filteredPopular = popularRoutines?.filter(matchesSearch);

  // Challenge routines
  const challengeRoutines = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines
      .filter((r) => r.schedule_type === "drip")
      .filter(matchesSearch);
  }, [allRoutines, searchQuery]);

  // Project routines
  const projectRoutines = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines
      .filter((r) => r.schedule_type === "project")
      .filter(matchesSearch);
  }, [allRoutines, searchQuery]);

  // Reset routines (is_focus)
  const resetRoutines = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines.filter((r) => r.is_focus === true).filter(matchesSearch);
  }, [allRoutines, searchQuery]);

  // Only show categories that have routines
  const nonEmptyCategories = useMemo(() => {
    if (!categories || !allRoutines) return [];
    return categories.filter((c) =>
      allRoutines.some((r) => r.category === c.slug),
    );
  }, [categories, allRoutines]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Glassy Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white/35 dark:bg-black/20 backdrop-blur-xl rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 pt-3 pb-3 flex items-center justify-between min-h-[52px] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BackButton showLabel={false} className="-ml-2" />
            <CalendarPlus className="w-5 h-5 text-[hsl(var(--brand-primary))] shrink-0" />
            <h1 className="text-xl font-bold text-fg-warm truncate">
              {t('inspirePage.title')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <IOSIconButton
              size="sm"
              onClick={() => { haptic.light(); setShowSearch(!showSearch); }}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </IOSIconButton>
            <IOSIconButton
              size="sm"
              onClick={() => { haptic.light(); setShowFavorites(!showFavorites); }}
              aria-label="Favorites"
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  showFavorites && "fill-red-500 text-red-500",
                )}
              />
            </IOSIconButton>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-3 animate-in slide-in-from-top duration-200">
            <Input
              type="search"
              placeholder={t('inspirePage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/70 dark:bg-white/10 border-0 shadow-ios rounded-full focus-visible:ring-0"
            />
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div style={{ height: "calc(56px + env(safe-area-inset-top, 0px))" }} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden w-full"
      >
        <div className="pb-safe w-full max-w-full">
          {/* Favorites View */}
          {showFavorites ? (
            <div className="px-4 pt-4 space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" /> {t('inspirePage.myFavorites')}
              </h2>
              {favoriteIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">
                    {t('inspirePage.noFavorites')}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {t('inspirePage.noFavoritesHint')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {allRoutines
                    ?.filter((r) => favoriteIds.includes(r.id))
                    .map((routine) => (
                      <RoutineBankCard
                        hideFocusBadge
                        key={routine.id}
                        routine={routine}
                        onClick={() =>
                          navigateWithScroll(`/app/routines/${routine.id}`)
                        }
                        isCompleted={completedRoutines?.has(routine.id)}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Promo Banner - Top */}
              <PromoBanner
                location="routines_top"
                className="px-4 pt-3"
                carousel
              />
              <HomeBanner location="routines_top" className="px-4 pt-3" />

              {/* Categories - quick nav */}
              {categories && categories.length > 0 && (
                <div className="mt-4">
                  <ScrollArea className="w-full tour-routine-categories">
                    <div className="flex gap-2 px-4 pb-2">
                      {nonEmptyCategories
                        .filter((c) => c.slug !== "pro")
                        .map((category) => (
                          <CategoryCircle
                            key={category.slug}
                            name={category.name}
                            icon={category.icon}
                            emoji={category.emoji}
                            color={category.color}
                            onClick={() =>
                              navigateWithScroll(
                                `/app/routines/category/${category.slug}`,
                              )
                            }
                          />
                        ))}
                      {nonEmptyCategories.find((c) => c.slug === "pro") && (
                        <CategoryCircle
                          name={
                            nonEmptyCategories.find((c) => c.slug === "pro")!
                              .name
                          }
                          icon={
                            nonEmptyCategories.find((c) => c.slug === "pro")!
                              .icon
                          }
                          emoji={
                            nonEmptyCategories.find((c) => c.slug === "pro")!
                              .emoji
                          }
                          color={
                            nonEmptyCategories.find((c) => c.slug === "pro")!
                              .color
                          }
                          onClick={() =>
                            navigateWithScroll(`/app/routines/category/pro`)
                          }
                        />
                      )}
                      {challengeRoutines.length > 0 && (
                        <CategoryCircle
                          name={t('inspirePage.challenges')}
                          icon="Flame"
                          emoji="🔥"
                          color="orange"
                          onClick={() => {
                            const el = document.getElementById(
                              "routine-category-challenges",
                            );
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                        />
                      )}
                      {resetRoutines.length > 0 && (
                        <CategoryCircle
                          name={t('inspirePage.focus')}
                          icon="RotateCcw"
                          emoji="🫧"
                          color="violet"
                          onClick={() => {
                            const el = document.getElementById(
                              "routine-category-reset",
                            );
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                        />
                      )}
                      {projectRoutines.length > 0 && (
                        <CategoryCircle
                          name={t('inspirePage.projects')}
                          icon="Target"
                          emoji="🎯"
                          color="blue"
                          onClick={() => {
                            const el = document.getElementById(
                              "routine-category-projects",
                            );
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                        />
                      )}
                      {filteredPopular && filteredPopular.length > 0 && (
                        <CategoryCircle
                          name={t('inspirePage.popular')}
                          icon="Star"
                          color="yellow"
                          onClick={() => {
                            const el = document.getElementById(
                              "routine-category-popular",
                            );
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
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
                      {t('inspirePage.featured')}
                    </h2>
                  </div>
                  <div
                    className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide snap-x snap-mandatory scroll-pl-4"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {featuredRoutines.map((routine) => (
                      <div
                        key={routine.id}
                        className="shrink-0 w-[85%] snap-start"
                      >
                        <FeaturedRoutineCard
                          routine={routine}
                          categoryName={categoryNameMap.get(routine.category)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Banner - Under Categories */}
              <PromoBanner
                location="routines_after_categories"
                className="px-4 pb-2"
                carousel
              />
              <HomeBanner
                location="routines_after_categories"
                className="px-4 pb-2"
              />

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
                        <h2 className="text-xl font-bold text-foreground">
                          {t('inspirePage.popular')}
                        </h2>
                        <button
                          onClick={() =>
                            navigateWithScroll(`/app/routines/category/popular`)
                          }
                          className="text-sm text-primary font-medium flex items-center gap-0.5"
                        >
                          {t('inspirePage.all')} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                        {filteredPopular.map((routine, index) => (
                          <div key={routine.id} className="shrink-0 w-40">
                            <RoutineBankCard
                              hideFocusBadge
                              routine={routine}
                              onClick={() =>
                                navigateWithScroll(
                                  `/app/routines/${routine.id}`,
                                )
                              }
                              className={
                                index === 0 ? "tour-routine-card" : undefined
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Per-category sections */}
                  {nonEmptyCategories
                    ?.filter((c) => c.slug !== "pro")
                    .map((category) => {
                      const catRoutines =
                        routinesByCategory[category.slug]?.filter(
                          matchesSearch,
                        ) || [];
                      if (catRoutines.length === 0) return null;

                      return (
                        <section
                          key={category.slug}
                          id={`routine-category-${category.slug}`}
                        >
                          <div className="flex items-center justify-between mb-2 px-4">
                            <h2 className="text-xl font-bold text-foreground">
                              {category.name}
                            </h2>
                            <button
                              onClick={() =>
                                navigateWithScroll(
                                  `/app/routines/category/${category.slug}`,
                                )
                              }
                              className="text-sm text-primary font-medium flex items-center gap-0.5"
                            >
                              {t('inspirePage.all')} <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                            {catRoutines.slice(0, 8).map((routine) => (
                              <div key={routine.id} className="shrink-0 w-40">
                                <RoutineBankCard
                                  hideFocusBadge
                                  routine={routine}
                                  onClick={() =>
                                    navigateWithScroll(
                                      `/app/routines/${routine.id}`,
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    })}

                  {/* Pro category at the end */}
                  {nonEmptyCategories?.find((c) => c.slug === "pro") &&
                    (() => {
                      const proRoutines =
                        routinesByCategory["pro"]?.filter(matchesSearch) || [];
                      if (proRoutines.length === 0) return null;
                      const proCat = nonEmptyCategories.find(
                        (c) => c.slug === "pro",
                      )!;

                      return (
                        <section id="routine-category-pro">
                          <div className="flex items-center justify-between mb-2 px-4">
                            <h2 className="text-xl font-bold text-foreground">
                              {proCat.name}
                            </h2>
                            <button
                              onClick={() =>
                                navigateWithScroll(`/app/routines/category/pro`)
                              }
                              className="text-sm text-primary font-medium flex items-center gap-0.5"
                            >
                              {t('inspirePage.all')} <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                            {proRoutines.slice(0, 8).map((routine) => (
                              <div key={routine.id} className="shrink-0 w-40">
                                <RoutineBankCard
                                  hideFocusBadge
                                  routine={routine}
                                  onClick={() =>
                                    navigateWithScroll(
                                      `/app/routines/${routine.id}`,
                                    )
                                  }
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
                          {t('inspirePage.focus')}
                        </h2>
                        <button
                          onClick={() =>
                            navigateWithScroll(`/app/routines/category/reset`)
                          }
                          className="text-sm text-primary font-medium flex items-center gap-0.5"
                        >
                          {t('inspirePage.all')} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                        {resetRoutines.slice(0, 8).map((routine) => (
                          <div key={routine.id} className="shrink-0 w-40">
                            <RoutineBankCard
                              hideFocusBadge
                              routine={routine}
                              onClick={() =>
                                navigateWithScroll(
                                  `/app/routines/${routine.id}`,
                                )
                              }
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
                          {t('inspirePage.challenges')}
                        </h2>
                        <button
                          onClick={() =>
                            navigateWithScroll(
                              `/app/routines/category/challenges`,
                            )
                          }
                          className="text-sm text-primary font-medium flex items-center gap-0.5"
                        >
                          {t('inspirePage.all')} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                        {challengeRoutines.map((routine) => (
                          <div key={routine.id} className="shrink-0 w-40">
                            <RoutineBankCard
                              hideFocusBadge
                              routine={routine}
                              onClick={() =>
                                navigateWithScroll(
                                  `/app/routines/${routine.id}`,
                                )
                              }
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
                          {t('inspirePage.projects')}
                        </h2>
                        <button
                          onClick={() =>
                            navigateWithScroll(
                              `/app/routines/category/projects`,
                            )
                          }
                          className="text-sm text-primary font-medium flex items-center gap-0.5"
                        >
                          {t('inspirePage.all')} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
                        {projectRoutines.map((routine) => (
                          <div key={routine.id} className="shrink-0 w-40">
                            <RoutineBankCard
                              hideFocusBadge
                              routine={routine}
                              onClick={() =>
                                navigateWithScroll(
                                  `/app/routines/${routine.id}`,
                                )
                              }
                              isCompleted={completedRoutines?.has(routine.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* CTA to support chat */}
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-sm text-muted-foreground">
                      {t('inspirePage.tellUsWantText')}
                    </p>
                    <button
                      onClick={() =>
                        navigate(
                          "/app/chat?draft=" +
                            encodeURIComponent(
                              t('inspirePage.chatDraftPrefix'),
                            ),
                        )
                      }
                      className="text-sm text-blue-500 font-medium flex items-center gap-1 mt-1"
                    >
                      {t('inspirePage.tellUsWantCta')} <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
