import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, ExternalLink } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { format } from 'date-fns';

const AppMyClass = () => {
  const { user } = useAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-active-classes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, program_rounds(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="My Classes - LadyBoss Academy"
        description="View your active classes"
      />
      
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">My Active Classes</h1>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">You're not enrolled in any active classes yet.</p>
            <Link 
              to="/app/courses" 
              className="inline-block mt-4 text-primary hover:underline"
            >
              Browse Available Courses
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <Link key={enrollment.id} to={`/app/course/${enrollment.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{enrollment.course_name}</CardTitle>
                      {enrollment.program_rounds && (
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {enrollment.program_rounds.round_name}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="default">
                      {enrollment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {enrollment.program_rounds && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-medium">
                          {format(new Date(enrollment.program_rounds.start_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {enrollment.program_rounds.end_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="font-medium">
                            {format(new Date(enrollment.program_rounds.end_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                      {enrollment.program_rounds.first_session_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">First Session:</span>
                          <span className="font-medium">
                            {format(new Date(enrollment.program_rounds.first_session_date), 'MMM dd, yyyy - HH:mm')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary font-medium">View Class Details</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppMyClass;
