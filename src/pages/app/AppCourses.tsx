import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const AppCourses = () => {
  const { user } = useAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['course-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="My Courses - LadyBoss Academy"
        description="Your enrolled courses"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            {enrollments?.length || 0} active enrollments
          </p>
        </div>

        {enrollments?.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No courses enrolled yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrollments?.map((enrollment) => (
              <Link
                key={enrollment.id}
                to={`/app/course/${enrollment.program_slug || 'course'}`}
              >
                <Card className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{enrollment.course_name}</CardTitle>
                        <CardDescription className="mt-1">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppCourses;
