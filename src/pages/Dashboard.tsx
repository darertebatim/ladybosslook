import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Announcements } from '@/components/dashboard/Announcements';
import { CreditTransactions } from '@/components/dashboard/CreditTransactions';
import { AddTestEnrollment } from '@/components/AddTestEnrollment';
import { 
  User, 
  ShoppingBag, 
  MessageCircle, 
  Settings, 
  LogOut,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Send
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Order {
  id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  phone: string | null;
  city: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    bio: ''
  });
  const [messageForm, setMessageForm] = useState({
    subject: '',
    course: '',
    message: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        city: profileData.city || '',
        bio: profileData.bio || ''
      });

      // Load wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('credits_balance')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (walletError) throw walletError;
      setCreditsBalance(walletData?.credits_balance || 0);

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithLocation = (ordersData || []).map(order => ({
        ...order,
        city: null // Orders table doesn't have city field, will need to get from form_submissions if needed
      }));
      
      setOrders(ordersWithLocation);

      // Update profile with phone from most recent order if profile data is missing
      if (ordersData && ordersData.length > 0 && profileData) {
        const latestOrder = ordersData[0];
        if (!profileData.phone && latestOrder.phone) {
          await supabase
            .from('profiles')
            .update({ phone: latestOrder.phone })
            .eq('id', user!.id);
          
          setProfile({ ...profileData, phone: latestOrder.phone });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });

      setIsEditing(false);
      loadUserData();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSendMessage = async () => {
    if (!messageForm.subject || !messageForm.message.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please select a subject and enter your message",
        variant: "destructive"
      });
      return;
    }

    try {
      // Build message for WhatsApp
      const courseInfo = messageForm.course ? `\nCourse: ${messageForm.course}` : '';
      const message = encodeURIComponent(
        `SUPPORT REQUEST\n\nSubject: ${messageForm.subject}\nFrom: ${profile?.full_name || 'Student'}\nEmail: ${profile?.email}${courseInfo}\n\nMessage:\n${messageForm.message}`
      );
      window.open(`https://wa.me/16265028589?text=${message}`, '_blank');
      
      setMessageForm({ subject: '', course: '', message: '' });
      toast({
        title: "Message sent",
        description: "Your message has been sent to admin via WhatsApp"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatPrice = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const normalizeProductName = (productName: string) => {
    // Replace "Workshop" with "Course" for Courageous Character products
    return productName.replace(/Courageous Character Workshop/gi, 'Courageous Character Course');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Student Dashboard"
        description="Manage your profile and access your purchased courses"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 lg:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">My Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Welcome back, {profile?.full_name || 'there'}!</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 lg:py-8 space-y-6">
          {/* Stats Cards */}
          <StatsCards enrolledCount={orders.length} creditsBalance={creditsBalance} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(profile?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center w-full">
                      <h3 className="font-semibold text-lg">
                        {profile?.full_name || 'Student'}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {profile?.email}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {!isEditing ? (
                    <div className="space-y-3">
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile?.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.city}</span>
                        </div>
                      )}
                      {profile?.bio && (
                        <p className="text-sm text-muted-foreground">{profile.bio}</p>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsEditing(true)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile} className="flex-1">
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              full_name: profile?.full_name || '',
                              phone: profile?.phone || '',
                              city: profile?.city || '',
                              bio: profile?.bio || ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* WhatsApp Support Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-5 w-5" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Contact us on WhatsApp for support
                  </p>
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => window.open('https://wa.me/16265028589', '_blank')}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message on WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Message Admin Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Send className="h-5 w-5" />
                    Contact Admin
                  </CardTitle>
                  <CardDescription>Send a message or request to admin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={messageForm.subject}
                      onValueChange={(value) => setMessageForm({ ...messageForm, subject: value })}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Refund Request">Refund Request</SelectItem>
                        <SelectItem value="Technical Support">Technical Support</SelectItem>
                        <SelectItem value="Course Question">Course Question</SelectItem>
                        <SelectItem value="Billing Issue">Billing Issue</SelectItem>
                        <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                        <SelectItem value="Feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course">Related Course (Optional)</Label>
                    <Select
                      value={messageForm.course}
                      onValueChange={(value) => setMessageForm({ ...messageForm, course: value })}
                    >
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Courageous Character Course">Courageous Character Course</SelectItem>
                        <SelectItem value="IQ Money Workshop">IQ Money Workshop</SelectItem>
                        <SelectItem value="Assertiveness Training">Assertiveness Training</SelectItem>
                        <SelectItem value="Business Coaching">Business Coaching</SelectItem>
                        <SelectItem value="Ladyboss VIP Club">Ladyboss VIP Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      rows={5}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={handleSendMessage}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Message to Admin
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <QuickActions />

              {/* Credit Transactions */}
              <CreditTransactions />

              {/* Announcements */}
              <Announcements />

              {/* My Orders */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        My Orders
                      </CardTitle>
                      <CardDescription>
                        Your enrolled programs and training sessions
                      </CardDescription>
                    </div>
                    <AddTestEnrollment />
                  </div>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        You haven't enrolled in any events yet
                      </p>
                      <Button onClick={() => navigate("/#programs")}>
                        Browse Programs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold">{normalizeProductName(order.product_name)}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                              <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-lg">{formatPrice(order.amount, order.currency)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
