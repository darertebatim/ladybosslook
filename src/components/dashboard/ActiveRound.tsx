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

      <div className="space-y-3">
        {activeEnrollments.map((enrollment) => {
          const round = enrollment.program_rounds;
          if (!round) return null;

          const isUpcoming = round.status === 'upcoming';
          const isActive = round.status === 'active';

          return (
            <Link key={enrollment.id} to={`/app/course/${enrollment.program_slug}`}>
              <Card className="hover:border-primary transition-all hover:shadow-md">
                <CardContent className="p-4">
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
                    
                    <Button size="icon" variant="ghost" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {round.video_url && (() => {
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
                      <div className="mt-3 aspect-video rounded-md overflow-hidden bg-muted">
                        <iframe
                          src={embedUrl}
                          title="Round video"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
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
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
