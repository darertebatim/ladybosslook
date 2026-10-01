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
 * Slim one-row profile peek. Tap opens the profile page.
 * variant "floating" — standalone white card (Path page).
 * variant "inset" — compact row nested inside the My Learning card.
 */
export function PathProfileQuickCard({
  variant = 'floating',
  className = '',
}: {
  variant?: 'floating' | 'inset';
  className?: string;
}) {
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
  const inset = variant === 'inset';

  return (
    <button
      type="button"
      onClick={() => {
        haptic.light();
        navigate('/app/myprofile');
      }}
      className={`w-full flex items-center gap-3 text-left transition-transform active:scale-[0.99] ${
        inset
          ? `rounded-xl bg-peach/70 px-2.5 py-2 ${className}`
          : `px-3 py-2.5 rounded-2xl shadow-ios ${className}`
      }`}
      style={inset ? undefined : { background: '#FFFFFF', border: `1px solid ${O.border}` }}
      aria-label="Open my profile"
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className={`${inset ? 'w-8 h-8' : 'w-11 h-11'} rounded-full object-cover shrink-0`}
          style={{ border: `2px solid ${O.peachMid}` }}
        />
      ) : (
        <span
          className={`${inset ? 'w-8 h-8 text-[12px]' : 'w-11 h-11 text-[15px]'} rounded-full flex items-center justify-center font-bold shrink-0`}
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
        <span
          className={`block font-bold truncate ${inset ? 'text-[12.5px]' : 'text-[14px]'}`}
          style={{ color: O.fg }}
        >
          My Profile
        </span>
        <span
          className={`block truncate ${inset ? 'text-[10.5px] mt-0' : 'text-[11px] mt-0.5'}`}
          style={{ color: O.fgMuted }}
        >
          {user.email || profile?.email || ''}
        </span>
      </span>
      <span
        className={`shrink-0 flex items-center gap-1 ${inset ? 'text-[10.5px]' : 'text-[11.5px]'} font-semibold`}
        style={{ color: O.fgMuted }}
      >
        View & edit
      </span>
      <ChevronRight className={`${inset ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} style={{ color: O.fgMuted }} />
    </button>
  );
}
