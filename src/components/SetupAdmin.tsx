import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';

export default function SetupAdmin() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const setupAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-admin');

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message + ` - Email: ${data.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Setup Admin Account
        </CardTitle>
        <CardDescription>
          Create or update the admin account: darertebatim@gmail.com
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={setupAdmin} disabled={loading}>
          {loading ? 'Setting up...' : 'Setup Admin Account'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Email: darertebatim@gmail.com | Password: (same as email)
        </p>
      </CardContent>
    </Card>
  );
}
