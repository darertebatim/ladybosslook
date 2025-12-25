import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, Users, ExternalLink, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function ActiveRound() {
  const { user } = useAuth();

  const { data: activeEnrollments, isLoading } = useQuery({
    queryKey: ['active-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          program_rounds (
            *
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .not('program_rounds', 'is', null)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeEnrollments || activeEnrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Your Active Rounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No active rounds yet</p>
            <Link to="/app/courses">
              <Button className="mt-4" variant="outline">
                Browse Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Your Active Rounds
        </h2>
        <Badge variant="secondary">{activeEnrollments.length}</Badge>
      </div>

      <div className="flex flex-col gap-8">
        {activeEnrollments.map((enrollment) => {
          const round = enrollment.program_rounds;
          if (!round) return null;

          const isUpcoming = round.status === 'upcoming';
          const isActive = round.status === 'active';

          return (
            <Link key={enrollment.id} to={`/app/course/${enrollment.program_slug}`}>
              <Card className="border border-border shadow-sm active:scale-[0.98] transition-transform overflow-hidden">
                <CardContent className="p-4 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">{enrollment.course_name}</h3>
                        <Badge 
                          variant={isActive ? 'default' : 'secondary'}
                          className={isActive ? 'bg-green-500' : ''}
                        >
                          {round.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-medium">{round.round_name}</span>
                        </div>
                        
                        {round.first_session_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {isUpcoming ? 'Starts ' : 'Next session: '}
                              {format(new Date(round.first_session_date), 'MMM d, yyyy • h:mm a')}
                            </span>
                          </div>
                        )}
                        
                        {round.start_date && (
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

                  {round.video_url && (() => {
                    // Extract video ID for thumbnail - use hqdefault for better reliability
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
                              // Hide broken image, show fallback UI instead
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

                  {round.important_message && (
                    <div className="mt-3 p-2 bg-primary/5 rounded-md border border-primary/20">
                      <p className="text-xs text-foreground line-clamp-2">
                        {round.important_message}
                      </p>
                    </div>
                  )}
                </CardContent>
                
                {/* Clear CTA footer to indicate tappability */}
                <div className="mt-3 bg-foreground px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-background">View Schedule & Materials</span>
                  <ArrowRight className="h-4 w-4 text-background" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
