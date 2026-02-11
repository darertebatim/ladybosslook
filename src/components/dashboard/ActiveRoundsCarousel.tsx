import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
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
  // Get unseen content from context (already tracks new/updated programs)
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

  // Check if any programs have the "new" or "updated" tag
  const hasUnseenPrograms = unseenEnrollments.size > 0 || unseenRounds.size > 0;
  
  // Track if we've already auto-expanded for the current unseen items (persisted across navigations)
  const hasAutoExpandedRef = useRef(() => {
    return sessionStorage.getItem('programsAutoExpanded') === 'true';
  });

  // Persist collapsed state - default to collapsed
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    // Default to collapsed unless explicitly set to 'false'
    return saved !== 'false';
  });

  // Auto-expand ONLY when unseen programs are newly detected (transition from none to some)
  useEffect(() => {
    if (hasUnseenPrograms && !hasAutoExpandedRef.current) {
      setIsCollapsed(false);
      hasAutoExpandedRef.current = true;
    } else if (!hasUnseenPrograms) {
      // Reset the flag when there are no unseen programs
      hasAutoExpandedRef.current = false;
    }
  }, [hasUnseenPrograms]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, isCollapsed.toString());
  }, [isCollapsed]);

  const toggleCollapse = () => {
    haptic.light();
    setIsCollapsed(!isCollapsed);
  };

  // When no programs, hide the section completely
  if (activeRounds.length === 0) {
    return null;
  }
  return <div className={`tour-programs-carousel ${isCollapsed ? '' : 'space-y-2'}`}>
      {/* Header - always visible, acts as expand/collapse toggle */}
      <button className="w-full flex items-center justify-between rounded-2xl transition-all py-0 px-0 bg-primary-foreground shadow-none" onClick={toggleCollapse} aria-label={isCollapsed ? 'Expand programs' : 'Collapse programs'} aria-expanded={!isCollapsed}>
        <div className="flex items-center gap-1.5">
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
          <h2 className="text-sm font-semibold text-foreground">Your Programs</h2>
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {activeRounds.length}
          </Badge>
          <span className="text-[10px] text-muted-foreground ml-1">
            {isCollapsed ? 'tap to expand' : 'tap to collapse'}
          </span>
        </div>
        <Link to="/app/programs" className="text-xs text-primary font-medium flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </button>

      {/* Carousel - collapsible */}
      <div className={`overflow-hidden transition-all duration-200 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[120px] opacity-100'}`}>
        <Carousel opts={{
        align: 'start',
        loop: false
      }} className="w-full">
          <CarouselContent className="-ml-3">
            {activeRounds.map(enrollment => {
            const roundId = enrollment.program_rounds?.id;
            const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
            const isRoundUnseen = roundId ? unseenRounds.has(roundId) : false;
            const hasNotification = isEnrollmentUnseen || isRoundUnseen;
            return <CarouselItem key={enrollment.id} className="pl-3 basis-auto">
                  <CompactRoundCard enrollment={enrollment} nextSessionDate={roundId ? nextSessionMap.get(roundId) : null} isUnseen={hasNotification} onView={() => {
                if (isEnrollmentUnseen && markEnrollmentViewed) {
                  markEnrollmentViewed(enrollment.id);
                }
                if (isRoundUnseen && roundId && markRoundViewed) {
                  markRoundViewed(roundId);
                }
              }} />
                </CarouselItem>;
          })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>;
}