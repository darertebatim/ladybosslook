import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Mail, Phone, MapPin, ShoppingCart, GraduationCap, Calendar, DollarSign, Key, Edit2, Trash2, UserPlus, Smartphone, Send, RotateCcw, GitMerge } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePrograms } from '@/hooks/usePrograms';
import { useQuery } from '@tanstack/react-query';

interface PushSubscription {
  id: string;
  endpoint: string;
  created_at: string;
}

interface UserLead {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    city: string | null;
    created_at: string;
  } | null;
  paymentInfo: {
    city: string | null;
    country: string | null;
  } | null;
  orders: Array<{
    id: string;
    product_name: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    payment_type: string | null;
    stripe_session_id: string | null;
  }>;
  enrollments: Array<{
    id: string;
    course_name: string;
    status: string;
    enrolled_at: string;
    round_id: string | null;
    program_slug: string | null;
    program_rounds: {
      round_name: string;
    } | null;
  }>;
  pushSubscriptions: PushSubscription[];
}

interface ProgramRound {
  id: string;
  round_name: string;
  round_number: number;
  status: string;
}

export function LeadsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLead | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<string | null>(null);
  const [availableRounds, setAvailableRounds] = useState<Record<string, ProgramRound[]>>({});
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedEnrollRound, setSelectedEnrollRound] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeEmail, setMergeEmail] = useState('');
  const [sendingTestTo, setSendingTestTo] = useState<string | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<string | null>(null);
  const { toast } = useToast();
  const { programs, isLoading: programsLoading } = usePrograms();

  // Fetch available rounds for selected course
  const { data: enrollRounds } = useQuery({
    queryKey: ['enroll-course-rounds', selectedCourse],
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter an email or name to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const email = searchQuery.toLowerCase().trim();
      
      // Search for user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${email}%,full_name.ilike.%${searchQuery}%`)
        .maybeSingle();

      // Search orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .or(`email.ilike.%${email}%,name.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      // Get payment info (city/country) from the most recent paid order
      let paymentInfo: { city: string | null; country: string | null } | null = null;
      if (orders && orders.length > 0) {
        const mostRecentOrder = orders.find(o => o.status === 'paid' && o.stripe_session_id);
        if (mostRecentOrder?.stripe_session_id) {
          try {
            const { data: sessionDetails } = await supabase.functions.invoke('get-stripe-session-details', {
              body: { sessionId: mostRecentOrder.stripe_session_id }
            });
            
            if (sessionDetails?.customer_details) {
              paymentInfo = {
                city: sessionDetails.customer_details.address?.city || null,
                country: sessionDetails.customer_details.address?.country || null
              };
            }
          } catch (error) {
            console.error('Error fetching payment details:', error);
          }
        }
      }

      // Search enrollments and push subscriptions
      let enrollments: any[] = [];
      let pushSubscriptions: PushSubscription[] = [];
      
      if (profile) {
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            program_rounds (
              round_name
            )
          `)
          .eq('user_id', profile.id)
          .order('enrolled_at', { ascending: false });
        enrollments = enrollmentData || [];
        
        // Fetch push subscriptions for this user
        const { data: pushData } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        pushSubscriptions = pushData || [];
        
        // Fetch available rounds for each unique program_slug
        const uniqueSlugs = [...new Set(enrollments.map(e => e.program_slug).filter(Boolean))];
        const roundsMap: Record<string, ProgramRound[]> = {};
        
        for (const slug of uniqueSlugs) {
          const { data: rounds } = await supabase
            .from('program_rounds')
            .select('id, round_name, round_number, status')
            .eq('program_slug', slug)
            .in('status', ['active', 'upcoming'])
            .order('round_number', { ascending: false });
          
          if (rounds) {
            roundsMap[slug as string] = rounds;
          }
        }
        
        setAvailableRounds(roundsMap);
      }

      if (!profile && (!orders || orders.length === 0)) {
        toast({
          title: "No results",
          description: "No user found with that email or name",
          variant: "destructive"
        });
        setSearchResults(null);
        return;
      }

      setSearchResults({
        profile,
        paymentInfo,
        orders: orders || [],
        enrollments,
        pushSubscriptions
      });

      toast({
        title: "Search complete",
        description: `Found information for ${searchQuery}`
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleChangePassword = async () => {
    if (!searchResults?.profile?.id) return;

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('admin-change-password', {
        body: {
          userId: searchResults.profile.id,
          newPassword
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully"
      });

      setNewPassword('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnrollUser = async () => {
    if (!searchResults?.profile?.email || !selectedCourse) {
      toast({
        title: 'Missing Information',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }

    setIsEnrolling(true);
    try {
      const selectedProgram = programs.find(p => p.title === selectedCourse);
      
      const { data, error } = await supabase.functions.invoke('admin-create-enrollment', {
        body: {
          email: searchResults.profile.email,
          courseName: selectedCourse,
          programSlug: selectedProgram?.slug,
          roundId: selectedEnrollRound || null,
          fullName: searchResults.profile.full_name || null,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: data.message || 'User enrolled successfully',
      });

      setIsEnrollDialogOpen(false);
      setSelectedCourse('');
      setSelectedEnrollRound('');
      
      // Refresh search results to show new enrollment
      handleSearch();
    } catch (error: any) {
      console.error('Error enrolling user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll user',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUpdateRound = async (enrollmentId: string, newRoundId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ round_id: newRoundId })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round updated successfully"
      });

      // Refresh search results
      await handleSearch();
      setEditingEnrollment(null);
    } catch (error: any) {
      console.error('Error updating round:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update round",
        variant: "destructive"
      });
    }
  };

  const handleUnenroll = async (enrollmentId: string, courseName: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User removed from ${courseName}`
      });

      // Refresh search results
      await handleSearch();
    } catch (error: any) {
      console.error('Error unenrolling user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!searchResults?.profile?.id) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: {
          userId: searchResults.profile.id
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      // Clear search results
      setSearchResults(null);
      setSearchQuery('');
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetUserData = async () => {
    if (!searchResults?.profile?.id) return;

    setIsResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('reset-user-data', {
        body: {
          targetUserId: searchResults.profile.id
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      // Full client-side reset - clears all tours, onboarding flags, etc.
      // This is centralized so new features automatically get included
      const { fullClientReset } = await import('@/lib/clientReset');
      fullClientReset();

      toast({
        title: "Ultimate Reset Complete",
        description: `All app data + client flags for ${searchResults.profile.email} have been reset. Go to /app/home for full "Day 1" experience.`
      });

      // Refresh search results
      handleSearch();
    } catch (error: any) {
      console.error('Reset user data error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset user data",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleMergeAccounts = async () => {
    if (!searchResults?.profile?.id || !mergeEmail.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the secondary email to merge',
        variant: 'destructive',
      });
      return;
    }

    setIsMerging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('admin-merge-accounts', {
        body: {
          primaryUserId: searchResults.profile.id,
          secondaryEmail: mergeEmail.trim(),
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Merge Complete!',
        description: `Transferred ${data.mergedOrders} orders and ${data.mergedEnrollments} enrollments from ${mergeEmail}`,
      });

      setIsMergeDialogOpen(false);
      setMergeEmail('');
      
      // Refresh search results
      handleSearch();
    } catch (error: any) {
      console.error('Merge accounts error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to merge accounts',
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleSendTestNotification = async (email: string, subscriptionId: string) => {
    setSendingTestTo(subscriptionId);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          targetUserEmail: email,
          title: '🧪 Test Notification',
          body: 'This is a test notification to verify your device registration.',
          url: '/app/home',
        },
      });

      if (error) throw error;

      toast({
        title: 'Test Sent',
        description: `Test notification sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setSendingTestTo(null);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    setDeletingSubscription(id);
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Device Removed',
        description: 'Push notification subscription has been deleted',
      });

      // Refresh search results
      handleSearch();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscription',
        variant: 'destructive',
      });
    } finally {
      setDeletingSubscription(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Users Search & Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-6">
            {/* Profile Information */}
            {searchResults.profile ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User Profile
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Enroll in Course
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Enroll User in Course</DialogTitle>
                            <DialogDescription>
                              Enroll {searchResults.profile.email} in a course and optional round
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="enroll-course">Select Course *</Label>
                              <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                                disabled={isEnrolling || programsLoading}
                              >
                                <SelectTrigger id="enroll-course">
                                  <SelectValue placeholder="Choose a course..." />
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

                            {selectedCourse && enrollRounds && enrollRounds.length > 0 && (
                              <div className="space-y-2">
                                <Label htmlFor="enroll-round">Select Round (Optional)</Label>
                                <Select
                                  value={selectedEnrollRound}
                                  onValueChange={setSelectedEnrollRound}
                                  disabled={isEnrolling}
                                >
                                  <SelectTrigger id="enroll-round">
                                    <SelectValue placeholder="Choose a round..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {enrollRounds.map((round) => (
                                      <SelectItem key={round.id} value={round.id}>
                                        {round.round_name} (Round {round.round_number}) - {round.status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEnrollDialogOpen(false);
                                setSelectedCourse('');
                                setSelectedEnrollRound('');
                              }}
                              disabled={isEnrolling}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleEnrollUser}
                              disabled={isEnrolling || !selectedCourse}
                            >
                              {isEnrolling ? 'Enrolling...' : 'Enroll User'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Key className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change User Password</DialogTitle>
                            <DialogDescription>
                              Enter a new password for {searchResults.profile.email}. The user will be able to sign in with this new password immediately.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setNewPassword('');
                              }}
                              disabled={isChangingPassword}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleChangePassword}
                              disabled={isChangingPassword}
                            >
                              {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isResetting}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset User Data?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reset all app data for <strong>{searchResults.profile.email}</strong> including:
                              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                                <li>Tasks, subtasks, and completions</li>
                                <li>Streaks and routine progress</li>
                                <li>Journal entries</li>
                                <li>Audio progress and bookmarks</li>
                                <li>Chat conversations</li>
                                <li>Enrollments and course progress</li>
                                <li>Push notification subscriptions</li>
                              </ul>
                              <p className="mt-2">The user account will remain but with a fresh start.</p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleResetUserData}
                              disabled={isResetting}
                              className="bg-orange-600 text-white hover:bg-orange-700"
                            >
                              {isResetting ? 'Resetting...' : 'Reset Data'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <GitMerge className="h-4 w-4 mr-2" />
                            Merge Accounts
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Merge Account Data</DialogTitle>
                            <DialogDescription>
                              Transfer orders and enrollments from another email to <strong>{searchResults.profile.email}</strong>.
                              This is useful when a user purchased with a different email.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="merge-email">Secondary Email</Label>
                              <Input
                                id="merge-email"
                                type="email"
                                placeholder="Enter the email with orders to merge..."
                                value={mergeEmail}
                                onChange={(e) => setMergeEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleMergeAccounts()}
                              />
                              <p className="text-xs text-muted-foreground">
                                All orders and enrollments from this email will be transferred to the current user.
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsMergeDialogOpen(false);
                                setMergeEmail('');
                              }}
                              disabled={isMerging}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleMergeAccounts}
                              disabled={isMerging || !mergeEmail.trim()}
                            >
                              {isMerging ? 'Merging...' : 'Merge Data'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user account for <strong>{searchResults.profile.email}</strong>.
                              This action cannot be undone. All associated data including enrollments, orders, and profile information will be removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteUser}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete User'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{searchResults.profile.email}</span>
                    </div>
                    {searchResults.profile.full_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{searchResults.profile.full_name}</span>
                      </div>
                    )}
                    {searchResults.profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{searchResults.profile.phone}</span>
                      </div>
                    )}
                    {(searchResults.paymentInfo?.city || searchResults.profile.city) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {searchResults.paymentInfo?.city || searchResults.profile.city}
                          {searchResults.paymentInfo?.country && `, ${searchResults.paymentInfo.country}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined: {new Date(searchResults.profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Push Notifications Section */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Push Notifications
                        {searchResults.pushSubscriptions.length > 0 ? (
                          <Badge variant="default" className="ml-2">
                            {searchResults.pushSubscriptions.length} device{searchResults.pushSubscriptions.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2">No devices</Badge>
                        )}
                      </span>
                    </div>
                    
                    {searchResults.pushSubscriptions.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.pushSubscriptions.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {sub.endpoint.startsWith('native:') ? 'Native App' : 'Web'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Registered {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendTestNotification(searchResults.profile!.email, sub.id)}
                                disabled={sendingTestTo === sub.id}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                {sendingTestTo === sub.id ? 'Sending...' : 'Test'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSubscription(sub.id)}
                                disabled={deletingSubscription === sub.id}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        This user has no registered devices for push notifications.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No user account found</p>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">
                  Orders ({searchResults.orders.length})
                </TabsTrigger>
                <TabsTrigger value="enrollments">
                  Enrollments ({searchResults.enrollments.length})
                </TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-3">
                {searchResults.orders.length > 0 ? (
                  searchResults.orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{order.product_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(order.amount, order.currency)}
                                {order.payment_type && ` • ${order.payment_type}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No orders found</p>
                  </div>
                )}
              </TabsContent>

              {/* Enrollments Tab */}
              <TabsContent value="enrollments" className="space-y-3">
                {searchResults.enrollments.length > 0 ? (
                  searchResults.enrollments.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{enrollment.course_name}</p>
                              </div>
                              
                              {editingEnrollment === enrollment.id ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <Select
                                    value={selectedRound}
                                    onValueChange={setSelectedRound}
                                  >
                                    <SelectTrigger className="w-[250px]">
                                      <SelectValue placeholder="Select round..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {enrollment.program_slug && availableRounds[enrollment.program_slug]?.map((round) => (
                                        <SelectItem key={round.id} value={round.id}>
                                          {round.round_name} ({round.status})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateRound(enrollment.id, selectedRound)}
                                    disabled={!selectedRound}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingEnrollment(null);
                                      setSelectedRound('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  {enrollment.program_rounds && (
                                    <p className="text-sm text-muted-foreground">
                                      Round: {enrollment.program_rounds.round_name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                                {enrollment.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {editingEnrollment !== enrollment.id && (
                            <div className="flex gap-2 pt-2 border-t">
                              {enrollment.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingEnrollment(enrollment.id);
                                    setSelectedRound(enrollment.round_id || '');
                                  }}
                                  disabled={!enrollment.program_slug || !availableRounds[enrollment.program_slug]?.length}
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Change Round
                                </Button>
                              )}
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete this enrollment from {enrollment.course_name}? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleUnenroll(enrollment.id, enrollment.course_name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No enrollments found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
