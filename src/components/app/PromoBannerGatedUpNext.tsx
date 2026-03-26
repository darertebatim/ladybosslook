import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  audioId?: string;
  playlistId?: string;
  children: ReactNode;
}

/**
 * Wrapper that hides children (Up Next box) when there's an active
 * audio-targeted promo banner for the current audio track.
 * The PromoBanner component handles rendering the banner itself;
 * this just gates whether Up Next is visible.
 */
export function PromoBannerGatedUpNext({ audioId, children }: Props) {
  const { data: hasAudioBanner } = useQuery({
    queryKey: ['audio-targeted-banner', audioId],
    queryFn: async () => {
      if (!audioId) return false;
      const { data, error } = await supabase
        .from('promo_banners')
        .select('id')
        .eq('is_active', true)
        .contains('target_audio_ids', [audioId])
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!audioId,
  });

  // If there's an audio-targeted banner, hide Up Next (banner overlays it)
  if (hasAudioBanner) return null;

  return <>{children}</>;
}
