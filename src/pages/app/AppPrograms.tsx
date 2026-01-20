import { useCoursesData } from '@/hooks/useAppData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, CheckCircle2, AlertCircle, ChevronRight, Sparkles, Unlock, Compass } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { CoursesSkeleton } from '@/components/app/skeletons';
import { format, isToday } from 'date-fns';
import { usePrograms } from '@/hooks/usePrograms';
import { ProgramCard } from '@/components/app/ProgramCard';

const AppCourses = () => {
  // Use centralized data hook
  const { enrollments, nextSessionMap, nextContentMap, isLoading } = useCoursesData();
  const { programs, isLoading: programsLoading } = usePrograms();
  
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
  
  // Filter browse programs to exclude enrolled ones
  const browsePrograms = programs.filter(p => !enrolledSlugs.has(p.slug));

  // Separate enrollments into active/upcoming and completed
  const activeRounds = enrollments?.filter(e => e.program_rounds?.status !== 'completed') || [];
  const completedRounds = enrollments?.filter(e => e.program_rounds?.status === 'completed') || [];
  
  // Also include enrollments without rounds (self-paced)
  const selfPacedEnrollments = enrollments?.filter(e => !e.program_rounds) || [];

  // Sort active rounds by next session date (soonest first)
  const sortedActiveRounds = [...activeRounds].sort((a, b) => {
    const aRoundId = a.program_rounds?.id;
    const bRoundId = b.program_rounds?.id;
    
    // Get next session or fallback to first_session_date
    const aNextSession = aRoundId ? nextSessionMap.get(aRoundId) : null;
    const bNextSession = bRoundId ? nextSessionMap.get(bRoundId) : null;
    
    const aDate = aNextSession || a.program_rounds?.first_session_date || a.program_rounds?.start_date;
    const bDate = bNextSession || b.program_rounds?.first_session_date || b.program_rounds?.start_date;
    
    // Rounds with dates come first
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return 0;
    
    // Sort by soonest date first
    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

  const EnrolledProgramCard = ({ enrollment, isCompleted = false }: { enrollment: typeof enrollments[0], isCompleted?: boolean }) => {
    const round = enrollment.program_rounds;

    const isUpcoming = round?.status === 'upcoming';
    const isActive = round?.status === 'active';
    const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
    const isRoundUnseen = round?.id ? unseenRounds.has(round.id) : false;
    const hasNotification = isEnrollmentUnseen || isRoundUnseen;
    
    // Get actual next session date from our map
    const nextSessionDate = round?.id ? nextSessionMap.get(round.id) : null;
    const displayDate = nextSessionDate || round?.first_session_date;
    const isSessionToday = displayDate && isToday(new Date(displayDate));

    // Get next content info
    const nextContent = round?.id ? nextContentMap.get(round.id) : null;

    // Get first sentence of important_message
    const importantNote = round?.important_message
      ? round.important_message.split(/[.!?]/)[0]?.trim()
      : null;

    // Get video thumbnail
    let thumbnailUrl = '';
    if (round?.video_url) {
      if (round.video_url.includes('youtube.com/watch')) {
        const videoId = round.video_url.split('v=')[1]?.split('&')[0];
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (round.video_url.includes('youtu.be/')) {
        const videoId = round.video_url.split('youtu.be/')[1]?.split('?')[0];
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (round.video_url.includes('vimeo.com/')) {
        const videoId = round.video_url.split('vimeo.com/')[1]?.split('?')[0].replace('video/', '');
        thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
      }
    }

    return (
      <Link 
        key={enrollment.id} 
        to={`/app/course/${enrollment.program_slug}`}
        onClick={() => {
          if (isEnrollmentUnseen && markEnrollmentViewed) {
            markEnrollmentViewed(enrollment.id);
          }
          if (round?.id && isRoundUnseen && markRoundViewed) {
            markRoundViewed(round.id);
          }
        }}
        className="block"
      >
        <div className={`relative w-full rounded-2xl overflow-hidden shadow-lg transition-transform active:scale-[0.98] ${
          hasNotification && !isCompleted ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${isCompleted ? 'opacity-75' : ''}`}>
          {/* Background */}
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={enrollment.course_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`absolute inset-0 ${
              isCompleted 
                ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                : 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700'
            }`} />
          )}
          
          {/* Overlay - stronger gradient from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          
          {/* Content */}
          <div className="relative p-4 min-h-[120px] flex flex-col justify-between">
            {/* Top row: Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {hasNotification && !isCompleted && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 h-5">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
              {isCompleted ? (
                <Badge className="bg-white/20 text-white backdrop-blur-sm text-[10px] px-2 py-0.5 h-5">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : round ? (
                <Badge 
                  className={`text-[10px] px-2 py-0.5 h-5 ${
                    isActive 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/20 text-white backdrop-blur-sm'
                  }`}
                >
                  {round.status}
                </Badge>
              ) : (
                <Badge className="bg-white/20 text-white backdrop-blur-sm text-[10px] px-2 py-0.5 h-5">
                  Self-Paced
                </Badge>
              )}
            </div>
            
            {/* Bottom content */}
            <div className="space-y-1">
              {/* Course name */}
              <h3 className="text-white font-bold text-base leading-tight line-clamp-1">
                {enrollment.course_name}
              </h3>
              
              {/* Round name + View schedule link */}
              {round && (
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="truncate">{round.round_name}</span>
                  <span>•</span>
                  <span className="flex items-center whitespace-nowrap font-medium">
                    View schedule
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              )}
              
              {/* Next session info */}
              {!isCompleted && displayDate && (
                <p className={`text-xs font-medium ${isSessionToday ? 'text-green-400' : 'text-white/90'}`}>
                  {isSessionToday 
                    ? `Next: Today at ${format(new Date(displayDate), 'h:mm a')}`
                    : isUpcoming 
                      ? `Starts: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                      : `Next: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                  }
                </p>
              )}
              
              {/* Next content unlock info */}
              {!isCompleted && nextContent && (
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300">
                  <Unlock className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {nextContent.title} unlocks {nextContent.countdownText}
                  </span>
                </div>
              )}
              
              {/* Important note (if exists) */}
              {!isCompleted && importantNote && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{importantNote}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const totalPrograms = (enrollments?.length || 0);

  return (
    <>
      <SEOHead 
        title="My Programs - LadyBoss Academy"
        description="Your enrolled programs and courses"
      />

      <AppHeader 
        title="Programs" 
        subtitle={totalPrograms > 0 ? `${totalPrograms} enrolled` : undefined}
      />
      <AppHeaderSpacer />
      
      <div className="container max-w-4xl py-4 px-4 space-y-6 pb-24">
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
              {sortedActiveRounds.map((enrollment) => (
                <EnrolledProgramCard key={enrollment.id} enrollment={enrollment} />
              ))}
              {selfPacedEnrollments.map((enrollment) => (
                <EnrolledProgramCard key={enrollment.id} enrollment={enrollment} />
              ))}
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
              {completedRounds.map((enrollment) => (
                <EnrolledProgramCard key={enrollment.id} enrollment={enrollment} isCompleted />
              ))}
            </div>
          </div>
        )}

        {/* Browse Programs Section */}
        {browsePrograms.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                Browse Programs
              </h2>
              <Link to="/app/browse">
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                  View All
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {browsePrograms.slice(0, 4).map((program) => (
                <Link key={program.slug} to={`/app/browse/${program.slug}`}>
                  <ProgramCard 
                    title={program.title}
                    image={program.image}
                    type={program.type}
                    isFree={program.isFree}
                  />
                </Link>
              ))}
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
      </div>
    </>
  );
};

export default AppCourses;
