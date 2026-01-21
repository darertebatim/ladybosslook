import { Link } from 'react-router-dom';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { CompactRoundCard } from './CompactRoundCard';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';

interface ActiveRoundsCarouselProps {
  activeRounds: any[];
  nextSessionMap: Map<string, string>;
}

export function ActiveRoundsCarousel({ 
  activeRounds, 
  nextSessionMap 
}: ActiveRoundsCarouselProps) {
  // Get unseen content
  let unseenEnrollments = new Set<string>();
  let unseenRounds = new Set<string>();
  let markEnrollmentViewed: ((id: string) => Promise<void>) | null = null;
  let markRoundViewed: ((id: string) => Promise<void>) | null = null;
  
  try {
    const unseenContent = useUnseenContentContext();
    unseenEnrollments = unseenContent.unseenEnrollments;
    unseenRounds = unseenContent.unseenRounds;
    markEnrollmentViewed = unseenContent.markEnrollmentViewed;
    markRoundViewed = unseenContent.markRoundViewed;
  } catch {
    // Provider not available
  }

  if (activeRounds.length === 0) {
    return (
      <div className="flex items-center justify-between h-[72px] px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/80">No active programs</p>
            <p className="text-xs text-muted-foreground">Enroll in a program to get started</p>
          </div>
        </div>
        <Link to="/app/browse">
          <Button variant="outline" size="sm" className="shrink-0">
            Browse
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-foreground">Your Programs</h2>
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {activeRounds.length}
          </Badge>
        </div>
        <Link 
          to="/app/programs"
          className="text-xs text-primary font-medium flex items-center gap-0.5"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {activeRounds.map((enrollment) => {
            const roundId = enrollment.program_rounds?.id;
            const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
            const isRoundUnseen = roundId ? unseenRounds.has(roundId) : false;
            const hasNotification = isEnrollmentUnseen || isRoundUnseen;

            return (
              <CarouselItem key={enrollment.id} className="pl-3 basis-auto">
                <CompactRoundCard
                  enrollment={enrollment}
                  nextSessionDate={roundId ? nextSessionMap.get(roundId) : null}
                  isUnseen={hasNotification}
                  onView={() => {
                    if (isEnrollmentUnseen && markEnrollmentViewed) {
                      markEnrollmentViewed(enrollment.id);
                    }
                    if (isRoundUnseen && roundId && markRoundViewed) {
                      markRoundViewed(roundId);
                    }
                  }}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
