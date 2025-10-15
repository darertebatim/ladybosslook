import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Users } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

interface Enrollment {
  id: string;
  course_name: string;
  status: string;
  enrolled_at: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { programs } = usePrograms();

  useEffect(() => {
    loadUsers();
    loadEnrollments();
  }, []);

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
        .select('id, course_name, status, enrolled_at, user_id')
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

      // Create enrollment
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: selectedUserId,
          course_name: selectedCourse,
          status: 'active'
        });

      if (enrollError) throw enrollError;

      // Create a test order as well
      const { error: orderError } = await supabase
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
        });

      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: "User enrolled and test order created successfully"
      });

      setSelectedUserId('');
      setSelectedCourse('');
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
                  <p className="text-xs text-muted-foreground">
                    Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    enrollment.status === 'active' 
                      ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                      : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                  }`}>
                    {enrollment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
