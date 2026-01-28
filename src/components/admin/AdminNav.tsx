import { LayoutDashboard, Users, GraduationCap, Music, Send, UserCog, CreditCard, Shield, LogOut, MessageCircle, Newspaper, Sparkles, Wrench } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard, end: true, pageSlug: 'overview' },
  { title: 'Users', url: '/admin/users', icon: Users, pageSlug: 'users' },
  { title: 'Enrollment', url: '/admin/enrollment', icon: GraduationCap, pageSlug: 'enrollment' },
  { title: 'Audio', url: '/admin/audio', icon: Music, pageSlug: 'audio' },
  { title: 'Community', url: '/admin/community', icon: Newspaper, pageSlug: 'community' },
  { title: 'Routines', url: '/admin/routines', icon: Sparkles, pageSlug: 'routines' },
  { title: 'Communications', url: '/admin/communications', icon: Send, pageSlug: 'communications' },
  { title: 'Programs', url: '/admin/programs', icon: UserCog, pageSlug: 'programs' },
  { title: 'Payments', url: '/admin/payments', icon: CreditCard, pageSlug: 'payments' },
  { title: 'Support', url: '/admin/support', icon: MessageCircle, pageSlug: 'support' },
  { title: 'Tools', url: '/admin/tools', icon: Wrench, pageSlug: 'tools' },
  { title: 'System', url: '/admin/system', icon: Shield, pageSlug: 'system' },
];

export function AdminNav() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAccessAdminPage } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out"
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => canAccessAdminPage(item.pageSlug));

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          
          <div className="flex items-center gap-1">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                    isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.title}</span>
              </NavLink>
            ))}
          </div>

          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}