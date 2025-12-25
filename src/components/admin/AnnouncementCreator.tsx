import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Bell, Mail, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface Program {
  id: string;
  title: string;
  type: string;
  slug: string;
}

export function AnnouncementCreator() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetCourse, setTargetCourse] = useState<string>('all');
  const [targetRoundId, setTargetRoundId] = useState<string>('all');
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const { toast } = useToast();

  // Fetch rounds for the selected course
  const { data: rounds } = useQuery({
    queryKey: ["program-rounds", targetCourse],
    queryFn: async () => {
      if (targetCourse === "all") return [];
      
      const { data, error } = await supabase
        .from("program_rounds")
        .select("*")
        .eq("program_slug", targetCourse)
        .order("round_number", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: targetCourse !== "all",
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

  // Reset round when course changes
  useEffect(() => {
    setTargetRoundId('all');
  }, [targetCourse]);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('📢 Sending broadcast message...');
      
      // Determine target type
      let targetType: 'all' | 'course' | 'round' = 'all';
      if (targetRoundId !== 'all' && targetRoundId) {
        targetType = 'round';
      } else if (targetCourse !== 'all') {
        targetType = 'course';
      }

      // Call the broadcast edge function
      const { data, error } = await supabase.functions.invoke('send-broadcast-message', {
        body: {
          title: title.trim(),
          content: message.trim(),
          targetType,
          targetCourse: targetCourse !== 'all' ? targetCourse : undefined,
          targetRoundId: targetRoundId !== 'all' ? targetRoundId : undefined,
          sendPush,
          sendEmail,
        }
      });

      if (error) {
        console.error('❌ Broadcast error:', error);
        throw error;
      }

      console.log('✅ Broadcast sent:', data);

      const { messagesSent, pushSent, targetUsers } = data;
      
      toast({
        title: "🎉 Broadcast Sent!",
        description: `Message delivered to ${messagesSent} users${sendPush ? `, ${pushSent} push notifications sent` : ''}`
      });

      // Reset form
      setTitle('');
      setMessage('');
      setTargetCourse('all');
      setTargetRoundId('all');
      setSendPush(true);
      setSendEmail(false);
      
    } catch (error: any) {
      console.error('❌ Error sending broadcast:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send broadcast",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Send Broadcast Message
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Broadcasts appear in each user's chat. They can reply directly to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            placeholder="Announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Your message to all users..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select value={targetCourse} onValueChange={setTargetCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.slug}>
                    {program.title} • {program.type === 'course' ? '📚' : program.type === 'group-coaching' ? '👥' : program.type === '1o1-session' ? '💼' : program.type === 'webinar' ? '🎥' : program.type === 'audiobook' ? '🎧' : '🎉'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetCourse !== "all" && rounds && rounds.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="targetRound">Target Round</Label>
              <Select 
                value={targetRoundId} 
                onValueChange={setTargetRoundId}
                key={targetCourse}
              >
                <SelectTrigger id="targetRound">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.round_name} (Round #{round.round_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Notification Options */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <Label className="text-sm font-medium">Notification Options</Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push Notification</p>
                <p className="text-xs text-muted-foreground">Send iOS push notification</p>
              </div>
            </div>
            <Switch checked={sendPush} onCheckedChange={setSendPush} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Notification</p>
                <p className="text-xs text-muted-foreground">Also send via email (coming soon)</p>
              </div>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} disabled />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          <Megaphone className="mr-2 h-4 w-4" />
          {loading ? 'Sending...' : 'Send Broadcast to Chat'}
        </Button>
      </CardContent>
    </Card>
  );
}
