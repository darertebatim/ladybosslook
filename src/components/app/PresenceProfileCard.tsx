import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Globe, Mail, ChevronRight, Cake, Heart, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function useProfileData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['presence-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, city, country, timezone, date_of_birth, relationship_status, occupation, gender')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function PresenceProfileCard() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfileData();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const location = [profile?.city, profile?.country].filter(Boolean).join(', ');

  // Format timezone nicely
  const formatTimezone = (tz?: string | null) => {
    if (!tz) return null;
    return tz.replace(/_/g, ' ').replace('America/', '').replace('Europe/', '').replace('Asia/', '');
  };

  const formatBirthday = (dob?: string | null) => {
    if (!dob) return null;
    try {
      const date = new Date(dob + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return null; }
  };

  return (
    <button
      onClick={() => navigate('/app/myprofile', { state: { from: '/app/presence' } })}
      className="w-full bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
    >
      {isLoading ? (
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      ) : (
        <>
          {/* Top row: avatar + name + email */}
          <div className="flex items-center gap-3.5">
            <Avatar className="w-14 h-14 shrink-0 border-2 border-orange-200">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile?.full_name || ''} />
              ) : null}
              <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-orange-900 truncate">
                {profile?.full_name || 'Set up your profile'}
              </p>
              <p className="text-xs text-orange-700/50 truncate mt-0.5">
                <Mail className="w-3 h-3 inline mr-1 -mt-0.5" />
                {profile?.email}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-orange-300 shrink-0" />
          </div>

          {/* Detail pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {location && (
              <InfoPill icon={MapPin} text={location} />
            )}
            {profile?.timezone && (
              <InfoPill icon={Globe} text={formatTimezone(profile.timezone)!} />
            )}
            {profile?.date_of_birth && (
              <InfoPill icon={Cake} text={formatBirthday(profile.date_of_birth)!} />
            )}
            {profile?.relationship_status && (
              <InfoPill icon={Heart} text={profile.relationship_status} />
            )}
            {profile?.occupation && (
              <InfoPill icon={Briefcase} text={profile.occupation} />
            )}
          </div>
        </>
      )}
    </button>
  );
}

function InfoPill({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-[11px] text-orange-700/60 font-medium">
      <Icon className="w-3 h-3 shrink-0" />
      {text}
    </span>
  );
}
