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
  program_slug?: string | null;
}

interface Enrollment {
  id: string;
  course_name: string;
  enrolled_at: string;
  status: string;
  program_slug: string | null;
}

interface CombinedCourse {
  id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  program_slug?: string | null;
  source: 'order' | 'enrollment';
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [combinedCourses, setCombinedCourses] = useState<CombinedCourse[]>([]);
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
        city: null
      }));
      
      setOrders(ordersWithLocation);

      // Load course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

      // Combine orders and enrollments
      const combined: CombinedCourse[] = [
        ...ordersWithLocation.map(order => ({
          id: order.id,
          product_name: order.product_name,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          created_at: order.created_at,
          program_slug: order.program_slug,
          source: 'order' as const
        })),
        ...(enrollmentsData || []).map(enrollment => ({
          id: enrollment.id,
          product_name: enrollment.course_name,
          amount: 0,
          currency: 'usd',
          status: enrollment.status,
          created_at: enrollment.enrolled_at,
          program_slug: enrollment.program_slug,
          source: 'enrollment' as const
        }))
      ];

      // Sort by date, most recent first
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCombinedCourses(combined);

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
          <div className="container mx-auto px-3 py-3 lg:px-4 lg:py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Welcome, {profile?.full_name || 'there'}!</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 text-xs">
                <LogOut className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-3 py-4 lg:px-4 lg:py-6 space-y-4 lg:space-y-6">
          {/* Stats Cards */}
          <StatsCards enrolledCount={combinedCourses.length} creditsBalance={creditsBalance} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Profile Section */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {getInitials(profile?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center w-full">
                      <h3 className="font-semibold text-base">
                        {profile?.full_name || 'Student'}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {profile?.email}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {!isEditing ? (
                    <div className="space-y-2">
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile?.city && (
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{profile.city}</span>
                        </div>
                      )}
                      {profile?.bio && (
                        <p className="text-xs text-muted-foreground">{profile.bio}</p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => setIsEditing(true)}
                      >
                        <Settings className="mr-1 h-3 w-3" />
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="full_name" className="text-xs">Full Name</Label>
                        <Input
                          id="full_name"
                          className="h-8 text-xs"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-xs">Phone</Label>
                        <Input
                          id="phone"
                          className="h-8 text-xs"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-xs">City</Label>
                        <Input
                          id="city"
                          className="h-8 text-xs"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio" className="text-xs">Bio</Label>
                        <Textarea
                          id="bio"
                          className="text-xs"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile} className="flex-1 h-8 text-xs">
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 text-xs"
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    Contact us on WhatsApp
                  </p>
                  <Button 
                    className="w-full h-8 text-xs" 
                    variant="default"
                    onClick={() => window.open('https://wa.me/16265028589', '_blank')}
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Message Admin Card */}
              <Card className="hidden lg:block">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    Contact Admin
                  </CardTitle>
                  <CardDescription className="text-xs">Send a message</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="subject" className="text-xs">Subject *</Label>
                    <Select
                      value={messageForm.subject}
                      onValueChange={(value) => setMessageForm({ ...messageForm, subject: value })}
                    >
                      <SelectTrigger id="subject" className="h-8 text-xs">
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

                  <div className="space-y-1">
                    <Label htmlFor="course" className="text-xs">Related Course</Label>
                    <Select
                      value={messageForm.course}
                      onValueChange={(value) => setMessageForm({ ...messageForm, course: value })}
                    >
                      <SelectTrigger id="course" className="h-8 text-xs">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Courageous Character Course">Courageous Character</SelectItem>
                        <SelectItem value="IQ Money Workshop">IQ Money</SelectItem>
                        <SelectItem value="Assertiveness Training">Assertiveness</SelectItem>
                        <SelectItem value="Business Coaching">Business Coaching</SelectItem>
                        <SelectItem value="Ladyboss VIP Club">Ladyboss VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="message" className="text-xs">Message *</Label>
                    <Textarea
                      id="message"
                      className="text-xs"
                      placeholder="Type your message..."
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button 
                    className="w-full h-8 text-xs"
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
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Actions */}
              <QuickActions />

              {/* My Orders */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingBag className="h-4 w-4" />
                    My Orders
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your enrolled programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {combinedCourses.length === 0 ? (
                    <div className="text-center py-6">
                      <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground mb-3">
                        You haven't enrolled yet
                      </p>
                      <Button size="sm" onClick={() => navigate("/#programs")} className="h-8 text-xs">
                        Browse Programs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {combinedCourses.map((course) => (
                        <div 
                          key={course.id} 
                          className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-semibold text-sm">{normalizeProductName(course.product_name)}</h4>
                                {course.source === 'enrollment' && (
                                  <Badge variant="outline" className="text-xs h-5">Admin</Badge>
                                )}
                                <Badge variant={course.status === 'paid' || course.status === 'active' ? 'default' : 'secondary'} className="text-xs h-5">
                                  {course.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(course.created_at)}</span>
                              </div>
                            </div>
                            {course.source === 'order' && course.amount > 0 && (
                              <p className="font-bold text-sm whitespace-nowrap">{formatPrice(course.amount, course.currency)}</p>
                            )}
                          </div>
                          {course.program_slug && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full h-7 text-xs"
                              onClick={() => navigate(`/payment-success?test=true&program=${course.program_slug}`)}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit Transactions */}
              <CreditTransactions />

              {/* Announcements */}
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
