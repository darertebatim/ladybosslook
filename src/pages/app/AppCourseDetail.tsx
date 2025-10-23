import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const AppCourseDetail = () => {
  const { slug } = useParams();

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="Course Details - LadyBoss Academy"
        description="Course details and materials"
      />
      
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Course Details</h1>
            <p className="text-sm text-muted-foreground">Program: {slug}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Course Content</CardTitle>
              <Badge>Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Course materials and content will be displayed here. 
              This section can be expanded with videos, documents, assignments, and progress tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppCourseDetail;
