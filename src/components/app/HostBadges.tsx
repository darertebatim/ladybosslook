import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContentType = 'playlist' | 'routine' | 'program';

interface HostBadgesProps {
  contentType: ContentType;
  contentId: string;
  size?: 'sm' | 'md';
  className?: string;
  prefix?: string;
}

/**
 * Renders the host(s) attached to a piece of content as a row of avatar +
 * name chips. Falls back to nothing if no hosts are assigned.
 */
export function HostBadges({
  contentType,
  contentId,
  size = 'sm',
  className,
  prefix = 'with',
}: HostBadgesProps) {
  const { data: hosts = [] } = useQuery({
    queryKey: ['content-hosts', contentType, contentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_hosts')
        .select('host_id, role, sort_order, instructors(id, slug, display_name, photo_url)')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('sort_order');
      if (error) throw error;
      return (data || []).map((r: any) => ({
        host_id: r.host_id,
        role: r.role,
        display_name: r.instructors?.display_name as string | undefined,
        photo_url: r.instructors?.photo_url as string | null | undefined,
        slug: r.instructors?.slug as string | undefined,
      }));
    },
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(contentId),
  });

  if (!hosts.length) return null;

  const avatar = size === 'md' ? 'h-7 w-7' : 'h-5 w-5';
  const text = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className={cn('flex items-center gap-1.5', text, className)}>
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      <div className="flex -space-x-1.5">
        {hosts.map((h) =>
          h.photo_url ? (
            <img
              key={h.host_id}
              src={h.photo_url}
              alt={h.display_name || ''}
              className={cn(avatar, 'rounded-full object-cover ring-2 ring-background')}
            />
          ) : (
            <div
              key={h.host_id}
              className={cn(avatar, 'rounded-full bg-muted flex items-center justify-center ring-2 ring-background')}
            >
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          ),
        )}
      </div>
      <span className="font-medium truncate">
        {hosts.map((h) => h.display_name).filter(Boolean).join(', ')}
      </span>
    </div>
  );
}