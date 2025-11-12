import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Mail, Phone, MapPin, MessageCircle, Calendar, Lock, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useState } from 'react';

const AppProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
    });
    navigate('/auth');
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="Profile - LadyBoss Academy"
        description="Your profile settings"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('info-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <User className="h-4 w-4" />
            <span className="text-xs">Info</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('support-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Support</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('password-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Lock className="h-4 w-4" />
            <span className="text-xs">Password</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('actions-section')}
            className="flex flex-col h-auto py-3 gap-1 col-span-2 sm:col-span-1"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs">Sign Out</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{profile?.full_name || 'User'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card id="info-section">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profile?.email || user?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.city}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="support-section">
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
            <CardDescription>Send us a message on Telegram @ladybosslook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
              >
                <option value="">Select a topic...</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Refund Request">Refund Request</option>
                <option value="Cancel Subscription">Cancel Subscription</option>
                <option value="Course Question">Course Question</option>
                <option value="Billing Issue">Billing Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (!contactSubject || !contactMessage.trim()) {
                  toast({
                    title: 'Error',
                    description: 'Please select a subject and enter a message',
                    variant: 'destructive',
                  });
                  return;
                }
                const telegramMessage = `Subject: ${contactSubject}\n\nMessage:\n${contactMessage}`;
                window.open(`https://t.me/ladybosslook?text=${encodeURIComponent(telegramMessage)}`, '_blank');
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Send via Telegram
            </Button>
          </CardContent>
        </Card>

        <Card id="password-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        <Card id="actions-section">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppProfile;
