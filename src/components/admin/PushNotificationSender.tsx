import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Program {
  id: string;
  title: string;
  type: string;
}

export function PushNotificationSender() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/app/home');
  const [targetType, setTargetType] = useState<'all' | 'course'>('all');
  const [targetCourse, setTargetCourse] = useState('');
  const [targetRoundId, setTargetRoundId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const { toast } = useToast();

  // Fetch rounds for the selected course
  const { data: rounds } = useQuery({
    queryKey: ["program-rounds", targetCourse],
    queryFn: async () => {
      if (!targetCourse) return [];
      
      const { data, error } = await supabase
        .from("program_rounds")
        .select("*")
        .eq("program_slug", targetCourse)
        .order("round_number", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!targetCourse,
  });

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('id, title, type')
        .eq('is_active', true)
        .order('title');

      if (!error && data) {
        setPrograms(data);
      }
    };

    fetchPrograms();
  }, []);

  const handleSend = async () => {
    if (!title || !message) {
      toast({
        title: 'Validation error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        title,
        body: message,
        icon: '/pwa-192x192.png',
        url: destinationUrl,
      };

      if (targetType === 'course' && targetCourse) {
        payload.targetCourse = targetCourse;
        if (targetRoundId) {
          payload.targetRoundId = targetRoundId;
        }
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: 'Notifications sent',
        description: `Successfully sent to ${data.sent} users. ${data.failed} failed.`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setDestinationUrl('/app/home');
      setTargetType('all');
      setTargetCourse('');
      setTargetRoundId('');
    } catch (error: any) {
      console.error('Error sending push notifications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send push notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Push Notification
        </CardTitle>
        <CardDescription>
          Send push notifications to students' mobile devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notification-title">Title</Label>
          <Input
            id="notification-title"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{title.length}/50 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification-message">Message</Label>
          <Textarea
            id="notification-message"
            placeholder="Notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{message.length}/200 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination-url">Destination (app page)</Label>
          <Select value={destinationUrl} onValueChange={setDestinationUrl}>
            <SelectTrigger id="destination-url">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/app/home">Home</SelectItem>
              <SelectItem value="/app/courses">Courses</SelectItem>
              <SelectItem value="/app/notifications">Notifications</SelectItem>
              <SelectItem value="/app/profile">Profile</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Page to open when user clicks the notification
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-type">Target Audience</Label>
          <Select value={targetType} onValueChange={(value: any) => setTargetType(value)}>
            <SelectTrigger id="target-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="course">Specific Course</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetType === 'course' && (
          <div className="space-y-2">
            <Label htmlFor="target-course">Select Program</Label>
            <Select value={targetCourse} onValueChange={setTargetCourse}>
              <SelectTrigger id="target-course">
                <SelectValue placeholder="Choose a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.title}>
                    {program.title} • {program.type === 'course' ? '📚' : program.type === 'group-coaching' ? '👥' : program.type === '1o1-session' ? '💼' : program.type === 'webinar' ? '🎥' : '🎉'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {targetCourse && rounds && rounds.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="targetRound">Target Round (Optional)</Label>
            <Select value={targetRoundId} onValueChange={setTargetRoundId}>
              <SelectTrigger id="targetRound">
                <SelectValue placeholder="All rounds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Rounds</SelectItem>
                {rounds.map((round: any) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.round_name} (Round #{round.round_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="space-y-1">
            <p className="font-semibold text-sm">{title || 'Notification title'}</p>
            <p className="text-sm text-muted-foreground">{message || 'Notification message'}</p>
          </div>
        </div>

        <Button onClick={handleSend} disabled={isLoading || !title || !message} className="w-full">
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? 'Sending...' : 'Send Push Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}
