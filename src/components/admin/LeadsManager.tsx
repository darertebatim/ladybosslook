import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Mail, Phone, MapPin, ShoppingCart, GraduationCap, Calendar, DollarSign, Key } from 'lucide-react';
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
    program_rounds: {
      round_name: string;
    } | null;
  }>;
}

export function LeadsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLead | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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

      // Search enrollments
      let enrollments: any[] = [];
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
        enrollments
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
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{enrollment.course_name}</p>
                            </div>
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
                          </div>
                          <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
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
