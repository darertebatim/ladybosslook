import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function AddTestEnrollment() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addTestData = async () => {
    setIsLoading(true);
    try {
      const userId = 'b0825c52-c0dc-4037-bd9a-142f52dac7d5';
      const courseName = 'IQMoney Course - Income Growth';

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_name', courseName)
        .maybeSingle();

      if (!existingEnrollment) {
        // Create enrollment
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: userId,
            course_name: courseName,
            status: 'active'
          });

        if (enrollError) throw enrollError;
      }

      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('product_name', courseName)
        .maybeSingle();

      if (!existingOrder) {
        // Create test order
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            product_name: courseName,
            amount: 199700, // $1,997.00 in cents
            currency: 'usd',
            status: 'paid',
            email: 'razie8254@gmail.com',
            name: 'Razie Ladyboss',
            phone: '+14159179802',
            stripe_session_id: `test_iqmoney_${Date.now()}`
          });

        if (orderError) throw orderError;
      }

      toast({
        title: "Success!",
        description: "Test enrollment and order created for razie8254@gmail.com"
      });

      // Reload the page to show new data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={addTestData} 
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? 'Adding...' : 'Add Test IQMoney Enrollment'}
    </Button>
  );
}
