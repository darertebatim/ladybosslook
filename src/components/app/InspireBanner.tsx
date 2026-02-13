import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { RoutineBankItem } from '@/hooks/useRoutinesBank';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspireBannerProps {
  routines: (RoutineBankItem & { totalDuration?: number })[];
}

const colorGradients: Record<string, string> = {
  yellow: 'from-amber-400 to-amber-600',
  pink: 'from-pink-400 to-pink-600',
  purple: 'from-purple-400 to-purple-600',
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
  teal: 'from-teal-400 to-teal-600',
  indigo: 'from-indigo-400 to-indigo-600',
  rose: 'from-rose-400 to-rose-600',
  amber: 'from-amber-400 to-amber-600',
  mint: 'from-teal-300 to-teal-500',
};

// Helper to check if string is emoji
const isEmoji = (str: string) => 
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u.test(str);

export function InspireBanner({ routines }: InspireBannerProps) {
  const navigate = useNavigate();

  if (!routines || routines.length === 0) return null;

  return (
    <Carousel className="w-full">
      <CarouselContent className="-ml-2">
        {routines.map((routine) => {
          const color = routine.color || 'purple';
          const gradient = colorGradients[color] || colorGradients.purple;
          const routineEmoji = routine.emoji && isEmoji(routine.emoji) ? routine.emoji : '✨';

          return (
            <CarouselItem key={routine.id} className="pl-2 basis-[90%]">
              <button
                onClick={() => navigate(`/app/rituals/${routine.id}`)}
                className={cn(
                  'relative w-full h-36 rounded-2xl overflow-hidden',
                  'bg-gradient-to-br',
                  gradient
                )}
              >
                {routine.cover_image_url ? (
                  <img
                    src={routine.cover_image_url}
                    alt={routine.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                  />
                ) : (
                  <div className="absolute right-4 bottom-4 opacity-20">
                    <span className="text-7xl">{routineEmoji}</span>
                  </div>
                )}
                
                <div className="relative h-full flex flex-col justify-end p-4 text-left">
                  <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full w-fit mb-2">
                    Featured
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {routine.title}
                  </h3>
                  {routine.subtitle && (
                    <p className="text-white/80 text-sm mt-0.5 line-clamp-1">
                      {routine.subtitle}
                    </p>
                  )}
                </div>
              </button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
