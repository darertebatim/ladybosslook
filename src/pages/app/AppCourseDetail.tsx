import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, FolderOpen, Calendar, ExternalLink, Info, MessageCircle, Music, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { downloadICSFile, generateICSFile } from '@/utils/calendar';
import { format } from 'date-fns';
import { toast } from "sonner";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isNativeApp } from '@/lib/platform';
import { programImages } from '@/data/programs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { shouldShowEnrollmentReminder } from '@/hooks/useNotificationReminder';
import { subscribeToPushNotifications, checkPermissionStatus } from '@/lib/pushNotifications';
import { useState as reactUseState, useEffect as reactUseEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bell } from 'lucide-react';

const AppCourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEnrollmentReminder, setShowEnrollmentReminder] = reactUseState(false);
  const [isEnablingEnrollment, setIsEnablingEnrollment] = reactUseState(false);

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

    // Native iOS: Use Share API to let user add to calendar
    if (isNativeApp()) {
      try {
        const icsContent = generateICSFile(event);
        const fileName = `${program.title.replace(/\s+/g, '-')}.ics`;
        
        // Write file to temporary directory
        const result = await Filesystem.writeFile({
          path: fileName,
          data: icsContent,
          directory: Directory.Cache,
        });

        // Share the file - iOS will show "Add to Calendar" option
        await Share.share({
          title: 'Add to Calendar',
          text: `${event.title}`,
          url: result.uri,
          dialogTitle: 'Add Event to Calendar'
        });
        
        toast.success('Select Calendar app to add event');
      } catch (error) {
        console.error('Error sharing calendar event:', error);
        toast.error('Failed to open calendar');
      }
    } else {
      // Web: Download ICS file
      downloadICSFile(event, `${program.title.replace(/\s+/g, '-')}.ics`);
      toast.success('Calendar event downloaded!');
    }
  };

  const handleContactSupport = () => {
    if (!profile || !program) return;

    const message = `Hi! I need support with my enrollment.\n\ni want activate my support\n\nName: ${profile.full_name || 'N/A'}\nEmail: ${profile.email}\nPhone: ${profile.phone || 'N/A'}\nCity: ${profile.city || 'N/A'}\nCourse: ${program.title}\nRound: ${round?.round_name || 'N/A'}`;
    
    const telegramUrl = `https://t.me/ladybosslook?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
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
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title={`${program?.title || 'Course'} Details - LadyBoss Academy`}
        description="Course details and materials"
      />
      
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{program?.title || 'Course Details'}</h1>
            {round && (
              <p className="text-sm text-muted-foreground">
                {round.round_name} • Round #{round.round_number}
              </p>
            )}
          </div>
        </div>

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
                  {/* Add to Calendar */}
                  {round.first_session_date && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full"
                      onClick={handleAddToCalendar}
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Add to Calendar
                    </Button>
                  )}

                  {/* Contact Telegram Support */}
                  {round.whatsapp_support_number && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90"
                      onClick={handleContactSupport}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact Telegram Support
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
    </div>
  );
};

export default AppCourseDetail;
