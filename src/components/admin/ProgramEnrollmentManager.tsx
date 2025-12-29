import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, RefreshCw, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface Program {
  slug: string;
  title: string;
}

interface ProgramRound {
  id: string;
  round_name: string;
  round_number: number;
  status: string;
}

interface EnrolledUser {
  id: string;
  user_id: string;
  enrolled_at: string;
  round_id: string | null;
  email: string;
  phone: string | null;
  full_name: string | null;
  round_name: string | null;
}

export function ProgramEnrollmentManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [rounds, setRounds] = useState<ProgramRound[]>([]);
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [targetRound, setTargetRound] = useState<string>('');
  const [syncMailchimp, setSyncMailchimp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Load programs on mount
  useEffect(() => {
    loadPrograms();
  }, []);

  // Load rounds and enrollments when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadRoundsAndEnrollments();
    } else {
      setRounds([]);
      setEnrolledUsers([]);
    }
    setSelectedUsers(new Set());
    setTargetRound('');
  }, [selectedProgram]);

  const loadPrograms = async () => {
    const { data, error } = await supabase
      .from('program_catalog')
      .select('slug, title')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error loading programs:', error);
      return;
    }
    setPrograms(data || []);
  };

  const loadRoundsAndEnrollments = async () => {
    setIsLoading(true);
    try {
      // Load rounds for the program
      const { data: roundsData, error: roundsError } = await supabase
        .from('program_rounds')
        .select('id, round_name, round_number, status')
        .eq('program_slug', selectedProgram)
        .order('round_number', { ascending: false });

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);

      // Load enrollments with user profiles
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          enrolled_at,
          round_id,
          profiles!inner(email, phone, full_name)
        `)
        .eq('program_slug', selectedProgram)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      // Map enrollments with round names
      const roundMap = new Map((roundsData || []).map(r => [r.id, r.round_name]));
      
      const users: EnrolledUser[] = (enrollmentsData || []).map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        enrolled_at: e.enrolled_at,
        round_id: e.round_id,
        email: e.profiles.email,
        phone: e.profiles.phone,
        full_name: e.profiles.full_name,
        round_name: e.round_id ? roundMap.get(e.round_id) || null : null
      }));

      setEnrolledUsers(users);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to load data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === enrolledUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(enrolledUsers.map(u => u.id)));
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAssignToRound = async () => {
    if (selectedUsers.size === 0 || !targetRound) {
      toast({
        title: "Selection Required",
        description: "Please select users and a target round",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Update enrollments
      const { error: updateError } = await supabase
        .from('course_enrollments')
        .update({ round_id: targetRound })
        .in('id', Array.from(selectedUsers));

      if (updateError) throw updateError;

      // Sync Mailchimp tags if enabled
      if (syncMailchimp) {
        toast({
          title: "Updating Mailchimp...",
          description: "Syncing tags for enrolled users"
        });

        const { data: syncData, error: syncError } = await supabase.functions.invoke('mailchimp-sync-round-tags', {
          body: { round_id: targetRound }
        });

        if (syncError) {
          console.error('Mailchimp sync error:', syncError);
          toast({
            title: "Mailchimp Sync Warning",
            description: "Round assigned but Mailchimp sync had issues",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: `${selectedUsers.size} users assigned to round. Mailchimp: ${syncData?.results?.length || 0} synced.`
          });
        }
      } else {
        toast({
          title: "Success",
          description: `${selectedUsers.size} users assigned to round`
        });
      }

      // Refresh data
      await loadRoundsAndEnrollments();
      setSelectedUsers(new Set());
      setTargetRound('');
    } catch (error: any) {
      console.error('Error assigning round:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to assign round',
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Program Enrollment Manager
        </CardTitle>
        <CardDescription>
          View and manage enrolled users, assign them to rounds in bulk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Program Selector */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select Program</label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a program..." />
              </SelectTrigger>
              <SelectContent>
                {programs.map(p => (
                  <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProgram && (
            <Button variant="outline" onClick={loadRoundsAndEnrollments} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Enrolled Users Table */}
        {selectedProgram && (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={enrolledUsers.length > 0 && selectedUsers.size === enrolledUsers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Current Round</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : enrolledUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No enrolled users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrolledUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{format(new Date(user.enrolled_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {user.round_name ? (
                            <Badge variant="secondary">{user.round_name}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">No round</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Bulk Actions */}
            {enrolledUsers.length > 0 && (
              <div className="flex flex-wrap gap-4 items-end p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">
                    Assign {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : 'selected'} users to:
                  </label>
                  <Select value={targetRound} onValueChange={setTargetRound}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target round..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rounds.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.round_name} ({r.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sync-mailchimp"
                    checked={syncMailchimp}
                    onCheckedChange={(checked) => setSyncMailchimp(checked === true)}
                  />
                  <label htmlFor="sync-mailchimp" className="text-sm flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Sync Mailchimp tags
                  </label>
                </div>

                <Button
                  onClick={handleAssignToRound}
                  disabled={selectedUsers.size === 0 || !targetRound || isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign to Round'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
