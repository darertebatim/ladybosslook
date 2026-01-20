import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { RoutinePlan } from '@/hooks/useRoutinePlans';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspireBannerProps {
  plans: RoutinePlan[];
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
};

export function InspireBanner({ plans }: InspireBannerProps) {
  const navigate = useNavigate();

  if (!plans || plans.length === 0) return null;

  return (
    <Carousel className="w-full">
      <CarouselContent className="-ml-2">
        {plans.map((plan) => {
          const IconComponent = (LucideIcons as any)[plan.icon] || LucideIcons.Sparkles;
          const gradient = colorGradients[plan.color] || colorGradients.purple;

          return (
            <CarouselItem key={plan.id} className="pl-2 basis-[90%]">
              <button
                onClick={() => navigate(`/app/routines/${plan.id}`)}
                className={cn(
                  'relative w-full h-36 rounded-2xl overflow-hidden',
                  'bg-gradient-to-br',
                  gradient
                )}
              >
                {plan.cover_image_url ? (
                  <img
                    src={plan.cover_image_url}
                    alt={plan.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                  />
                ) : (
                  <div className="absolute right-4 bottom-4 opacity-20">
                    <IconComponent className="w-24 h-24 text-white" />
                  </div>
                )}
                
                <div className="relative h-full flex flex-col justify-end p-4 text-left">
                  <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full w-fit mb-2">
                    Featured
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {plan.title}
                  </h3>
                  {plan.subtitle && (
                    <p className="text-white/80 text-sm mt-0.5 line-clamp-1">
                      {plan.subtitle}
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
