import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone } from 'lucide-react';
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
  const [badge, setBadge] = useState('General');
  const [type, setType] = useState('general');
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
    let announcementData: any = null;
    
    try {
      // Step 1: Create announcement
      console.log('📝 Creating announcement...');
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          message: message.trim(),
          target_course: targetCourse === 'all' ? null : targetCourse,
          target_round_id: targetRoundId === 'all' ? null : targetRoundId,
          badge: badge,
          type: type,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Announcement creation failed:', error);
        throw error;
      }
      
      announcementData = data;
      console.log('✅ Announcement created:', announcementData.id);

      // Step 2: Send email notifications
      const emailPayload = {
        announcementId: announcementData.id,
        title: title.trim(),
        message: message.trim(),
        targetCourse: targetCourse === 'all' ? undefined : targetCourse,
        badge: badge,
      };
      
      console.log('📧 Invoking send-announcement-email function with:', emailPayload);
      console.log('⏰ Starting email send at:', new Date().toISOString());
      
      // Set a timeout for the function call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email function timeout after 30 seconds')), 30000)
      );
      
      const emailPromise = supabase.functions.invoke('send-announcement-email', {
        body: emailPayload
      });
      
      const { data: emailData, error: emailError } = await Promise.race([
        emailPromise,
        timeoutPromise
      ]) as any;

      console.log('📬 Email function completed at:', new Date().toISOString());
      console.log('📊 Email function response:', { 
        data: emailData, 
        error: emailError,
        hasData: !!emailData,
        hasError: !!emailError
      });

      if (emailError) {
        console.error('❌ Email notification error:', {
          message: emailError.message,
          status: emailError.status,
          statusText: emailError.statusText,
          full: emailError
        });
        
        toast({
          title: "⚠️ Partial Success",
          description: `Announcement created but emails failed to send: ${emailError.message}. Check logs for details.`,
          variant: "default",
        });
      } else {
        const emailCount = emailData?.stats?.successful || 0;
        const failedCount = emailData?.stats?.failed || 0;
        
        console.log(`✅ Emails sent: ${emailCount} successful, ${failedCount} failed`);
        
        toast({
          title: "🎉 Success!",
          description: `Announcement sent! Emails delivered: ${emailCount}${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
      }

      // Reset form on success
      setTitle('');
      setMessage('');
      setTargetCourse('all');
      setTargetRoundId('all');
      setBadge('General');
      setType('general');
      
    } catch (error: any) {
      console.error('❌ Error in announcement flow:', {
        message: error.message,
        stack: error.stack,
        full: error
      });
      
      toast({
        title: "Error",
        description: `Failed: ${error.message}. ${announcementData ? 'Announcement was created but emails may not have sent.' : 'Announcement was not created.'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Announcement flow completed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Send Announcement
        </CardTitle>
        <CardDescription>Create announcements for students based on their enrolled courses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            placeholder="Announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="Your announcement message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Course</label>
            <Select value={targetCourse} onValueChange={setTargetCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.slug}>
                    {program.title} • {program.type === 'course' ? '📚' : program.type === 'group-coaching' ? '👥' : program.type === '1o1-session' ? '💼' : program.type === 'webinar' ? '🎥' : '🎉'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetCourse !== "all" && rounds && rounds.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="targetRound">Target Round</Label>
              <Select value={targetRoundId} onValueChange={setTargetRoundId}>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Badge</label>
            <Input
              placeholder="Badge text..."
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="new">New Course</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          <Megaphone className="mr-2 h-4 w-4" />
          {loading ? 'Sending...' : 'Send Announcement'}
        </Button>
      </CardContent>
    </Card>
  );
}