import { useEarnedChallengeBadges } from '@/hooks/useEarnedChallengeBadges';

export const EarnedBadgesCard = () => {
  const { data: badges, isLoading } = useEarnedChallengeBadges();

  if (isLoading || !badges?.length) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-4 border border-amber-200/70 dark:border-amber-800/50"
      style={{
        background:
          'linear-gradient(135deg, #FFF8E7 0%, #FFE9C2 55%, #FFD89A 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-12 -right-10 w-40 h-40 rounded-full bg-amber-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-yellow-200/40 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center gap-2 mb-3">
        <span className="text-base">🏆</span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-widest uppercase text-amber-700">
            Trophy Cabinet
          </p>
          <h3 className="text-[15px] font-bold text-amber-950 leading-tight">
            Challenge Trophies
          </h3>
        </div>
        <span className="ml-auto text-[11px] font-bold text-amber-800 bg-white/70 px-2 py-0.5 rounded-full shadow-sm">
          {badges.length}
        </span>
      </div>

      {/* Trophies grid */}
      <div className="relative grid grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-amber-400/40 blur-lg" />
              <div className="relative w-[76px] h-[76px] rounded-2xl overflow-hidden bg-white ring-2 ring-amber-300/80 shadow-[0_8px_20px_-6px_rgba(217,119,6,0.55)]">
                <img
                  src={badge.badgeImageUrl}
                  alt={`${badge.routineTitle} trophy`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] text-amber-900 font-semibold text-center leading-tight max-w-[84px] truncate">
              {badge.routineEmoji} {badge.routineTitle}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
