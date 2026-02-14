import { useCallback, useState } from 'react';
import { useCoursesData } from '@/hooks/useAppData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, CheckCircle2, ChevronRight, Compass } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { CoursesSkeleton } from '@/components/app/skeletons';
import { usePrograms } from '@/hooks/usePrograms';
import { EnrolledProgramCard } from '@/components/app/EnrolledProgramCard';
import { ProgramsTour, TourHelpButton } from '@/components/app/tour';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const AppCourses = () => {
  // Use centralized data hook
  const { enrollments, nextSessionMap, nextContentMap, isLoading } = useCoursesData();
  const { programs, isLoading: programsLoading } = usePrograms();
  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);
  
  // Get unseen content - wrap in try/catch in case provider is missing
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
    // Provider not available, ignore
  }

  if (isLoading) {
    return (
      <>
        <AppHeader title="My Programs" subtitle="Loading..." />
        <AppHeaderSpacer />
        <CoursesSkeleton />
      </>
    );
  }

  // Get enrolled program slugs
  const enrolledSlugs = new Set(enrollments?.map(e => e.program_slug) || []);
  
  // Filter browse programs: only free/free-on-iOS programs that aren't enrolled
  const browsePrograms = programs.filter(p => 
    !enrolledSlugs.has(p.slug) && 
    (p.isFree || p.priceAmount === 0 || p.is_free_on_ios === true)
  );

  // Separate enrollments into active/upcoming and completed
  // For rounds: check round.status; for self-paced: check enrollment.status
  const activeRounds = enrollments?.filter(e => e.program_rounds && e.program_rounds.status !== 'completed') || [];
  const completedRounds = enrollments?.filter(e => 
    (e.program_rounds && e.program_rounds.status === 'completed') || 
    (!e.program_rounds && e.status === 'completed')
  ) || [];
  
  // Self-paced enrollments that are still active (not completed)
  const selfPacedEnrollments = enrollments?.filter(e => !e.program_rounds && e.status !== 'completed') || [];

  // Sort active rounds: prioritize those with actual scheduled sessions, then by nearest date
  const sortedActiveRounds = [...activeRounds].sort((a, b) => {
    const aRoundId = a.program_rounds?.id;
    const bRoundId = b.program_rounds?.id;
    
    // Get next session from map (actual scheduled sessions)
    const aNextSession = aRoundId ? nextSessionMap.get(aRoundId) : null;
    const bNextSession = bRoundId ? nextSessionMap.get(bRoundId) : null;
    
    // Check if program has actual content drip schedule
    const aNextContent = aRoundId ? nextContentMap.get(aRoundId) : null;
    const bNextContent = bRoundId ? nextContentMap.get(bRoundId) : null;
    
    // Priority scoring: programs with scheduled sessions get highest priority
    const aHasScheduledSession = !!aNextSession;
    const bHasScheduledSession = !!bNextSession;
    const aHasContentSchedule = !!aNextContent;
    const bHasContentSchedule = !!bNextContent;
    
    // Programs with scheduled sessions come first
    if (aHasScheduledSession && !bHasScheduledSession) return -1;
    if (!aHasScheduledSession && bHasScheduledSession) return 1;
    
    // If both have sessions OR both don't, check content schedule
    if (aHasContentSchedule && !bHasContentSchedule) return -1;
    if (!aHasContentSchedule && bHasContentSchedule) return 1;
    
    // Finally sort by nearest date
    const aDate = aNextSession || a.program_rounds?.first_session_date || a.program_rounds?.start_date;
    const bDate = bNextSession || b.program_rounds?.first_session_date || b.program_rounds?.start_date;
    
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return 0;
    
    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

  // Helper to get notification and session info for a card
  const getCardProps = (enrollment: typeof enrollments[0]) => {
    const round = enrollment.program_rounds;
    const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
    const isRoundUnseen = round?.id ? unseenRounds.has(round.id) : false;
    const hasNotification = isEnrollmentUnseen || isRoundUnseen;
    const nextSessionDate = round?.id ? nextSessionMap.get(round.id) : null;
    const nextContent = round?.id ? nextContentMap.get(round.id) : null;
    
    const onMarkViewed = () => {
      if (isEnrollmentUnseen && markEnrollmentViewed) {
        markEnrollmentViewed(enrollment.id);
      }
      if (round?.id && isRoundUnseen && markRoundViewed) {
        markRoundViewed(round.id);
      }
    };
    
    return { hasNotification, nextSessionDate, nextContent, onMarkViewed };
  };

  const totalPrograms = (enrollments?.length || 0);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead 
        title="My Programs - LadyBoss Academy"
        description="Your enrolled programs and courses"
      />

      <AppHeader 
        title="Programs" 
        subtitle={totalPrograms > 0 ? `${totalPrograms} enrolled` : undefined}
        rightAction={startTour ? <TourHelpButton onClick={startTour} /> : undefined}
      />
      <AppHeaderSpacer />
      
      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="container max-w-4xl py-4 px-4 space-y-6 pb-safe">
        {/* Active Rounds Section */}
        {(sortedActiveRounds.length > 0 || selfPacedEnrollments.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Your Active Programs
              </h2>
              <Badge variant="secondary" className="text-xs">{sortedActiveRounds.length + selfPacedEnrollments.length}</Badge>
            </div>

            <div className="flex flex-col gap-3">
              {sortedActiveRounds.map((enrollment) => {
                const props = getCardProps(enrollment);
                return (
                  <EnrolledProgramCard 
                    key={enrollment.id} 
                    enrollment={enrollment}
                    nextSessionDate={props.nextSessionDate}
                    nextContent={props.nextContent}
                    hasNotification={props.hasNotification}
                    onMarkViewed={props.onMarkViewed}
                  />
                );
              })}
              {selfPacedEnrollments.map((enrollment) => {
                const props = getCardProps(enrollment);
                return (
                  <EnrolledProgramCard 
                    key={enrollment.id} 
                    enrollment={enrollment}
                    nextSessionDate={props.nextSessionDate}
                    nextContent={props.nextContent}
                    hasNotification={props.hasNotification}
                    onMarkViewed={props.onMarkViewed}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Rounds Section */}
        {completedRounds.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Completed Programs
              </h2>
              <Badge variant="outline" className="text-muted-foreground text-xs">{completedRounds.length}</Badge>
            </div>

            <div className="flex flex-col gap-3">
              {completedRounds.map((enrollment) => {
                const props = getCardProps(enrollment);
                return (
                  <EnrolledProgramCard 
                    key={enrollment.id} 
                    enrollment={enrollment} 
                    isCompleted
                    nextSessionDate={props.nextSessionDate}
                    nextContent={props.nextContent}
                    hasNotification={props.hasNotification}
                    onMarkViewed={props.onMarkViewed}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state if no programs at all */}
        {totalPrograms === 0 && browsePrograms.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No programs available
            </p>
          </div>
        )}

        {/* Empty enrolled state with browse below */}
        {totalPrograms === 0 && browsePrograms.length > 0 && (
          <div className="text-center py-8 mb-4">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No programs enrolled yet</p>
            <p className="text-xs text-muted-foreground mt-1">Browse and enroll in programs below</p>
          </div>
        )}

        {/* Spacer for fixed bottom section */}
        {browsePrograms.length > 0 && <div className="h-[100px]" />}
        </div>
      </div>

      {/* Fixed Browse Programs Section - Bottom Dashboard Style */}
      {browsePrograms.length > 0 && (
        <div 
          className="fixed bottom-[70px] left-0 right-0 z-30 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: '#F4ECFE' }}
        >
          <div className="py-2 space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-semibold text-foreground">Browse Programs</h2>
                <Badge variant="secondary" className="h-3.5 px-1 text-[9px] bg-white/60">
                  {browsePrograms.length}
                </Badge>
              </div>
              <Link 
                to="/app/explore"
                className="text-[10px] text-primary font-medium flex items-center gap-0.5"
              >
                View All
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Carousel - Compact cards */}
            <Carousel
              opts={{ align: 'start', loop: false }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 px-3">
                {browsePrograms.map((program) => (
                  <CarouselItem key={program.slug} className="pl-2 basis-[100px]">
                    <Link to={`/app/programs/${program.slug}`}>
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                        <img 
                          src={program.image} 
                          alt={program.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-1.5">
                          <p className="text-[9px] font-medium text-white line-clamp-2 leading-tight">
                            {program.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      )}

      {/* Feature Tour */}
      <ProgramsTour isFirstVisit={true} hasPrograms={enrollments && enrollments.length > 0} onTourReady={handleTourReady} />
    </div>
  );
};

export default AppCourses;
