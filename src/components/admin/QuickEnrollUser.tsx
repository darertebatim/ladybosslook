import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePrograms } from '@/hooks/usePrograms';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, addYears } from 'date-fns';

export const QuickEnrollUser = () => {
  const { toast } = useToast();
  const { programs, isLoading: programsLoading } = usePrograms();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

  // Fetch available rounds for selected course
  const { data: rounds } = useQuery({
    queryKey: ['course-rounds', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      
      const selectedProgram = programs.find(p => p.title === selectedCourse);
      if (!selectedProgram) return [];

      const { data, error } = await supabase
        .from('program_rounds')
        .select('*')
        .eq('program_slug', selectedProgram.slug)
        .in('status', ['upcoming', 'active'])
        .order('round_number', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourse && programs.length > 0,
  });

  const handleEnroll = async () => {
    if (!email) {
      toast({
        title: 'Missing Information',
        description: 'Please provide an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedProgram = programs.find(p => p.title === selectedCourse);
      
      const { data, error } = await supabase.functions.invoke('admin-create-enrollment', {
        body: {
          email: email.trim(),
          courseName: selectedCourse,
          programSlug: selectedProgram?.slug,
          roundId: selectedRound || null,
          fullName: fullName.trim() || null,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
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
      setExpiresAt(undefined);
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
          <Select 
            value={selectedCourse} 
            onValueChange={setSelectedCourse} 
            disabled={isLoading || programsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={programsLoading ? "Loading programs..." : "Select a course"} />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.slug} value={program.title}>
                  {program.title}
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

        <div className="space-y-2">
          <Label>Expiration Date</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant={!expiresAt ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExpiresAt(undefined)}
            >
              Default (1yr)
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setExpiresAt(addDays(new Date(), 30))}>
              30 days
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setExpiresAt(addMonths(new Date(), 3))}>
              3 months
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setExpiresAt(addMonths(new Date(), 6))}>
              6 months
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setExpiresAt(addYears(new Date(), 100))}>
              Lifetime
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !expiresAt && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiresAt ? format(expiresAt, 'PPP') : 'Or pick a custom date...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAt}
                onSelect={setExpiresAt}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            {expiresAt
              ? expiresAt.getFullYear() > 2090
                ? 'Lifetime access (never expires)'
                : `Expires: ${format(expiresAt, 'PPP')}`
              : 'Default: 1 year (subscription programs)'}
          </p>
        </div>

        <Button
          onClick={handleEnroll} 
          disabled={isLoading || !email || !selectedCourse}
          className="w-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? 'Creating...' : 'Create Account & Enroll'}
        </Button>

        <p className="text-xs text-muted-foreground">
          * User can log in immediately with email as both username and password
        </p>
      </CardContent>
    </Card>
  );
};
