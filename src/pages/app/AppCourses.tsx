import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { isNativeApp } from '@/lib/platform';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';

const AppCourses = () => {
  const { user } = useAuth();
  
  // Get unseen content - wrap in try/catch in case provider is missing
  let unseenEnrollments = new Set<string>();
  let markEnrollmentViewed: ((id: string) => Promise<void>) | null = null;
  try {
    const unseenContent = useUnseenContentContext();
    unseenEnrollments = unseenContent.unseenEnrollments;
    markEnrollmentViewed = unseenContent.markEnrollmentViewed;
  } catch {
    // Provider not available, ignore
  }

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['course-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          program_rounds (
            round_name,
            round_number,
            start_date,
            status
          )
        `)
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <>
        <AppHeader title="My Courses" subtitle="Loading..." />
        <AppHeaderSpacer />
        <div className="container max-w-4xl py-4 px-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="My Courses - LadyBoss Academy"
        description="Your enrolled courses"
      />

      <AppHeader 
        title="My Courses" 
        subtitle={`${enrollments?.length || 0} active enrollments`}
      />
      <AppHeaderSpacer />
      
      <div className="container max-w-4xl py-4 px-4">
        <div className="space-y-4">
          {enrollments?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isNativeApp() 
                    ? 'No courses available'
                    : 'No courses enrolled yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrollments?.map((enrollment) => {
                const isUnseen = unseenEnrollments.has(enrollment.id);
                
                return (
                <Link
                  key={enrollment.id}
                  to={`/app/course/${enrollment.program_slug || 'course'}`}
                  onClick={() => {
                    // Mark as viewed when clicked
                    if (isUnseen && markEnrollmentViewed) {
                      markEnrollmentViewed(enrollment.id);
                    }
                  }}
                >
                  <Card className={`transition-colors active:scale-[0.98] ${isUnseen ? 'border-primary border-2' : 'border'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{enrollment.course_name}</CardTitle>
                            {isUnseen && (
                              <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 h-auto">
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                New
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-2 space-y-1">
                            {enrollment.program_rounds && (
                              <div className="flex items-center gap-1.5">
                                <BookOpen className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {enrollment.program_rounds.round_name}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {enrollment.program_rounds.status}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                          {enrollment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppCourses;