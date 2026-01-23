import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { CompactRoundCard } from './CompactRoundCard';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { haptic } from '@/lib/haptics';

interface ActiveRoundsCarouselProps {
  activeRounds: any[];
  nextSessionMap: Map<string, string>;
}

const COLLAPSED_KEY = 'programsCarouselCollapsed';

export function ActiveRoundsCarousel({ 
  activeRounds, 
  nextSessionMap 
}: ActiveRoundsCarouselProps) {
  // Persist collapsed state - default to collapsed
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    // Default to collapsed unless explicitly set to 'false'
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, isCollapsed.toString());
  }, [isCollapsed]);

  const toggleCollapse = () => {
    haptic.light();
    setIsCollapsed(!isCollapsed);
  };

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
      <div className="h-[88px] flex items-center justify-center gap-3 px-4">
        <GraduationCap className="h-8 w-8 text-muted-foreground/50 flex-shrink-0" />
        <div className="flex flex-col items-start gap-1">
          <p className="text-muted-foreground text-sm">No active programs</p>
          <Link to="/app/browse">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Browse Programs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`tour-programs-carousel ${isCollapsed ? '' : 'space-y-2'}`}>
      {/* Header - always visible, acts as expand/collapse toggle */}
      <button 
        className={`w-full flex items-center justify-between px-2 rounded-xl transition-all active:bg-black/5 ${
          isCollapsed ? 'bg-muted/60 py-2 border border-border/50' : 'py-1.5'
        }`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? 'Expand programs' : 'Collapse programs'}
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown 
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : ''
            }`} 
          />
          <h2 className="text-sm font-semibold text-foreground">Your Programs</h2>
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {activeRounds.length}
          </Badge>
          {isCollapsed && (
            <span className="text-[10px] text-muted-foreground ml-1">tap to expand</span>
          )}
        </div>
        <Link 
          to="/app/programs"
          className="text-xs text-primary font-medium flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </button>

      {/* Carousel - collapsible */}
      <div 
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[120px] opacity-100'
        }`}
      >
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
    </div>
  );
}
