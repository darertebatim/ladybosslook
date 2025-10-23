import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Users, Edit } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

interface ProgramRound {
  id: string;
  round_name: string;
  program_slug: string;
  status: string;
}

interface Enrollment {
  id: string;
  course_name: string;
  status: string;
  enrolled_at: string;
  round_id: string | null;
  program_slug: string | null;
  program_rounds: {
    round_name: string;
    status: string;
  } | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export function CourseEnrollmentManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [availableRounds, setAvailableRounds] = useState<ProgramRound[]>([]);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string>('');
  const [editRoundId, setEditRoundId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { programs } = usePrograms();

  useEffect(() => {
    loadUsers();
    loadEnrollments();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const program = programs.find(p => p.title === selectedCourse);
      if (program?.slug) {
        loadRoundsForCourse(program.slug);
      }
    } else {
      setAvailableRounds([]);
      setSelectedRoundId('');
    }
  }, [selectedCourse, programs]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  const loadEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id, 
          course_name, 
          status, 
          enrolled_at, 
          user_id,
          round_id,
          program_slug,
          program_rounds (
            round_name,
            status
          )
        `)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      // Get profile data separately
      const userIds = (data || []).map(e => e.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Combine the data
      const enrichedData = (data || []).map(enrollment => {
        const profile = profiles?.find(p => p.id === enrollment.user_id);
        return {
          ...enrollment,
          profiles: {
            email: profile?.email || 'Unknown',
            full_name: profile?.full_name || null
          }
        };
      });

      setEnrollments(enrichedData);
    } catch (error: any) {
      console.error('Error loading enrollments:', error);
      toast({
        title: "Error",
        description: "Failed to load enrollments",
        variant: "destructive"
      });
    }
  };

  const loadRoundsForCourse = async (courseSlug: string) => {
    if (!courseSlug) {
      setAvailableRounds([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, program_slug, status')
        .eq('program_slug', courseSlug)
        .order('round_number', { ascending: false });

      if (error) throw error;
      setAvailableRounds(data || []);
    } catch (error: any) {
      console.error('Error loading rounds:', error);
      setAvailableRounds([]);
    }
  };

  const handleUpdateRound = async (enrollmentId: string, newRoundId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ round_id: newRoundId || null })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round updated successfully"
      });

      setEditingEnrollmentId('');
      setEditRoundId('');
      loadEnrollments();
    } catch (error: any) {
      console.error('Error updating round:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEnrollUser = async () => {
    if (!selectedUserId || !selectedCourse) {
      toast({
        title: "Invalid input",
        description: "Please select both a user and a course",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get user profile for order details
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('id', selectedUserId)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', selectedUserId)
        .eq('course_name', selectedCourse)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already enrolled",
          description: "This user is already enrolled in this course",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Create a test order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: selectedUserId,
          product_name: selectedCourse,
          amount: 9700, // $97.00 in cents as default
          currency: 'usd',
          status: 'paid',
          email: profile.email,
          name: profile.full_name || 'Test User',
          phone: profile.phone,
          stripe_session_id: `test_${Date.now()}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Get program slug for the enrollment
      const program = programs.find(p => p.title === selectedCourse);

      // Create enrollment
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: selectedUserId,
          course_name: selectedCourse,
          program_slug: program?.slug || null,
          round_id: selectedRoundId && selectedRoundId !== 'none' ? selectedRoundId : null,
          status: 'active'
        });

      if (enrollError) throw enrollError;

      toast({
        title: "Success",
        description: "User enrolled and test order created successfully"
      });

      setSelectedUserId('');
      setSelectedCourse('');
      setSelectedRoundId('');
      loadEnrollments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Course Enrollment Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enroll User Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Enroll User in Course
          </h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email} {user.full_name ? `(${user.full_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.slug} value={program.title}>
                    {program.title} ({program.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableRounds.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Round (Optional)</label>
              <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a round..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No round</SelectItem>
                  {availableRounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.round_name} ({round.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleEnrollUser}
            disabled={isLoading || !selectedUserId || !selectedCourse}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Enroll User'}
          </Button>
        </div>

        {/* Enrollments List */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Enrollments ({enrollments.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {enrollment.profiles?.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {enrollment.course_name}
                  </p>
                  {editingEnrollmentId === enrollment.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Select 
                        value={editRoundId} 
                        onValueChange={setEditRoundId}
                      >
                        <SelectTrigger className="h-7 text-xs w-[200px]">
                          <SelectValue placeholder="Select round..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No round</SelectItem>
                          {availableRounds
                            .filter(r => r.program_slug === enrollment.program_slug)
                            .map((round) => (
                              <SelectItem key={round.id} value={round.id}>
                                {round.round_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleUpdateRound(enrollment.id, editRoundId === 'none' ? '' : editRoundId)}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingEnrollmentId('');
                          setEditRoundId('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      {enrollment.program_rounds ? (
                        <p className="text-xs text-muted-foreground">
                          Round: {enrollment.program_rounds.round_name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground text-orange-600">
                          No round assigned
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex flex-col gap-2 items-end">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    enrollment.status === 'active' 
                      ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                      : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                  }`}>
                    {enrollment.status}
                  </span>
                  {editingEnrollmentId !== enrollment.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={async () => {
                        setEditingEnrollmentId(enrollment.id);
                        setEditRoundId(enrollment.round_id || 'none');
                        // Load rounds for this enrollment's program
                        if (enrollment.program_slug) {
                          await loadRoundsForCourse(enrollment.program_slug);
                        }
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
