import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactRoundCard } from './CompactRoundCard';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { haptic } from '@/lib/haptics';
interface ActiveRoundsCarouselProps {
  activeRounds: any[];
  nextSessionMap: Record<string, string> | Map<string, string>;
  programImageMap?: Record<string, string>;
}
const COLLAPSED_KEY = 'programsCarouselCollapsed';

export function ActiveRoundsCarousel({
  activeRounds,
  nextSessionMap,
  programImageMap = {}
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
  
  // Persist collapsed state - default to collapsed
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    return saved !== 'false';
  });

  // Track if we've already auto-expanded for the current unseen items (persisted across navigations)
  const hasAutoExpanded = sessionStorage.getItem('programsAutoExpanded') === 'true';

  // Auto-expand ONLY when unseen programs are newly detected (transition from none to some)
  useEffect(() => {
    if (hasUnseenPrograms && !hasAutoExpanded) {
      setIsCollapsed(false);
      sessionStorage.setItem('programsAutoExpanded', 'true');
    } else if (!hasUnseenPrograms) {
      sessionStorage.removeItem('programsAutoExpanded');
    }
  }, [hasUnseenPrograms, hasAutoExpanded]);

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
      {/* Header - styled like a path row with checkpoint dot */}
      <div className="relative pl-[60px]">
        <div
          className="absolute left-[22px] top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full flex items-center justify-center"
          style={{ background: '#FFFFFF', border: '2px solid #F5DCC8' }}
        >
          <GraduationCap className="w-3 h-3" style={{ color: '#EB5E33' }} />
        </div>
        <button
          className="w-full flex items-center justify-between rounded-2xl px-3 py-2.5 active:scale-[0.99] transition-transform"
          style={{ background: '#FFFFFF', border: '1px solid #F5DCC8' }}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand programs' : 'Collapse programs'}
          aria-expanded={!isCollapsed}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
              style={{ color: '#8B6E5A' }}
            />
            <h2 className="text-[13.5px] font-semibold" style={{ color: '#2D1A0E' }}>Your Programs</h2>
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {activeRounds.length}
            </Badge>
            <span className="text-[10px] ml-1 truncate" style={{ color: '#8B6E5A' }}>
              {isCollapsed ? 'tap to expand' : 'tap to collapse'}
            </span>
          </div>
          <Link
            to="/app/myprograms"
            className="text-[11px] font-semibold flex items-center gap-0.5 shrink-0"
            style={{ color: '#EB5E33' }}
            onClick={e => e.stopPropagation()}
          >
            View All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </button>
      </div>

      {/* Vertical stack - collapsible (matches path task rows) */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
        <div className="pt-2">
          {activeRounds.map((enrollment, index) => {
            const roundId = enrollment.program_rounds?.id;
            const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
            const isRoundUnseen = roundId ? unseenRounds.has(roundId) : false;
            const hasNotification = isEnrollmentUnseen || isRoundUnseen;
            return (
              <CompactRoundCard
                key={enrollment.id}
                  enrollment={enrollment}
                  colorIndex={index}
                  nextSessionDate={roundId ? (nextSessionMap instanceof Map ? nextSessionMap.get(roundId) : nextSessionMap[roundId]) ?? null : null}
                  programImage={programImageMap[enrollment.program_slug] || null}
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
            );
          })}
        </div>
      </div>
    </div>;
}