import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, FolderOpen, Calendar, ExternalLink, Info, MessageCircle, Music } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { downloadICSFile } from '@/utils/calendar';
import { format } from 'date-fns';
import { toast } from "sonner";
import { Alert, AlertDescription } from '@/components/ui/alert';

const AppCourseDetail = () => {
  const { slug } = useParams();

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
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const round = enrollment?.program_rounds;

  const handleAddToCalendar = () => {
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

    downloadICSFile(event, `${program.title.replace(/\s+/g, '-')}.ics`);
    toast.success('Calendar event downloaded!');
  };

  const handleContactSupport = () => {
    if (!round?.whatsapp_support_number || !profile || !program) return;

    const message = `Hi! I need support with my enrollment.\n\nName: ${profile.full_name || 'N/A'}\nEmail: ${profile.email}\nPhone: ${profile.phone || 'N/A'}\nCity: ${profile.city || 'N/A'}\nCourse: ${program.title}\nRound: ${round.round_name}`;
    
    const whatsappNumber = round.whatsapp_support_number.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.location.href = whatsappUrl;
  };

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
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                You are not enrolled in this course.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {round?.important_message && (
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm leading-relaxed whitespace-pre-wrap">
                  {round.important_message}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add to Calendar - First Priority */}
                {round?.first_session_date ? (
                  <Button
                    className="w-full justify-start"
                    size="lg"
                    onClick={handleAddToCalendar}
                  >
                    <Calendar className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Add to Calendar</div>
                      <div className="text-xs opacity-90">
                        {format(new Date(round.first_session_date), 'EEEE, MMMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                  </Button>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Session schedule will be announced soon</p>
                  </div>
                )}

                {/* Access Course Files */}
                {round?.google_drive_link ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                    onClick={() => window.location.href = round.google_drive_link!}
                  >
                    <FolderOpen className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Access Course Files</div>
                      <div className="text-xs opacity-70">Materials, slides, and resources</div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-2 opacity-70" />
                  </Button>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Course materials will be shared soon</p>
                  </div>
                )}

                {/* Join Live Session */}
                {round?.google_meet_link ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                    onClick={() => window.location.href = round.google_meet_link!}
                  >
                    <Video className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Join Live Session</div>
                      <div className="text-xs opacity-70">Google Meet link</div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-2 opacity-70" />
                  </Button>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Live session link will be shared soon</p>
                  </div>
                )}

                {/* Audio Library */}
                {round?.audio_playlist_id ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                    onClick={() => window.location.href = `/app/playlist/${round.audio_playlist_id}`}
                  >
                    <Music className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Audio Library</div>
                      <div className="text-xs opacity-70">Course supplement audios</div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-2 opacity-70" />
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {/* Support Section - Separate Card */}
            {round?.whatsapp_support_number && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <MessageCircle className="h-5 w-5" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    onClick={handleContactSupport}
                  >
                    <MessageCircle className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Contact Support via WhatsApp</div>
                      <div className="text-xs opacity-90">We're here to help you</div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
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
                  <p className="text-muted-foreground">{program.description}</p>
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
  );
};

export default AppCourseDetail;
