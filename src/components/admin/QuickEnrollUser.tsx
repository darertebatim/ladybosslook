import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const COURSE_OPTIONS = [
  { value: 'Courageous Character Course', label: 'Courageous Character Course', slug: 'courageous-character-course' },
  { value: 'IQMoney Course - Income Growth', label: 'IQMoney Course', slug: 'iqmoney-income-growth' },
  { value: 'Money Literacy Course', label: 'Money Literacy Course', slug: 'money-literacy-course' },
  { value: 'Connection Literacy Course', label: 'Connection Literacy Course', slug: 'connection-literacy-course' },
  { value: 'Ladyboss VIP Club Group Coaching', label: 'Ladyboss VIP Club', slug: 'ladyboss-vip-club' },
  { value: 'Empowered Ladyboss Group Coaching', label: 'Empowered Ladyboss', slug: 'empowered-ladyboss-coaching' },
];

export const QuickEnrollUser = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available rounds for selected course
  const { data: rounds } = useQuery({
    queryKey: ['course-rounds', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      
      const courseSlug = COURSE_OPTIONS.find(c => c.value === selectedCourse)?.slug;
      if (!courseSlug) return [];

      const { data, error } = await supabase
        .from('program_rounds')
        .select('*')
        .eq('program_slug', courseSlug)
        .in('status', ['upcoming', 'active'])
        .order('round_number', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourse,
  });

  const handleEnroll = async () => {
    if (!email || !selectedCourse) {
      toast({
        title: 'Missing Information',
        description: 'Please provide email and select a course',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const courseSlug = COURSE_OPTIONS.find(c => c.value === selectedCourse)?.slug;
      
      const { data, error } = await supabase.functions.invoke('admin-create-enrollment', {
        body: {
          email: email.trim(),
          courseName: selectedCourse,
          programSlug: courseSlug,
          roundId: selectedRound || null,
          fullName: fullName.trim() || null,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: data.message || 'User enrolled successfully',
      });

      // Reset form
      setEmail('');
      setFullName('');
      setSelectedCourse('');
      setSelectedRound('');
    } catch (error: any) {
      console.error('Error enrolling user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll user',
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
          <UserPlus className="h-5 w-5" />
          Quick Enroll User
        </CardTitle>
        <CardDescription>
          Create account and enroll user in a course instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name (Optional)</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course">Course *</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_OPTIONS.map((course) => (
                <SelectItem key={course.value} value={course.value}>
                  {course.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourse && rounds && rounds.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="round">Round (Optional)</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a round (optional)" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.round_name} - {round.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button 
          onClick={handleEnroll} 
          disabled={isLoading || !email || !selectedCourse}
          className="w-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? 'Creating...' : 'Create Account & Enroll'}
        </Button>

        <p className="text-xs text-muted-foreground">
          * A password reset email will be sent automatically
        </p>
      </CardContent>
    </Card>
  );
};
