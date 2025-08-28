import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TestEmailSender = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-intro-email', {
        body: {
          email: 'darertebatim@gmail.com'
        }
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: "Introduction email sent to darertebatim@gmail.com",
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4">
      <Button 
        onClick={sendTestEmail} 
        disabled={sending}
        className="bg-primary hover:bg-primary-dark"
      >
        {sending ? 'Sending...' : 'Send Test Email to darertebatim@gmail.com'}
      </Button>
    </div>
  );
};

// Auto-execute the test email on component mount
export const AutoSendTestEmail = () => {
  useEffect(() => {
    const sendTest = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('send-intro-email', {
          body: {
            email: 'darertebatim@gmail.com'
          }
        });
        console.log('Auto test email result:', { data, error });
      } catch (error) {
        console.error('Auto test email error:', error);
      }
    };
    
    // Execute immediately
    sendTest();
  }, []);

  return null;
};