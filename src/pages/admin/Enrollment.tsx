import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuickEnrollUser } from '@/components/admin/QuickEnrollUser';
import { UserCreditsManager } from '@/components/admin/UserCreditsManager';
import { CourseEnrollmentManager } from '@/components/admin/CourseEnrollmentManager';
import { BulkEnrollCourageousCourse } from '@/components/admin/BulkEnrollCourageousCourse';

export default function Enrollment() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enrollment Management</h2>
        <p className="text-muted-foreground">Manage course enrollments and user credits</p>
      </div>

      <QuickEnrollUser />
      <BulkEnrollCourageousCourse />
      <CourseEnrollmentManager />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Refund Processing
          </CardTitle>
          <CardDescription>
            Check for refunded orders and remove enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              try {
                setIsLoading(true);
                toast({
                  title: "Checking Refunds...",
                  description: "Checking Stripe for refunded orders"
                });

                const { data, error } = await supabase.functions.invoke('handle-refunds');

                if (error) throw error;

                toast({
                  title: "Refunds Processed",
                  description: `Found ${data.refundedCount} refunded orders and removed them from enrollments`,
                });
              } catch (error: any) {
                console.error('Refund check error:', error);
                toast({
                  title: "Error",
                  description: error.message || 'Failed to check refunds',
                  variant: "destructive"
                });
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Check Refunds
          </Button>
        </CardContent>
      </Card>

      <UserCreditsManager />
    </div>
  );
}
