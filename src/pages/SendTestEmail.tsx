import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function SendTestEmail() {
  const [status, setStatus] = useState('Sending email...');
  const [details, setDetails] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const sendEmail = async () => {
      try {
        console.log('Sending announcement email...');
        
        const { data, error } = await supabase.functions.invoke('send-announcement-email', {
          body: {
            announcementId: '7c8c2cf5-3de1-4726-9b19-246ccec8e6bf',
            title: 'Heeeyyyyy ladyboss',
            message: 'have you get this msg? come to your app',
            targetCourse: 'IQMoney Course - Income Growth',
            badge: 'urgent',
          }
        });

        console.log('Email send result:', { data, error });

        if (error) {
          setStatus('Error sending email');
          setDetails(JSON.stringify(error, null, 2));
        } else {
          setStatus('Email sent successfully! ✓');
          setDetails(JSON.stringify(data, null, 2));
          
          // Redirect back after 3 seconds
          setTimeout(() => {
            navigate('/admin');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('Exception occurred');
        setDetails(err.message);
        console.error('Error:', err);
      }
    };

    sendEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Sending Announcement Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">{status}</p>
          {details && (
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {details}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
