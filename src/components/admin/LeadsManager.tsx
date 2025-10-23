import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Mail, Phone, MapPin, ShoppingCart, GraduationCap, Calendar, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserLead {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    city: string | null;
    created_at: string;
  } | null;
  submissions: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    source: string;
    submitted_at: string;
    mailchimp_success: boolean;
  }>;
  orders: Array<{
    id: string;
    product_name: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    payment_type: string | null;
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

      // Search form submissions
      const { data: submissions } = await supabase
        .from('form_submissions')
        .select('*')
        .or(`email.ilike.%${email}%,name.ilike.%${searchQuery}%`)
        .order('submitted_at', { ascending: false });

      // Search orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .or(`email.ilike.%${email}%,name.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

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

      if (!profile && (!submissions || submissions.length === 0) && (!orders || orders.length === 0)) {
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
        submissions: submissions || [],
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Profile
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
                    {searchResults.profile.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{searchResults.profile.city}</span>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="orders">
                  Orders ({searchResults.orders.length})
                </TabsTrigger>
                <TabsTrigger value="enrollments">
                  Enrollments ({searchResults.enrollments.length})
                </TabsTrigger>
                <TabsTrigger value="submissions">
                  Submissions ({searchResults.submissions.length})
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

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="space-y-3">
                {searchResults.submissions.length > 0 ? (
                  searchResults.submissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium">{submission.name}</p>
                              <p className="text-sm text-muted-foreground">{submission.email}</p>
                            </div>
                            <Badge variant={submission.mailchimp_success ? 'default' : 'destructive'}>
                              {submission.mailchimp_success ? 'Synced' : 'Not synced'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {submission.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {submission.phone}
                              </div>
                            )}
                            {submission.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {submission.city}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </div>
                            <div>
                              Source: {submission.source}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No form submissions found</p>
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
