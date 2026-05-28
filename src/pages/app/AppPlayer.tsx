import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, Globe, Crown, ChevronRight } from "lucide-react";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { PlaylistCard } from "@/components/audio/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";
import { usePlayerData } from "@/hooks/useAppData";
import { cn } from "@/lib/utils";
import { PromoBanner } from "@/components/app/PromoBanner";
import { HomeBanner } from "@/components/app/HomeBanner";
import { PlusUpsellBanner } from "@/components/app/PlusUpsellBanner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallSheet } from "@/components/app/PaywallSheet";
import { haptic } from "@/lib/haptics";
import { PersianFlag } from "@/components/ui/PersianFlag";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import {
  useUserPreferredLanguage,
  preferredLanguageSorter,
} from "@/hooks/useUserPreferredLanguage";
import {
  LanguagePreferencePopup,
  shouldShowLanguagePopup,
} from "@/components/app/LanguagePreferencePopup";
import {
  LanguageSettingsHintPopup,
  shouldShowLanguageSettingsHint,
} from "@/components/app/LanguageSettingsHintPopup";
import { IOSIconButton } from "@/components/app/ui/IOSIconButton";
import { useMediaCategories } from "@/hooks/useMediaCategories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CachedImage } from "@/components/ui/CachedImage";
import { usePlaylistTags, usePlaylistTagLinks } from "@/hooks/usePlaylistTags";

const LANGUAGE_OPTIONS = [
  { value: "all", labelKey: "player.languages.all", flag: "🌐" },
  { value: "american", labelKey: "player.languages.english", flag: "🇺🇸" },
  { value: "persian", labelKey: "player.languages.persian", flag: null },
  { value: "turkish", labelKey: "player.languages.turkish", flag: "🇹🇷" },
  { value: "spanish", labelKey: "player.languages.spanish", flag: "🇪🇸" },
];

export default function AppPlayer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [progressFilter, setProgressFilter] = useState<
    "all" | "following" | "in_progress" | "completed"
  >("all");
  const [showPaywall, setShowPaywall] = useState(false);
  const { hasAccessToProgram } = useSubscription();
  const hasSoundscapeAccess = hasAccessToProgram("simora-plus");
  const [preferredLanguage, setPreferredLanguage] = useState("all");
  const { categories: dbCategories } = useMediaCategories("audio");
  const { data: playlistTags = [] } = usePlaylistTags();
  const { data: playlistTagLinks = [] } = usePlaylistTagLinks();
  const playlistIdsByTag = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const link of playlistTagLinks) {
      if (!map.has(link.tag_id)) map.set(link.tag_id, new Set());
      map.get(link.tag_id)!.add(link.playlist_id);
    }
    return map;
  }, [playlistTagLinks]);
  const categoryConfig = useMemo(() => {
    const map: Record<string, { name: string; emoji?: string }> = {
      all: { name: t("player.categories.all"), emoji: "✨" },
    };
    for (const c of dbCategories as any[]) {
      map[c.slug] = { name: c.label, emoji: c.emoji };
    }
    return map;
  }, [dbCategories, t]);

  const handleLanguageChange = useCallback((lang: string) => {
    setPreferredLanguage(lang);
    localStorage.setItem("player-language", lang);
  }, []);

  const selectedLang =
    LANGUAGE_OPTIONS.find((l) => l.value === preferredLanguage) ||
    LANGUAGE_OPTIONS[0];

  const { scrollRef: listenScrollRef } = useScrollRestore("listen_scroll", {
    autoSave: true,
  });

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categoryConfig[categoryParam]) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, categoryConfig]);

  const { playlists, playlistItems, progressData, enrollments, savedPlaylistIds, isLoading } =
    usePlayerData();

  // Hot Tracks — individually featured audio tracks shown above All Playlists
  const { data: hotTracks = [] } = useQuery({
    queryKey: ["hot-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_content")
        .select(`
          id, title, cover_image_url, category, duration_seconds,
          audio_playlist_items ( audio_playlists ( cover_image_url, name, language, category, is_free, requires_subscription, program_slug ) )
        `)
        .eq("is_hot", true)
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const userLang = useUserPreferredLanguage();
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [showLangHint, setShowLangHint] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (shouldShowLanguagePopup(userLang)) {
      const timer = setTimeout(() => setShowLangPopup(true), 800);
      return () => clearTimeout(timer);
    }
    // Already chose preferred language → show settings hint once
    if (userLang && shouldShowLanguageSettingsHint()) {
      const timer = setTimeout(() => setShowLangHint(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, userLang]);

  const playlistStats = useMemo(() => {
    const statsMap = new Map<
      string,
      {
        trackCount: number;
        totalDuration: number;
        completedTracks: number;
        coverImage: string | null;
      }
    >();
    if (!playlists || !playlistItems) return statsMap;
    const progressMap = new Map<string, boolean>();
    progressData?.forEach((p) =>
      progressMap.set(p.audio_id, p.completed || false),
    );
    playlists.forEach((playlist) => {
      const items = playlistItems.filter(
        (item) => item.playlist_id === playlist.id,
      );
      const trackCount = items.length;
      const totalDuration = items.reduce(
        (sum, item) => sum + (item.audio_content?.duration_seconds || 0),
        0,
      );
      const completedTracks = items.filter((item) =>
        progressMap.get(item.audio_id),
      ).length;
      const coverImage = items[0]?.audio_content?.cover_image_url || null;
      statsMap.set(playlist.id, {
        trackCount,
        totalDuration,
        completedTracks,
        coverImage,
      });
    });
    return statsMap;
  }, [playlists, playlistItems, progressData]);

  const getPlaylistStats = (playlistId: string) =>
    playlistStats.get(playlistId) || {
      trackCount: 0,
      totalDuration: 0,
      completedTracks: 0,
      coverImage: null,
    };

  const isPlaylistLocked = (playlist: any) => {
    if (playlist.is_free) return false;
    if (playlist.requires_subscription) return false;
    if (!playlist.program_slug) return false;
    return !enrollments?.includes(playlist.program_slug);
  };

  const isPlaylistAvailableOnMobile = (playlist: any) => {
    if (playlist.program_slug && enrollments?.includes(playlist.program_slug))
      return true;
    if (isNativeApp() && playlist.available_on_mobile === false) return false;
    return true;
  };

  const followedSet = useMemo(
    () => new Set(savedPlaylistIds || []),
    [savedPlaylistIds],
  );
  const isFollowingPlaylist = (playlist: any) => {
    if (followedSet.has(playlist.id)) return true;
    if (
      playlist.program_slug &&
      !playlist.is_free &&
      !playlist.requires_subscription &&
      enrollments?.includes(playlist.program_slug)
    )
      return true;
    return false;
  };

  const filterPlaylistByProgress = (playlist: any) => {
    const stats = getPlaylistStats(playlist.id);
    const progress =
      stats.trackCount > 0
        ? (stats.completedTracks / stats.trackCount) * 100
        : 0;
    if (progressFilter === "following") return isFollowingPlaylist(playlist);
    if (progressFilter === "in_progress") return progress > 0 && progress < 100;
    if (progressFilter === "completed") return progress >= 100;
    return true;
  };

  const filterPlaylistBySearch = (playlist: any) => {
    if (!searchQuery) return true;
    return (
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const categoryOrder = useMemo(
    () => ["all", ...(dbCategories as any[]).map((c) => c.slug)],
    [dbCategories],
  );
  const availableCategoriesSet = new Set(
    playlists
      ?.filter((p) => !p.is_hidden && isPlaylistAvailableOnMobile(p))
      ?.map((p) => p.category)
      .filter(Boolean) || [],
  );
  const availableCategories = categoryOrder.filter(
    (cat) => cat === "all" || availableCategoriesSet.has(cat),
  );

  const filterByLanguage = (playlist: any) => {
    if (preferredLanguage === "all") return true;
    if (playlist.language === "all" || !playlist.language) return true;
    return playlist.language === preferredLanguage;
  };

  const filteredPlaylists =
    playlists
      ?.filter((p) => !p.is_hidden)
      ?.filter(isPlaylistAvailableOnMobile)
      ?.filter(filterByLanguage)
      ?.filter(
        (p) => selectedCategory === "all" || p.category === selectedCategory,
      )
      ?.filter((p) => {
        if (!selectedTagId) return true;
        return playlistIdsByTag.get(selectedTagId)?.has(p.id) ?? false;
      })
      ?.filter(filterPlaylistBySearch)
      ?.filter(filterPlaylistByProgress)
      ?.sort(preferredLanguageSorter(userLang)) || [];

  const continueListening =
    playlists
      ?.filter((playlist) => {
        const stats = getPlaylistStats(playlist.id);
        const progress =
          stats.trackCount > 0
            ? (stats.completedTracks / stats.trackCount) * 100
            : 0;
        return (
          progress > 0 &&
          progress < 100 &&
          !isPlaylistLocked(playlist) &&
          isPlaylistAvailableOnMobile(playlist) &&
          filterByLanguage(playlist)
        );
      })
      .sort((a, b) => {
        const itemsA =
          playlistItems?.filter((i) => i.playlist_id === a.id) || [];
        const itemsB =
          playlistItems?.filter((i) => i.playlist_id === b.id) || [];
        const lastPlayedA = Math.max(
          ...itemsA.map((i) => {
            const p = progressData?.find((pr) => pr.audio_id === i.audio_id);
            return p ? new Date(p.last_played_at).getTime() : 0;
          }),
        );
        const lastPlayedB = Math.max(
          ...itemsB.map((i) => {
            const p = progressData?.find((pr) => pr.audio_id === i.audio_id);
            return p ? new Date(p.last_played_at).getTime() : 0;
          }),
        );
        return lastPlayedB - lastPlayedA;
      }) || [];

  const renderCard = (playlist: any) => {
    const stats = getPlaylistStats(playlist.id);
    return (
      <PlaylistCard
        key={playlist.id}
        id={playlist.id}
        name={playlist.name}
        description={playlist.description}
        coverImageUrl={playlist.cover_image_url}
        category={playlist.category}
        language={playlist.language}
        isFree={playlist.is_free}
        isLocked={isPlaylistLocked(playlist)}
        programSlug={playlist.program_slug}
        requiresSubscription={playlist.requires_subscription}
        isSubscribed={hasSoundscapeAccess}
        trackCount={stats.trackCount}
        completedTracks={stats.completedTracks}
        totalDuration={stats.totalDuration}
        isFollowing={isFollowingPlaylist(playlist)}
        categoryLabel={categoryConfig[playlist.category]?.name}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div
          className="px-4 pt-4 space-y-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
        >
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-background">
      {/* Single scroll container */}
      <div
        ref={listenScrollRef}
        className="flex-1 overflow-y-auto overscroll-contain relative"
      >
        <div
          className="relative"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Header — only the title row sticks to top */}
          <div
            className="sticky z-20 px-4 pt-3 pb-2 bg-background"
            style={{ top: "env(safe-area-inset-top)" }}
          >
            <div className="min-h-[44px] flex items-center justify-between">
              {showSearch ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-warm-muted" />
                    <Input
                      placeholder={t("player.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-card border-0 text-fg-warm placeholder:text-fg-warm-muted focus-visible:ring-0 shadow-ios rounded-full"
                      autoFocus
                    />
                  </div>
                  <IOSIconButton
                    size="sm"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    aria-label={t("player.closeSearchAria")}
                  >
                    <X className="h-5 w-5 text-fg-warm" />
                  </IOSIconButton>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-fg-warm tracking-tight">
                    {t("player.title")}
                  </h1>
                  <div className="flex items-center gap-2">
                    <IOSIconButton
                      size="sm"
                      onClick={() => setShowSearch(true)}
                      className="tour-player-search"
                      aria-label={t("player.searchAria")}
                    >
                      <Search className="h-4 w-4 text-brand" />
                    </IOSIconButton>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrolls away with content */}
          <div className="px-4 pb-2">
            {/* Category pills */}
            <div className="tour-player-categories flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-hide">
              {availableCategories.map((cat) => {
                const config = categoryConfig[cat];
                const name = config ? config.name : cat;
                const isSoundscapeLocked =
                  cat === "soundscape" && !hasSoundscapeAccess;
                const active = selectedCategory === cat;
                return (
                  <div key={cat} className="relative">
                    {isSoundscapeLocked && (
                      <div className="absolute -top-2 -left-1 z-10 flex items-center gap-0.5 bg-amber-200 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        <Crown className="h-2.5 w-2.5" /> PLUS
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isSoundscapeLocked) {
                          haptic.light();
                          setShowPaywall(true);
                        } else {
                          haptic.selection();
                          setSelectedCategory(cat);
                        }
                      }}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold leading-none whitespace-nowrap transition-all active:scale-95",
                        active
                          ? "bg-brand text-white shadow-ios"
                          : "bg-peach text-fg-warm-muted",
                      )}
                    >
                      {config?.emoji && (
                        <span className="inline-flex shrink-0 items-center justify-center w-[18px] h-[18px]">
                          <FluentEmoji emoji={config.emoji} size={18} />
                        </span>
                      )}
                      <span>{name}</span>
                    </button>
                    {isSoundscapeLocked && (
                      <div className="absolute -bottom-0.5 -right-0.5 z-10 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <FluentEmoji emoji="🔒" size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {playlistTags.length > 0 && (
              <div
                className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-hide"
                style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
              >
                <button
                  onClick={() => {
                    haptic.selection();
                    setSelectedTagId(null);
                  }}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95",
                    selectedTagId === null
                      ? "bg-card text-fg-warm shadow-ios"
                      : "text-fg-warm-muted",
                  )}
                >
                  All Topics
                </button>
                {playlistTags.map((tag) => {
                  const active = selectedTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        haptic.selection();
                        setSelectedTagId(active ? null : tag.id);
                      }}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95",
                        active
                          ? "bg-card text-fg-warm shadow-ios"
                          : "text-fg-warm-muted",
                      )}
                    >
                      {tag.emoji && <span>{tag.emoji}</span>}
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Status filters + Language globe */}
            <div className="tour-player-progress-filter flex items-center justify-between mt-2 gap-2">
              <div className="flex gap-1.5">
                {(["all", "in_progress", "completed"] as const).map(
                  (filter) => {
                    const active = progressFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setProgressFilter(filter)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95",
                          active
                            ? "bg-card text-fg-warm shadow-ios"
                            : "text-fg-warm-muted",
                        )}
                      >
                        {filter === "all"
                          ? t("player.filters.all")
                          : filter === "in_progress"
                            ? t("player.filters.inProgress")
                            : t("player.filters.completed")}
                      </button>
                    );
                  },
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <IOSIconButton
                    size="sm"
                    aria-label={t("player.languageAria")}
                  >
                    {selectedLang.value === "persian" ? (
                      <PersianFlag size={14} />
                    ) : selectedLang.value === "all" ? (
                      <Globe className="h-4 w-4 text-brand" />
                    ) : (
                      <span className="text-base leading-none">
                        {selectedLang.flag}
                      </span>
                    )}
                  </IOSIconButton>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-40 p-1">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        preferredLanguage === lang.value
                          ? "bg-bg-warm text-foreground font-medium"
                          : "text-foreground active:bg-bg-warm",
                      )}
                    >
                      {lang.value === "persian" ? (
                        <PersianFlag size={14} />
                      ) : (
                        <span>{lang.flag}</span>
                      )}
                      <span>{t(lang.labelKey)}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Continue Learning */}
          {progressFilter === "all" &&
            selectedCategory === "all" &&
            !searchQuery &&
            continueListening.length > 0 && (
              <div className="px-4 pt-4 space-y-2 tour-continue-listening">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand" />
                  <h2 className="text-[11px] font-bold text-fg-warm-muted uppercase tracking-[0.12em]">
                    {t("player.continueLearning")}
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  {continueListening.slice(0, 4).map(renderCard)}
                </div>
              </div>
            )}

          {/* Hot Tracks — individually featured audios */}
          {progressFilter === "all" &&
            selectedCategory === "all" &&
            !searchQuery &&
            hotTracks.length > 0 && (
              <div className="px-4 pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FluentEmoji emoji="🔥" size={16} />
                  <h2 className="text-[11px] font-bold text-fg-warm-muted uppercase tracking-[0.12em]">
                    {t("player.hotTracks", "Hot Tracks")}
                  </h2>
                </div>
                <div
                  className="flex gap-3 overflow-x-auto -mx-4 px-4 pt-1 pb-2 scrollbar-hide snap-x snap-mandatory scroll-pl-4"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {[...hotTracks]
                    .sort((a: any, b: any) => {
                      const aLang = a.audio_playlist_items?.[0]?.audio_playlists?.language;
                      const bLang = b.audio_playlist_items?.[0]?.audio_playlists?.language;
                      const aMatch = userLang && aLang === userLang ? 0 : 1;
                      const bMatch = userLang && bLang === userLang ? 0 : 1;
                      return aMatch - bMatch;
                    })
                    .map((track: any) => {
                    const playlistCover =
                      track.audio_playlist_items?.[0]?.audio_playlists?.cover_image_url || null;
                    const cover = track.cover_image_url || playlistCover;
                    const playlistName =
                      track.audio_playlist_items?.[0]?.audio_playlists?.name || null;
                    const playlistCategory =
                      track.audio_playlist_items?.[0]?.audio_playlists?.category || track.category;
                    const categoryLabel = categoryConfig[playlistCategory]?.name || playlistCategory;
                    const trackLang =
                      track.audio_playlist_items?.[0]?.audio_playlists?.language || null;
                    const langOption = trackLang
                      ? LANGUAGE_OPTIONS.find((o) => o.value === trackLang)
                      : null;
                    const langLabel = langOption ? t(langOption.labelKey) : null;
                    return (
                      <button
                        key={track.id}
                        onClick={() => {
                          haptic.light();
                          navigate(`/app/player/${track.id}`);
                        }}
                        className="shrink-0 w-[85%] snap-start text-left transition-transform active:scale-[0.98]"
                      >
                        <div className="relative rounded-3xl p-4 bg-gradient-to-br from-orange-100 via-orange-200/80 to-orange-300/70 shadow-ios overflow-hidden">
                          {/* Top label row */}
                          <div className="flex items-center gap-1.5 mb-3">
                            <FluentEmoji emoji="🔥" size={14} />
                            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-600">
                              Hot Track
                            </span>
                            {langLabel && (
                              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/70 text-orange-700">
                                {trackLang === "persian" ? (
                                  <PersianFlag size={12} />
                                ) : langOption?.flag ? (
                                  <span className="text-[12px] leading-none">{langOption.flag}</span>
                                ) : null}
                                {langLabel}
                              </span>
                            )}
                            {categoryLabel && (
                              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-orange-700 uppercase tracking-wider truncate max-w-[45%]">
                                {categoryLabel}
                              </span>
                            )}
                          </div>

                          {/* Middle: cover tile + title/subtitle */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white shadow-ios flex items-center justify-center overflow-hidden">
                              {cover ? (
                                <CachedImage
                                  src={cover}
                                  alt={track.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FluentEmoji emoji="🎧" size={36} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-lg font-bold text-black leading-tight truncate">
                                {track.title}
                              </p>
                              {playlistName && (
                                <p className="text-xs text-orange-700/80 mt-0.5 truncate">
                                  {playlistName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* CTA */}
                          <div className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-orange-500 shadow-ios">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white ml-0.5">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span className="text-white font-bold text-base">Play now</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {/* All Playlists */}
          <div className="px-4 pt-4 pb-6 space-y-2 tour-playlists">
            <h2 className="tour-playlists-header text-[11px] font-bold text-fg-warm-muted uppercase tracking-[0.12em]">
              {selectedCategory === "all"
                ? t("player.allPlaylists")
                : categoryConfig[selectedCategory]
                  ? categoryConfig[selectedCategory].name
                  : selectedCategory}
            </h2>

            <PromoBanner location="listen" className="mb-2" />
            <HomeBanner location="listen" className="mb-2" />
            <PlusUpsellBanner
              title="Unlock the full audio library"
              subtitle="Every session, unlocked"
              className="mb-2"
            />

            {filteredPlaylists.length === 0 ? (
              <div className="text-center py-12 text-fg-warm-muted">
                <p className="text-base">{t("player.noPlaylists")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPlaylists.map(renderCard)}
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 pb-safe">
              <p className="text-sm text-fg-warm-muted">
                {t("player.notFinding")}
              </p>
              <button
                onClick={() =>
                  navigate(
                    "/app/chat?draft=" +
                      encodeURIComponent(t("player.chatDraft")),
                  )
                }
                className="text-sm text-brand font-medium flex items-center gap-1 mt-1 active:scale-95 transition-transform"
              >
                {t("player.tellUs")} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
      <LanguagePreferencePopup
        open={showLangPopup}
        onClose={() => {
          setShowLangPopup(false);
          if (shouldShowLanguageSettingsHint()) {
            setTimeout(() => setShowLangHint(true), 350);
          }
        }}
      />
      <LanguageSettingsHintPopup
        open={showLangHint}
        onClose={() => setShowLangHint(false)}
      />
    </div>
  );
}
