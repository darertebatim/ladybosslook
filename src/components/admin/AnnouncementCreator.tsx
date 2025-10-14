import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AnnouncementCreator() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetCourse, setTargetCourse] = useState<string>('all');
  const [badge, setBadge] = useState('General');
  const [type, setType] = useState('general');
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('course_name');

      if (error) throw error;

      const uniqueCourses = [...new Set(data?.map(e => e.course_name) || [])];
      setCourses(uniqueCourses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  };

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
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          message: message.trim(),
          target_course: targetCourse === 'all' ? null : targetCourse,
          badge: badge,
          type: type,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Announcement sent to ${targetCourse === 'all' ? 'all students' : targetCourse}`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setTargetCourse('all');
      setBadge('General');
      setType('general');
    } catch (error: any) {
      console.error('Error creating announcement:', error);
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
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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