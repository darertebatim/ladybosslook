import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';
import { useProfileDisplayName } from '@/hooks/useFirstName';

// Warm palette tokens (mirror of AppMyRiloPath's O object)
const O = {
  fg: '#2D1A0E',
  fgMuted: '#8B6E5A',
  peach: '#FFE6C9',
  peachMid: '#FFD2A1',
  border: '#F5DCC8',
};

/**
 * Slim one-row profile peek on the Path page, above today's events.
 * Tap opens the profile page.
 */
export function PathProfileQuickCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = useProfileDisplayName();

  const { data: profile } = useQuery({
    queryKey: ['path-profile-peek', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, email')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (!user) return null;

  const firstName = (name || '').split(' ')[0];
  const initials = (firstName?.[0] || profile?.email?.[0] || '?').toUpperCase();

  return (
    <button
      type="button"
      onClick={() => {
        haptic.light();
        navigate('/app/myprofile');
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left shadow-ios active:scale-[0.99] transition-transform"
      style={{ background: '#FFFFFF', border: `1px solid ${O.border}` }}
      aria-label="Open my profile"
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="w-11 h-11 rounded-full object-cover shrink-0"
          style={{ border: `2px solid ${O.peachMid}` }}
        />
      ) : (
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, ${O.peach}, ${O.peachMid})`,
            color: O.fg,
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(235,94,51,0.18)',
          }}
        >
          {initials}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold truncate" style={{ color: O.fg }}>
          {firstName ? `Hi, ${firstName} 👋` : 'My Profile'}
        </span>
        <span className="block text-[11px] mt-0.5" style={{ color: O.fgMuted }}>
          Your space — progress, settings & accounts
        </span>
      </span>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: O.fgMuted }} />
    </button>
  );
}
