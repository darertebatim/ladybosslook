import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, FolderOpen, Calendar, ExternalLink, Info, MessageCircle, Music, Send, CheckCircle2, ArrowLeft, CalendarPlus, Loader2, Bell, Clock } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { downloadICSFile, generateICSFile } from '@/utils/calendar';
import { addEventToCalendar, addMultipleEventsToCalendar, isCalendarAvailable, CalendarEvent } from '@/lib/calendarIntegration';
import { format, addWeeks } from 'date-fns';
import { toast } from "sonner";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isNativeApp } from '@/lib/platform';
import { programImages } from '@/data/programs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { shouldShowEnrollmentReminder } from '@/hooks/useNotificationReminder';
import { subscribeToPushNotifications, checkPermissionStatus } from '@/lib/pushNotifications';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AppCourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEnrollmentReminder, setShowEnrollmentReminder] = useState(false);
  const [isEnablingEnrollment, setIsEnablingEnrollment] = useState(false);
  const [isSyncingAllSessions, setIsSyncingAllSessions] = useState(false);
  const [hasNewSessions, setHasNewSessions] = useState(false);
  const [addingSessionId, setAddingSessionId] = useState<string | null>(null);

  // Fetch enrollment and round data
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['course-enrollment', slug],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, program_rounds(*)')
        .eq('user_id', user.id)
        .eq('program_slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch user profile for WhatsApp message
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: program } = useQuery({
    queryKey: ['program', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select(`
          *
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const round = enrollment?.program_rounds;

  // Fetch sessions for this round from the database
  const { data: dbSessions } = useQuery({
    queryKey: ['program-sessions', round?.id],
    queryFn: async () => {
      if (!round?.id) return [];
      
      const { data, error } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('round_id', round.id)
        .eq('status', 'scheduled')
        .order('session_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!round?.id,
  });

  // Check if there are new sessions since last sync
  useEffect(() => {
    if (!round?.id || !dbSessions || dbSessions.length === 0) {
      setHasNewSessions(false);
      return;
    }
    
    const lastSyncKey = `lastCalendarSync_${round.id}`;
    const lastSyncTime = localStorage.getItem(lastSyncKey);
    
    if (!lastSyncTime) {
      // Never synced - show banner if there are sessions
      setHasNewSessions(true);
      return;
    }
    
    // Check if any session was created after last sync
    const lastSync = new Date(lastSyncTime);
    const hasNewer = dbSessions.some(session => {
      const createdAt = new Date((session as any).created_at || session.session_date);
      return createdAt > lastSync;
    });
    
    setHasNewSessions(hasNewer);
  }, [round?.id, dbSessions]);

  const handleAddToCalendar = async () => {
    if (!round?.first_session_date || !program) return;

    const event = {
      title: `${program.title} - First Session`,
      description: `Join us for the first session of ${program.title}`,
      startDate: new Date(round.first_session_date),
      endDate: new Date(
        new Date(round.first_session_date).getTime() +
        (round.first_session_duration || 90) * 60000
      ),
      location: round.google_meet_link || undefined,
    };

    // Native iOS/Android: Use native calendar integration
    if (isNativeApp() && isCalendarAvailable()) {
      try {
        const result = await addEventToCalendar({
          ...event,
          reminderMinutes: 60, // 1 hour reminder
        });
        
        if (result.success) {
          toast.success('Session added to your calendar!');
        } else if (result.error === 'Calendar permission denied') {
          toast.error('Please allow calendar access in Settings');
        } else {
          // Fallback to share sheet if native calendar fails
          const icsContent = generateICSFile(event);
          const fileName = `${program.title.replace(/\s+/g, '-')}.ics`;
          
          const fileResult = await Filesystem.writeFile({
            path: fileName,
            data: icsContent,
            directory: Directory.Cache,
          });

          await Share.share({
            title: 'Add to Calendar',
            text: `${event.title}`,
            url: fileResult.uri,
            dialogTitle: 'Add Event to Calendar'
          });
          
          toast.success('Select Calendar app to add event');
        }
      } catch (error) {
        console.error('Error adding calendar event:', error);
        toast.error('Failed to add to calendar');
      }
    } else {
      // Web: Download ICS file
      downloadICSFile(event, `${program.title.replace(/\s+/g, '-')}.ics`);
      toast.success('Calendar event downloaded!');
    }
  };

  // Generate all session events for the course - use DB sessions if available, otherwise fallback to weekly generation
  const generateAllSessionEvents = (): CalendarEvent[] => {
    if (!program) return [];
    
    // If we have real sessions from the database, use those
    if (dbSessions && dbSessions.length > 0) {
      return dbSessions.map(session => ({
        title: session.title,
        description: session.description || `Session ${session.session_number} of ${program.title}`,
        startDate: new Date(session.session_date),
        endDate: new Date(new Date(session.session_date).getTime() + (session.duration_minutes || 90) * 60000),
        location: session.meeting_link || round?.google_meet_link || undefined,
        reminderMinutes: 60,
      }));
    }
    
    // Fallback: generate weekly sessions from start to end date
    if (!round?.start_date) return [];
    
    const events: CalendarEvent[] = [];
    const startDate = new Date(round.start_date);
    const endDate = round.end_date ? new Date(round.end_date) : addWeeks(startDate, 8);
    const sessionDuration = round.first_session_duration || 90;
    
    let sessionNumber = 1;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      events.push({
        title: `${program.title} - Session ${sessionNumber}`,
        description: `Session ${sessionNumber} of ${program.title}`,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.getTime() + sessionDuration * 60000),
        location: round.google_meet_link || undefined,
        reminderMinutes: 60,
      });
      
      sessionNumber++;
      currentDate = addWeeks(currentDate, 1);
    }
    
    return events;
  };

  // Sync all sessions to calendar
  const handleSyncAllSessions = async () => {
    if (!round || !program) return;
    
    const events = generateAllSessionEvents();
    if (events.length === 0) {
      toast.error('No sessions to sync');
      return;
    }

    if (isNativeApp() && isCalendarAvailable()) {
      setIsSyncingAllSessions(true);
      try {
        const result = await addMultipleEventsToCalendar(events);
        
        if (result.success) {
          toast.success(`Added ${result.addedCount} sessions to your calendar!`);
          // Save sync timestamp
          const lastSyncKey = `lastCalendarSync_${round.id}`;
          localStorage.setItem(lastSyncKey, new Date().toISOString());
          setHasNewSessions(false);
        } else if (result.error === 'Calendar permission denied') {
          toast.error('Please allow calendar access in Settings');
        } else {
          toast.error(result.error || 'Failed to sync sessions');
        }
      } catch (error) {
        console.error('Error syncing sessions:', error);
        toast.error('Failed to sync sessions');
      } finally {
        setIsSyncingAllSessions(false);
      }
    } else {
      // Web fallback: Download ICS with all events
      const icsEvents = events.map(e => ({
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
      }));
      
      // For web, just download first session
      downloadICSFile(icsEvents[0], `${program.title.replace(/\s+/g, '-')}-sessions.ics`);
      toast.success('Calendar file downloaded!');
      // Save sync timestamp for web too
      const lastSyncKey = `lastCalendarSync_${round.id}`;
      localStorage.setItem(lastSyncKey, new Date().toISOString());
      setHasNewSessions(false);
    }
  };

  // Auto-sync calendar on enrollment if preference is enabled
  const autoSyncCalendarOnEnrollment = async () => {
    const autoSyncEnabled = localStorage.getItem('autoSyncCalendar') === 'true';
    if (!autoSyncEnabled || !isNativeApp() || !isCalendarAvailable()) return;
    
    const events = generateAllSessionEvents();
    if (events.length === 0) return;
    
    try {
      const result = await addMultipleEventsToCalendar(events);
      if (result.success) {
        toast.success(`${result.addedCount} sessions added to calendar!`);
      }
    } catch (error) {
      console.error('Auto-sync calendar error:', error);
    }
  };

  const handleContactSupport = () => {
    // Open the customizable support link from the round
    const supportUrl = (round as any)?.support_link_url || 'https://t.me/ladybosslook';
    window.open(supportUrl, '_blank');
  };

  // Add single session to calendar
  const handleAddSingleSession = async (session: typeof dbSessions extends (infer T)[] ? T : never) => {
    if (!program) return;
    
    setAddingSessionId(session.id);
    
    const event: CalendarEvent = {
      title: session.title,
      description: session.description || `Session ${session.session_number} of ${program.title}`,
      startDate: new Date(session.session_date),
      endDate: new Date(new Date(session.session_date).getTime() + (session.duration_minutes || 90) * 60000),
      location: session.meeting_link || round?.google_meet_link || undefined,
      reminderMinutes: 60,
    };

    if (isNativeApp() && isCalendarAvailable()) {
      try {
        const result = await addEventToCalendar(event);
        
        if (result.success) {
          toast.success('Session added to calendar!');
        } else if (result.error === 'Calendar permission denied') {
          toast.error('Please allow calendar access in Settings');
        } else {
          toast.error(result.error || 'Failed to add session');
        }
      } catch (error) {
        console.error('Error adding session:', error);
        toast.error('Failed to add to calendar');
      }
    } else {
      downloadICSFile({
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
      }, `${session.title.replace(/\s+/g, '-')}.ics`);
      toast.success('Calendar file downloaded!');
    }
    
    setAddingSessionId(null);
  };

  // Helper to determine if a session is in the past
  const isSessionPast = (sessionDate: string) => {
    return new Date(sessionDate) < new Date();
  };

  // Helper to determine if a session is today
  const isSessionToday = (sessionDate: string) => {
    const today = new Date();
    const session = new Date(sessionDate);
    return (
      session.getFullYear() === today.getFullYear() &&
      session.getMonth() === today.getMonth() &&
      session.getDate() === today.getDate()
    );
  };

  // Free enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !program) throw new Error('Missing required data');
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_name: program.title,
          program_slug: program.slug,
          status: 'active'
        });
      
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Enrolled successfully!');
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', slug] });
      
      // Auto-sync calendar if preference enabled
      await autoSyncCalendarOnEnrollment();
      
      // Show enrollment reminder popup if appropriate
      const shouldShow = await shouldShowEnrollmentReminder();
      if (shouldShow && isNativeApp()) {
        setTimeout(() => {
          setShowEnrollmentReminder(true);
        }, 1500); // Show after success toast
      }
    },
    onError: (error) => {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll. Please try again.');
    }
  });

  return (
    <>
      {/* Fixed Header with safe area */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-6 pb-3 px-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-lg truncate">{program?.title || 'Course Details'}</h1>
            {round && (
              <p className="text-xs text-muted-foreground truncate">
                {round.round_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Header spacer */}
      <div style={{ height: 'calc(76px + env(safe-area-inset-top, 0px))' }} />

      <div className="container max-w-4xl py-4 px-4">
        <SEOHead 
          title={`${program?.title || 'Course'} Details - LadyBoss Academy`}
          description="Course details and materials"
        />
        
        <div className="space-y-6">

        {enrollmentLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading course details...</p>
            </CardContent>
          </Card>
        ) : !enrollment ? (
          /* Purchase Landing Page */
          <div className="space-y-6">
            {/* Back to Store Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/browse')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse
            </Button>

            {/* Program Hero Image */}
            {program && programImages[program.slug] && (
              <Card className="overflow-hidden">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={programImages[program.slug]} 
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}

            {/* Purchase Card */}
            {program && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{program.title}</CardTitle>
                  {program.description && (
                    <div 
                      className="text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: program.description }}
                    />
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* What's Included */}
                  {program.features && Array.isArray(program.features) && program.features.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">What's Included</h3>
                      <div className="space-y-3">
                        {program.features.map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Free Enrollment */}
                  <div className="border-t pt-6">
                    {enrollment ? (
                      <Button 
                        size="lg" 
                        className="w-full" 
                        variant="secondary"
                        disabled
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Enrolled
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => enrollMutation.mutate()}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          'Enroll Free'
                        )}
                      </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Free enrollment • Instant access
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            {program && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{program.duration || 'Self-paced'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Format</p>
                      <p className="font-semibold capitalize">{program.delivery_method || 'Online'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <>
            {round?.video_url && (() => {
              let embedUrl = round.video_url;
              
              // Convert YouTube URLs to embed format
              if (embedUrl.includes('youtube.com/watch')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
              } else if (embedUrl.includes('youtu.be/')) {
                embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
              }
              
              // Convert Vimeo URLs to embed format
              if (embedUrl.includes('vimeo.com/') && !embedUrl.includes('/video/')) {
                embedUrl = embedUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
              }
              
              return (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video rounded-md overflow-hidden bg-muted">
                      <iframe
                        src={embedUrl}
                        title="Course video"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {round?.important_message && (
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm leading-relaxed whitespace-pre-wrap">
                  {round.important_message}
                </AlertDescription>
              </Alert>
            )}

            {/* New Sessions Available Banner */}
            {hasNewSessions && round && (
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
                <CalendarPlus className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span className="text-sm text-amber-800 dark:text-amber-200">
                    New sessions available! Sync to your calendar.
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="shrink-0 border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900"
                    onClick={handleSyncAllSessions}
                    disabled={isSyncingAllSessions}
                  >
                    {isSyncingAllSessions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4 mr-1" />
                        Sync
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Course Playlist Card */}
            {(program as any)?.audio_playlist_id && enrollment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Course Playlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Content for this course
                  </p>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/app/player/playlist/${(program as any).audio_playlist_id}`)}
                  >
                    <Music className="h-5 w-5 mr-2" />
                    Open Playlist
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions - Only show if enrollment has a round */}
            {round && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Add First Session to Calendar */}
                  {round.first_session_date && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full"
                      onClick={handleAddToCalendar}
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Add First Session
                    </Button>
                  )}

                  {/* Sync All Sessions to Calendar */}
                  {round.start_date && (
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="w-full"
                      onClick={handleSyncAllSessions}
                      disabled={isSyncingAllSessions}
                    >
                      {isSyncingAllSessions ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-5 w-5 mr-2" />
                          Sync All Sessions
                        </>
                      )}
                    </Button>
                  )}

                  {/* Contact Support - Customizable link */}
                  {(round as any).support_link_url && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90"
                      onClick={handleContactSupport}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {(round as any).support_link_label || 'Contact Support'}
                    </Button>
                  )}

                  {/* Join Google Meet - Web only */}
                  {!isNativeApp() && round.google_meet_link && (
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="w-full"
                      onClick={() => window.open(round.google_meet_link!, '_blank')}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Join Google Meet
                    </Button>
                  )}

                  {/* Access Google Drive - Web only */}
                  {!isNativeApp() && round.google_drive_link && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      onClick={() => window.open(round.google_drive_link!, '_blank')}
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Access Google Drive
                    </Button>
                  )}

                  {/* Round Audio Playlist */}
                  {round.audio_playlist_id && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full"
                      onClick={() => navigate(`/app/player/playlist/${round.audio_playlist_id}`)}
                    >
                      <Music className="h-5 w-5 mr-2" />
                      Round Playlist
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Sessions Card */}
            {dbSessions && dbSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Sessions
                    <Badge variant="secondary" className="ml-auto">
                      {dbSessions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dbSessions.map((session) => {
                      const sessionDate = new Date(session.session_date);
                      const isPast = isSessionPast(session.session_date);
                      const isToday = isSessionToday(session.session_date);
                      
                      return (
                        <div 
                          key={session.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isPast 
                              ? 'bg-muted/50 opacity-60' 
                              : isToday 
                                ? 'border-primary bg-primary/5' 
                                : 'bg-card'
                          }`}
                        >
                          {/* Date Column */}
                          <div className="flex flex-col items-center justify-center w-12 shrink-0">
                            <span className="text-xs text-muted-foreground uppercase">
                              {format(sessionDate, 'MMM')}
                            </span>
                            <span className="text-xl font-bold leading-none">
                              {format(sessionDate, 'd')}
                            </span>
                          </div>
                          
                          {/* Session Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {session.title}
                              </p>
                              {isToday && (
                                <Badge variant="default" className="shrink-0 text-xs">
                                  Today
                                </Badge>
                              )}
                              {isPast && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  Past
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(sessionDate, 'h:mm a')} • {session.duration_minutes || 90} min
                            </p>
                          </div>
                          
                          {/* Add to Calendar Button */}
                          {!isPast && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => handleAddSingleSession(session)}
                              disabled={addingSessionId === session.id}
                            >
                              {addingSessionId === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CalendarPlus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Information</CardTitle>
                  <Badge>{enrollment.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {program?.description && (
                  <div 
                    className="text-muted-foreground whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: program.description }}
                  />
                )}
                {round && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-semibold">{format(new Date(round.start_date), 'MMM d, yyyy')}</p>
                    </div>
                    {round.end_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-semibold">{format(new Date(round.end_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </div>

      {/* Enrollment Reminder Popup */}
      <AlertDialog open={showEnrollmentReminder} onOpenChange={setShowEnrollmentReminder}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Never Miss Your Classes!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              You just enrolled! Enable notifications so you never miss class reminders
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={async () => {
                if (!user?.id) return;
                setIsEnablingEnrollment(true);
                try {
                  const result = await subscribeToPushNotifications(user.id);
                  if (result.success) {
                    toast.success('Push notifications enabled!');
                    localStorage.setItem('hasSeenEnrollmentPrompt', 'true');
                    setShowEnrollmentReminder(false);
                  } else {
                    toast.error(result.error || 'Failed to enable notifications');
                  }
                } catch (error) {
                  console.error('Error:', error);
                  toast.error('An error occurred');
                } finally {
                  setIsEnablingEnrollment(false);
                }
              }}
              disabled={isEnablingEnrollment}
              className="w-full"
              size="lg"
            >
              {isEnablingEnrollment ? 'Enabling...' : 'Enable Now'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem('hasSeenEnrollmentPrompt', 'true');
                setShowEnrollmentReminder(false);
              }}
              disabled={isEnablingEnrollment}
              className="w-full"
            >
              Not Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppCourseDetail;
