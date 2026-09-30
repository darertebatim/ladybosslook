import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Play, Headset, LayoutGrid, Sparkles } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFirstName } from '@/hooks/useFirstName';
import { useUserPreferredLanguage } from '@/hooks/useUserPreferredLanguage';
import { haptic } from '@/lib/haptics';

type Pick = {
  kind: 'program' | 'playlist';
  id: string;
  title: string;
  coverImageUrl: string | null;
  doorLabel: string | null;
  meta: string;
  slug?: string;
};

/**
 * "Start here" — the My Learning card for users who are not enrolled in any
 * program yet. Recommends an active free program matched to the door they
 * picked during Rilo Doors onboarding, falling back to a free playlist.
 */
export function StartHereCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const preferredLanguage = useUserPreferredLanguage();

  const { data: pick } = useQuery<Pick | null>({
    queryKey: ['start-here-pick-v2', user?.id, preferredLanguage],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // 1. Doors onboarding answers: primary door + sharpener (secondary) tags
      const { data: answerRows } = await supabase
        .from('onboarding_answers')
        .select('step_id, answer, created_at')
        .eq('user_id', user!.id)
        .eq('flow_id', 'rilo-doors')
        .order('created_at', { ascending: false });

      const toSlugs = (raw: unknown): string[] =>
        (Array.isArray(raw) ? raw : [raw])
          .map((v) => String(v ?? '').trim())
          .filter((v) => v && v !== 'unknown');

      const primarySlugs: string[] = [];
      const secondarySlugs: string[] = [];
      for (const row of answerRows ?? []) {
        const stepId = String((row as { step_id: string }).step_id || '');
        const slugs = toSlugs((row as { answer: unknown }).answer);
        if (stepId === 'rd-door-primary') primarySlugs.push(...slugs);
        else if (stepId.startsWith('rd-sharp')) secondarySlugs.push(...slugs);
      }

      // 2. Resolve those answer slugs to real tags
      const allSlugs = Array.from(new Set([...primarySlugs, ...secondarySlugs]));
      let primaryTagIds = new Set<string>();
      let secondaryTagIds = new Set<string>();
      const labelByTagId = new Map<string, string>();
      if (allSlugs.length > 0) {
        const { data: tagRows } = await supabase
          .from('tags')
          .select('id, slug, label')
          .in('slug', allSlugs);
        for (const t of tagRows ?? []) {
          labelByTagId.set(t.id, t.label ?? t.slug);
          if (primarySlugs.includes(t.slug)) primaryTagIds.add(t.id);
          else secondaryTagIds.add(t.id);
        }
      }

      const tagIds = [...primaryTagIds, ...secondaryTagIds];
      const contentTagsFor = async (contentType: string) => {
        if (tagIds.length === 0)
          return { primary: new Map<string, string>(), secondary: new Map<string, string>() };
        const { data: links } = await supabase
          .from('content_tags')
          .select('content_id, tag_id')
          .eq('content_type', contentType)
          .in('tag_id', tagIds);
        const primary = new Map<string, string>();
        const secondary = new Map<string, string>();
        for (const l of links ?? []) {
          const label = labelByTagId.get(l.tag_id) ?? null;
          if (!label) continue;
          if (primaryTagIds.has(l.tag_id)) primary.set(l.content_id, label);
          else secondary.set(l.content_id, label);
        }
        return { primary, secondary };
      };

      const byLanguage = <T extends { language?: string | null }>(pool: T[]): T | null => {
        if (pool.length === 0) return null;
        if (preferredLanguage) {
          const match = pool.find((p) => p.language === preferredLanguage);
          if (match) return match;
        }
        return pool[0];
      };

      // 3. Free programs first
      const { data: programs } = await supabase
        .from('program_catalog')
        .select('id, slug, title, cover_image_url, language, payment_type, price_amount, is_active')
        .eq('is_active', true);
      const freePrograms = (programs ?? []).filter(
        (p) => p.payment_type === 'free' || (p.price_amount ?? 0) === 0,
      );

      if (freePrograms.length > 0) {
        const { primary, secondary } = await contentTagsFor('program');
        const chosen =
          byLanguage(freePrograms.filter((p) => primary.has(p.id))) ??
          byLanguage(freePrograms.filter((p) => secondary.has(p.id)));
        if (chosen) {
          return {
            kind: 'program',
            id: chosen.id,
            slug: chosen.slug,
            title: chosen.title,
            coverImageUrl: chosen.cover_image_url ?? null,
            doorLabel: primary.get(chosen.id) ?? secondary.get(chosen.id) ?? null,
            meta: 'Free program · join anytime',
          } satisfies Pick;
        }
      }

      // 4. Fall back to a free playlist
      const { data: playlists } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url, language, is_free, requires_subscription, program_slug')
        .eq('is_hidden', false)
        .eq('requires_subscription', false);
      const openPlaylists = (playlists ?? []).filter((p) => p.is_free && !p.program_slug);
      if (openPlaylists.length === 0) return null;

      const { primary, secondary } = await contentTagsFor('playlist');
      const chosenPlaylist =
        byLanguage(openPlaylists.filter((p) => primary.has(p.id))) ??
        byLanguage(openPlaylists.filter((p) => secondary.has(p.id))) ??
        byLanguage(openPlaylists);
      if (!chosenPlaylist) return null;

      const { count } = await supabase
        .from('audio_playlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('playlist_id', chosenPlaylist.id);

      return {
        kind: 'playlist',
        id: chosenPlaylist.id,
        title: chosenPlaylist.name,
        coverImageUrl: chosenPlaylist.cover_image_url ?? null,
        doorLabel: primary.get(chosenPlaylist.id) ?? secondary.get(chosenPlaylist.id) ?? null,
        meta: count ? `${count} sessions · free` : 'Free to listen',
      } satisfies Pick;
    },
  });

  const firstName = useFirstName();

  if (!pick) return null;

  const open = () => {
    haptic.light();
    if (pick.kind === 'program' && pick.slug) {
      // Same in-app destination the Academy page uses for programs.
      navigate(`/app/programs/${pick.slug}`, { state: { from: location.pathname } });
    } else {
      navigate(`/app/player/playlist/${pick.id}`, { state: { from: location.pathname } });
    }
  };

  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-border-warm bg-gradient-to-b from-peach/50 to-card-warm shadow-card-warm">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">
            My Learning
          </p>
          <h3 className="mt-1 text-[17px] font-bold leading-tight text-fg-warm line-clamp-2">
            Welcome to Rilo{firstName ? `, ${firstName}` : ''}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-warm-muted line-clamp-1">
            <Sparkles className="h-3 w-3 flex-shrink-0 text-brand" />
            {pick.doorLabel ? `Picked for you · ${pick.doorLabel}` : 'Picked for you'}
          </p>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-orange shadow-ios">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* The recommendation */}
      <div className="mx-3 mt-1 overflow-hidden rounded-2xl border border-border-warm bg-card-warm">
        <div className="relative flex min-h-[88px] items-center gap-3 bg-gradient-orange px-4 py-3">
          {pick.coverImageUrl && (
            <img
              src={pick.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
              loading="lazy"
            />
          )}
          {pick.kind === 'program' ? (
            <GraduationCap className="relative h-7 w-7 flex-shrink-0 text-white" />
          ) : (
            <Play className="relative h-7 w-7 flex-shrink-0 fill-white text-white" />
          )}
          <p className="relative min-w-0 flex-1 text-[15px] font-extrabold leading-snug text-white line-clamp-2">
            {pick.title}
          </p>
        </div>
        <div className="p-3.5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg-warm-muted">
            Start here
          </p>
          <p className="mt-1 mb-2.5 text-sm font-bold leading-snug text-fg-warm line-clamp-2">
            {pick.meta}
          </p>
          <button
            onClick={open}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-orange text-[14px] font-extrabold text-white shadow-ios transition-transform active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-white" />
            {pick.kind === 'program' ? 'Join free' : 'Start listening'}
          </button>
        </div>
      </div>

      {/* Explore programs */}
      <div className="mx-3 mt-3 grid grid-cols-[3fr_1fr] gap-2">
        <Link
          to="/app/academy"
          onClick={() => haptic.light()}
          className="flex items-center gap-2.5 rounded-2xl bg-peach px-3 py-2.5 active:opacity-90"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-card-warm">
            <GraduationCap className="h-4 w-4 text-brand" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-bold leading-tight text-fg-warm line-clamp-1">
              Explore programs
            </span>
            <span className="block text-[11.5px] leading-tight text-fg-warm-muted line-clamp-1">
              Live workshops &amp; courses
            </span>
          </span>
        </Link>
        <Link
          to="/app/myprograms"
          onClick={() => haptic.light()}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-peach py-2.5 text-brand active:opacity-90"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="text-[10.5px] font-extrabold text-fg-warm">My Programs</span>
        </Link>
      </div>

      {/* Support */}
      <Link
        to="/app/chat"
        onClick={() => haptic.light()}
        className="mx-3 mb-3.5 mt-3 flex min-h-[40px] items-center justify-center gap-2 rounded-2xl bg-mint px-3 text-[12.5px] font-bold text-fg-warm active:scale-[0.98] transition-transform"
      >
        <Headset className="h-4 w-4" />
        Any questions? Chat with support
      </Link>
    </div>
  );
}
