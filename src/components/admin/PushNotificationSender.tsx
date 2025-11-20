import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Beaker, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Program {
  id: string;
  title: string;
  type: string;
  slug: string;
}

interface NotificationFormProps {
  environment: 'development' | 'production';
}

function NotificationForm({ environment }: NotificationFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/app/home');
  const [targetType, setTargetType] = useState<'all' | 'course' | 'user'>('all');
  const [targetCourse, setTargetCourse] = useState('');
  const [targetRoundId, setTargetRoundId] = useState('all-rounds');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const { toast } = useToast();
  
  // Character limits
  const TITLE_LIMIT = 50;
  const MESSAGE_LIMIT = 200;

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
        .select('id, title, type, slug')
        .eq('is_active', true)
        .order('title');

      if (!error && data) {
        setPrograms(data);
      }
    };

    fetchPrograms();
  }, []);

  // Reset round when target type changes
  useEffect(() => {
    if (targetType === 'all') {
      setTargetRoundId('all-rounds');
    }
  }, [targetType]);

  // Reset round when course changes
  useEffect(() => {
    setTargetRoundId('all-rounds');
  }, [targetCourse]);

  const handleSend = async () => {
    if (!title || !message) {
      toast({
        title: 'Validation error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'course' && !targetCourse) {
      toast({
        title: 'Validation error',
        description: 'Course selection is required',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'user') {
      const trimmedEmail = targetUserEmail.trim();
      
      if (!trimmedEmail) {
        toast({
          title: 'Validation error',
          description: 'User email is required',
          variant: 'destructive',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        toast({
          title: 'Validation error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload: any = {
        title,
        body: message,
        url: destinationUrl,
        environment, // Pass environment to edge function
      };

      if (targetType === 'course') {
        payload.targetCourse = targetCourse;
        if (targetRoundId && targetRoundId !== 'all-rounds') {
          payload.targetRoundId = targetRoundId;
        }
      } else if (targetType === 'user') {
        payload.targetUserEmail = targetUserEmail.trim();
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: payload,
      });

      if (error) throw error;

      const envLabel = environment === 'development' ? 'Test' : 'Production';
      toast({
        title: `${envLabel} notification sent!`,
        description: `Sent to ${data.sent} device(s), failed: ${data.failed}`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setDestinationUrl('/app/home');
      setTargetType('all');
      setTargetCourse('');
      setTargetRoundId('all-rounds');
      setTargetUserEmail('');
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send push notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDevelopment = environment === 'development';

  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div>
        <Label htmlFor={`title-${environment}`}>Title</Label>
        <Input
          id={`title-${environment}`}
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
          placeholder="Notification title"
          maxLength={TITLE_LIMIT}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {title.length}/{TITLE_LIMIT} characters
        </p>
      </div>

      {/* Message Textarea */}
      <div>
        <Label htmlFor={`message-${environment}`}>Message</Label>
        <Textarea
          id={`message-${environment}`}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
          placeholder="Notification message"
          maxLength={MESSAGE_LIMIT}
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {message.length}/{MESSAGE_LIMIT} characters
        </p>
      </div>

      {/* Destination URL */}
      <div>
        <Label htmlFor={`url-${environment}`}>Destination URL (optional)</Label>
        <Input
          id={`url-${environment}`}
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="/app/home"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Where users go when they tap the notification
        </p>
      </div>

      {/* Target Audience Selection */}
      <div>
        <Label htmlFor={`target-${environment}`}>Target Audience</Label>
        <Select value={targetType} onValueChange={(value: any) => setTargetType(value)}>
          <SelectTrigger id={`target-${environment}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="course">Course Enrollees</SelectItem>
            <SelectItem value="user">Specific User (by email)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Selection */}
      {targetType === 'course' && (
        <>
          <div>
            <Label htmlFor={`course-${environment}`}>Course</Label>
            <Select value={targetCourse} onValueChange={setTargetCourse}>
              <SelectTrigger id={`course-${environment}`}>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.slug}>
                    {program.title} ({program.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Round Selection */}
          {targetCourse && rounds && rounds.length > 0 && (
            <div>
              <Label htmlFor={`round-${environment}`}>Round (optional)</Label>
              <Select value={targetRoundId} onValueChange={setTargetRoundId}>
                <SelectTrigger id={`round-${environment}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-rounds">All Rounds</SelectItem>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      Round #{round.round_number}: {round.round_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {/* User Email Input */}
      {targetType === 'user' && (
        <div>
          <Label htmlFor={`email-${environment}`}>User Email</Label>
          <Input
            id={`email-${environment}`}
            type="email"
            value={targetUserEmail}
            onChange={(e) => setTargetUserEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
      )}

      {/* Preview */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary p-2">
            <Bell className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              {title || 'Notification Title'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {message || 'Notification message will appear here'}
            </p>
            {destinationUrl && (
              <p className="text-xs text-muted-foreground mt-2">
                → {destinationUrl}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Send Button */}
      <Button 
        onClick={handleSend} 
        disabled={isLoading || !title || !message}
        className="w-full"
        variant={isDevelopment ? "outline" : "default"}
      >
        <Send className="mr-2 h-4 w-4" />
        {isLoading 
          ? 'Sending...' 
          : isDevelopment 
            ? 'Send Test Notification' 
            : 'Send Production Notification'
        }
      </Button>
    </div>
  );
}

export function PushNotificationSender() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Test/Development Card */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-amber-500" />
            <CardTitle>Test Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Send test notifications to development/sandbox APNs environment.
            Use this for testing with Xcode builds and TestFlight.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm environment="development" />
        </CardContent>
      </Card>

      {/* Production Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <CardTitle>Production Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Send notifications to real users on production APNs environment.
            Use this only for App Store builds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm environment="production" />
        </CardContent>
      </Card>
    </div>
  );
}
