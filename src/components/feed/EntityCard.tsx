import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { smartOpenUrl } from '@/lib/navigation-utils';
import {
  resolveInternalEntity,
  getToolLabel,
  type InternalEntity,
} from '@/lib/internalEntityResolver';
import {
  Play,
  Headphones,
  Film,
  Sparkles,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Brain,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { PRO_LINK_EMOJIS } from '@/lib/proLinkPresentation';

interface PreviewData {
  title: string;
  subtitle?: string;
  coverUrl?: string | null;
  emoji?: string;
  cta: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

function useEntityPreview(entity: InternalEntity) {
  return useQuery<PreviewData | null>({
    queryKey: ['entity-preview', entity.type, entity.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      switch (entity.type) {
        case 'playlist': {
          const { data: pl } = await supabase
            .from('audio_playlists')
            .select('id, name, description, cover_image_url, category, language')
            .eq('id', entity.id)
            .maybeSingle();
          if (!pl) return null;
          const { count } = await supabase
            .from('audio_playlist_items')
            .select('audio_id', { count: 'exact', head: true })
            .eq('playlist_id', entity.id);
          const LANG_FLAGS: Record<string, string> = {
            american: '🇺🇸', english: '🇺🇸', persian: '🇮🇷', farsi: '🇮🇷',
            turkish: '🇹🇷', spanish: '🇪🇸',
          };
          const parts: string[] = [];
          if (pl.category) parts.push(String(pl.category).replace(/\b\w/g, c => c.toUpperCase()));
          if (count != null) parts.push(`${count} track${count === 1 ? '' : 's'}`);
          if (pl.language && pl.language !== 'all') {
            const flag = LANG_FLAGS[String(pl.language).toLowerCase()];
            if (flag) parts.push(flag);
          }
          return {
            title: pl.name,
            subtitle: parts.length ? parts.join(' · ') : pl.description || 'Playlist',
            coverUrl: pl.cover_image_url,
            cta: 'Play',
            Icon: Headphones,
          };
        }
        case 'audio': {
          const { data: ac } = await supabase
            .from('audio_content')
            .select('id, title, description, cover_image_url, duration_seconds')
            .eq('id', entity.id)
            .maybeSingle();
          if (!ac) return null;
          const mins = ac.duration_seconds ? Math.round(ac.duration_seconds / 60) : null;
          return {
            title: ac.title,
            subtitle: mins ? `Audio · ${mins} min` : 'Audio track',
            coverUrl: ac.cover_image_url,
            cta: 'Listen',
            Icon: Play,
          };
        }
        case 'video_playlist': {
          const { data: vp } = await supabase
            .from('video_playlists')
            .select('id, name, description, cover_image_url')
            .eq('id', entity.id)
            .maybeSingle();
          if (!vp) return null;
          return {
            title: vp.name,
            subtitle: vp.description || 'Video playlist',
            coverUrl: vp.cover_image_url,
            cta: 'Watch',
            Icon: Film,
          };
        }
        case 'video': {
          const { data: vc } = await supabase
            .from('video_content')
            .select('id, title, description, thumbnail_url, duration_seconds')
            .eq('id', entity.id)
            .maybeSingle();
          if (!vc) return null;
          const mins = vc.duration_seconds ? Math.round(vc.duration_seconds / 60) : null;
          return {
            title: vc.title,
            subtitle: mins ? `Video · ${mins} min` : 'Video',
            coverUrl: vc.thumbnail_url,
            cta: 'Watch',
            Icon: Play,
          };
        }
        case 'routine': {
          const { data: r } = await supabase
            .from('routines_bank')
            .select('id, title, emoji, color, cover_image_url, category')
            .eq('id', entity.id)
            .maybeSingle();
          if (!r) return null;
          const { count } = await supabase
            .from('routines_bank_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('routine_id', entity.id);
          return {
            title: r.title,
            subtitle: count != null ? `Routine · ${count} step${count === 1 ? '' : 's'}` : 'Routine',
            coverUrl: r.cover_image_url,
            emoji: r.emoji || '🚀',
            cta: 'Start',
            Icon: Sparkles,
          };
        }
        case 'program': {
          const { data: p } = await supabase
            .from('program_catalog')
            .select('slug, title, description, cover_image_url')
            .eq('slug', entity.id)
            .maybeSingle();
          if (!p) return null;
          return {
            title: p.title,
            subtitle: p.description || 'Program',
            coverUrl: p.cover_image_url,
            cta: 'Open',
            Icon: GraduationCap,
          };
        }
        case 'reading': {
          const { data: r } = await supabase
            .from('reading_content')
            .select('id, title, subtitle, description, cover_url')
            .eq('id', entity.id)
            .maybeSingle();
          if (!r) return null;
          return {
            title: r.title,
            subtitle: r.subtitle || r.description || 'Reading',
            coverUrl: r.cover_url,
            cta: 'Read',
            Icon: BookOpen,
          };
        }
        case 'channel': {
          const { data: c } = await supabase
            .from('feed_channels')
            .select('id, name, slug, cover_image_url')
            .eq('slug', entity.id)
            .maybeSingle();
          if (!c) return null;
          return {
            title: c.name,
            subtitle: 'Channel',
            coverUrl: c.cover_image_url,
            cta: 'Open',
            Icon: MessageCircle,
          };
        }
        case 'quiz': {
          const { data: q } = await supabase
            .from('admin_quizzes')
            .select('slug, title, description, cover_url')
            .eq('slug', entity.id)
            .maybeSingle();
          if (!q) return null;
          return {
            title: q.title,
            subtitle: q.description || 'Quiz',
            coverUrl: q.cover_url,
            cta: 'Take Quiz',
            Icon: Brain,
          };
        }
        case 'tool': {
          const key = entity.toolKey || entity.id;
          return {
            title: getToolLabel(key),
            subtitle: 'Open tool',
            emoji: PRO_LINK_EMOJIS[key as keyof typeof PRO_LINK_EMOJIS] || '✨',
            cta: 'Open',
            Icon: Sparkles,
          };
        }
        default:
          return null;
      }
    },
  });
}

interface EntityCardProps {
  href: string;
  className?: string;
}

/**
 * Rich preview card for an internal app URL. Auto-fetches title, cover,
 * and a CTA based on the resolved entity type. Falls back to a simple
 * link button when the URL is unknown or data is missing.
 */
export function EntityCard({ href, className }: EntityCardProps) {
  const navigate = useNavigate();
  const entity = resolveInternalEntity(href);

  const { data, isLoading } = useEntityPreview(
    entity || ({ type: 'tool', id: 'unknown', href } as InternalEntity),
  );

  if (!entity) return null;

  const handleOpen = () => smartOpenUrl(href, navigate);

  if (isLoading) {
    return (
      <div
        className={cn(
          'mt-2 flex items-center gap-2.5 rounded-xl bg-card-warm shadow-card-warm px-2 py-2',
          className,
        )}
      >
        <div className="h-11 w-11 rounded-lg bg-[hsl(var(--tint-peach))] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-[hsl(var(--tint-peach))] animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-[hsl(var(--tint-peach))] animate-pulse" />
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-fg-warm-muted" />
      </div>
    );
  }

  if (!data) {
    // Fallback: simple branded link button when entity can't be loaded
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'mt-2 w-full flex items-center justify-between rounded-2xl bg-card-warm shadow-card-warm px-4 py-3 text-left active:scale-[0.99] transition-transform',
          className,
        )}
      >
        <span className="text-sm font-medium text-[hsl(var(--brand-primary))] truncate">
          Open in app
        </span>
        <ChevronRight className="h-4 w-4 text-fg-warm-muted shrink-0" />
      </button>
    );
  }

  const { title, subtitle, coverUrl, emoji, cta, Icon } = data;

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={cn(
        'mt-2 w-full flex items-center gap-2.5 rounded-xl bg-card-warm shadow-card-warm p-1.5 pr-2 text-left active:scale-[0.99] transition-transform',
        className,
      )}
    >
      {/* Cover / emoji thumb */}
      <div className="relative h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-[hsl(var(--tint-peach))] flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : emoji ? (
          <span className="text-lg" aria-hidden>
            {emoji}
          </span>
        ) : Icon ? (
          <Icon className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
        ) : null}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-fg-warm-muted uppercase tracking-wide font-medium leading-none mb-0.5 truncate">
          {subtitle}
        </p>
        <p className="text-[13px] font-semibold text-fg-warm leading-snug line-clamp-1">
          {title}
        </p>
      </div>

      {/* CTA */}
      <div className="shrink-0 flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-[hsl(var(--brand-primary))] text-white text-[11px] font-semibold">
        {cta}
        <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}