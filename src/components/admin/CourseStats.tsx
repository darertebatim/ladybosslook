import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseEnrollment {
  course_name: string;
  count: number;
}

export function CourseStats() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('course_name');

      if (error) throw error;

      // Count enrollments per course
      const courseCounts = data?.reduce((acc: Record<string, number>, curr) => {
        acc[curr.course_name] = (acc[curr.course_name] || 0) + 1;
        return acc;
      }, {});

      const enrollmentArray = Object.entries(courseCounts || {}).map(([course_name, count]) => ({
        course_name,
        count: count as number
      }));

      setEnrollments(enrollmentArray);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "Error",
        description: "Failed to load course statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Course Enrollments
          </CardTitle>
          <CardDescription>Loading course statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Course Enrollments
        </CardTitle>
        <CardDescription>Students enrolled in each course</CardDescription>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No enrollments yet</p>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.course_name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{enrollment.course_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold">{enrollment.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}