import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Sparkles, Headphones } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferredLanguage } from '@/hooks/useUserPreferredLanguage';
import { haptic } from '@/lib/haptics';

const O = {
  primary: '#EB5E33',
  primaryL: '#F2854F',
  fg: '#2B1C15',
  fgMuted: '#8A6F62',
  border: '#F5DCC8',
  card: '#FFFFFF',
  peachSoft: '#FFEFE4',
};

type Pick = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  doorLabel: string | null;
  trackCount: number;
};

/**
 * "Start here" — one personalized free playlist for users who are not
 * enrolled in any program. Matched to the priority door they picked during
 * Rilo Doors onboarding and to their preferred content language.
 */
export function StartHereCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const preferredLanguage = useUserPreferredLanguage();

  const { data: pick } = useQuery<Pick | null>({
    queryKey: ['start-here-pick', user?.id, preferredLanguage],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // 1. The door picked during onboarding (may be missing if skipped)
      const { data: answerRows } = await supabase
        .from('onboarding_answers')
        .select('answer')
        .eq('user_id', user!.id)
        .eq('flow_id', 'rilo-doors')
        .eq('step_id', 'rd-door-primary')
        .order('created_at', { ascending: false })
        .limit(1);
      const rawAnswer = (answerRows ?? [])[0]?.answer as unknown;
      const doorSlug =
        (Array.isArray(rawAnswer) ? String(rawAnswer[0] ?? '') : String(rawAnswer ?? '')) || null;

      // 2. Free, openly accessible playlists
      const { data: playlists } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url, language, is_free, requires_subscription, program_slug')
        .eq('is_hidden', false)
        .eq('requires_subscription', false);
      const openPlaylists = (playlists ?? []).filter((p) => p.is_free && !p.program_slug);
      if (openPlaylists.length === 0) return null;

      // 3. Playlists tagged with that door
      let doorLabel: string | null = null;
      let doorPlaylistIds = new Set<string>();
      if (doorSlug && doorSlug !== 'unknown') {
        const { data: tagRows } = await supabase
          .from('tags')
          .select('id, slug, label, tag_dimensions!inner(slug)')
          .eq('slug', doorSlug)
          .eq('tag_dimensions.slug', 'door')
          .limit(1);
        const tag = (tagRows ?? [])[0] as { id: string; label: string } | undefined;
        if (tag) {
          doorLabel = tag.label ?? null;
          const { data: links } = await supabase
            .from('content_tags')
            .select('content_id')
            .eq('content_type', 'playlist')
            .eq('tag_id', tag.id);
          doorPlaylistIds = new Set((links ?? []).map((l) => l.content_id));
        }
      }

      const pickFrom = (pool: typeof openPlaylists) => {
        if (pool.length === 0) return null;
        if (preferredLanguage) {
          const match = pool.find((p) => p.language === preferredLanguage);
          if (match) return match;
        }
        return pool[0];
      };

      const chosen =
        pickFrom(openPlaylists.filter((p) => doorPlaylistIds.has(p.id))) ??
        pickFrom(openPlaylists);
      if (!chosen) return null;

      const { count } = await supabase
        .from('audio_playlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('playlist_id', chosen.id);

      return {
        id: chosen.id,
        name: chosen.name,
        coverImageUrl: chosen.cover_image_url ?? null,
        doorLabel: doorPlaylistIds.has(chosen.id) ? doorLabel : null,
        trackCount: count ?? 0,
      };
    },
  });

  if (!pick) return null;

  const open = () => {
    haptic.light();
    navigate(`/app/player/playlist/${pick.id}`);
  };

  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        background: `linear-gradient(140deg, ${O.peachSoft} 0%, ${O.card} 70%)`,
        border: `1px solid ${O.border}`,
        boxShadow: '0 4px 16px rgba(235,94,51,0.08)',
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
        style={{ color: O.primary }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {pick.doorLabel ? `Start here · ${pick.doorLabel}` : 'Start here'}
      </div>

      <div className="flex items-center gap-3 mt-2.5">
        <div
          className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: O.peachSoft, border: `1px solid ${O.border}` }}
        >
          {pick.coverImageUrl ? (
            <img src={pick.coverImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Headphones className="w-6 h-6" style={{ color: O.primary }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold leading-snug line-clamp-2" style={{ color: O.fg }}>
            {pick.name}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: O.fgMuted }}>
            {pick.trackCount > 0 ? `${pick.trackCount} sessions · free` : 'Free to listen'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={open}
        className="w-full mt-3 h-11 rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold active:scale-[0.99] transition-transform"
        style={{
          background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(235,94,51,0.3)',
        }}
      >
        <Play className="w-4 h-4 fill-current" />
        Start listening
      </button>
    </div>
  );
}
