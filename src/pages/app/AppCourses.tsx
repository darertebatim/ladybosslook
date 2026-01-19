import { useCoursesData } from '@/hooks/useAppData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Calendar, Users, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { CoursesSkeleton } from '@/components/app/skeletons';
import { format } from 'date-fns';

const AppCourses = () => {
  // Use centralized data hook
  const { enrollments, nextSessionMap, isLoading } = useCoursesData();
  
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

  const RoundCard = ({ enrollment, isCompleted = false }: { enrollment: typeof enrollments[0], isCompleted?: boolean }) => {
    const round = enrollment.program_rounds;

    const isUpcoming = round?.status === 'upcoming';
    const isActive = round?.status === 'active';
    const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
    const isRoundUnseen = round?.id ? unseenRounds.has(round.id) : false;
    const hasNotification = isEnrollmentUnseen || isRoundUnseen;
    
    // Get actual next session date from our map
    const nextSessionDate = round?.id ? nextSessionMap.get(round.id) : null;

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
      >
        <Card className={`shadow-sm active:scale-[0.98] transition-transform overflow-hidden ${
          isCompleted 
            ? 'border border-border opacity-75' 
            : hasNotification 
              ? 'border-primary border-2' 
              : 'border border-border'
        }`}>
          <CardContent className="p-4 pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className={`font-semibold truncate ${isCompleted ? 'text-muted-foreground' : ''}`}>
                    {enrollment.course_name}
                  </h3>
                  {hasNotification && !isCompleted && (
                    <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 h-auto shrink-0">
                      <Sparkles className="h-3 w-3 mr-0.5" />
                      New
                    </Badge>
                  )}
                  {isCompleted ? (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground shrink-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : round ? (
                    <Badge 
                      variant={isActive ? 'default' : 'secondary'}
                      className={`shrink-0 ${isActive ? 'bg-green-500' : ''}`}
                    >
                      {round.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Self-Paced
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {round && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">{round.round_name}</span>
                    </div>
                  )}
                  
                  {!isCompleted && round && (nextSessionDate || round.first_session_date) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {isUpcoming ? 'Starts ' : 'Next session: '}
                        {format(new Date(nextSessionDate || round.first_session_date!), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                  )}
                  
                  {round?.start_date && (
                    <div className="flex items-center gap-2 text-xs">
                      <span>
                        {format(new Date(round.start_date), 'MMM d')}
                        {round.end_date && ` - ${format(new Date(round.end_date), 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isCompleted && round?.video_url && (() => {
              let thumbnailUrl = '';
              
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
              
              return (
                <div className="mt-3 relative aspect-video rounded-md overflow-hidden bg-muted group">
                  {thumbnailUrl && (
                    <img 
                      src={thumbnailUrl} 
                      alt="Video preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[16px] border-l-primary border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {!isCompleted && round?.important_message && (
              <div className="mt-3 p-2 bg-primary/5 rounded-md border border-primary/20">
                <p className="text-xs text-foreground line-clamp-2">
                  {round.important_message}
                </p>
              </div>
            )}
          </CardContent>
          
          <div className={`mt-3 px-4 py-3 flex items-center justify-between ${
            isCompleted ? 'bg-muted' : 'bg-foreground'
          }`}>
            <span className={`text-sm font-medium ${isCompleted ? 'text-muted-foreground' : 'text-background'}`}>
              {isCompleted ? 'View Materials' : 'View Schedule & Materials'}
            </span>
            <ArrowRight className={`h-4 w-4 ${isCompleted ? 'text-muted-foreground' : 'text-background'}`} />
          </div>
        </Card>
      </Link>
    );
  };

  const totalPrograms = (enrollments?.length || 0);
  const hasNoPrograms = totalPrograms === 0;

  return (
    <>
      <SEOHead 
        title="My Programs - LadyBoss Academy"
        description="Your enrolled programs and courses"
      />

      <AppHeader 
        title="My Programs" 
        subtitle={`${totalPrograms} program${totalPrograms !== 1 ? 's' : ''}`}
      />
      <AppHeaderSpacer />
      
      <div className="container max-w-4xl py-4 px-4 space-y-6">
        {hasNoPrograms ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No programs enrolled yet
              </p>
              <Link to="/app/browse">
                <Button variant="outline">
                  Browse Programs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Rounds Section */}
            {(sortedActiveRounds.length > 0 || selfPacedEnrollments.length > 0) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Your Active Programs
                  </h2>
                  <Badge variant="secondary">{sortedActiveRounds.length + selfPacedEnrollments.length}</Badge>
                </div>

                <div className="flex flex-col gap-4">
                  {sortedActiveRounds.map((enrollment) => (
                    <RoundCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                  {selfPacedEnrollments.map((enrollment) => (
                    <RoundCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Rounds Section */}
            {completedRounds.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                    Completed Programs
                  </h2>
                  <Badge variant="outline" className="text-muted-foreground">{completedRounds.length}</Badge>
                </div>

                <div className="flex flex-col gap-4">
                  {completedRounds.map((enrollment) => (
                    <RoundCard key={enrollment.id} enrollment={enrollment} isCompleted />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if no active rounds but has completed */}
            {sortedActiveRounds.length === 0 && selfPacedEnrollments.length === 0 && completedRounds.length > 0 && (
              <Card className="mb-4">
                <CardContent className="py-6">
                  <div className="text-center">
                    <GraduationCap className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No active programs right now</p>
                    <Link to="/app/browse">
                      <Button className="mt-3" variant="outline" size="sm">
                        Browse New Programs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AppCourses;
