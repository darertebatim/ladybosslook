import { LayoutDashboard, Users, GraduationCap, Music, Send, UserCog, CreditCard, Shield, LogOut, MessageCircle, Newspaper, Wrench, Bell, PanelLeftClose, PanelLeft, Crown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard, end: true, pageSlug: 'overview' },
  { title: 'Users', url: '/admin/users', icon: Users, pageSlug: 'users' },
  { title: 'Enrollment', url: '/admin/enrollment', icon: GraduationCap, pageSlug: 'enrollment' },
  { title: 'Audio', url: '/admin/audio', icon: Music, pageSlug: 'audio' },
  { title: 'Channels', url: '/admin/channels', icon: Newspaper, pageSlug: 'community' },
  { title: 'Communications', url: '/admin/communications', icon: Send, pageSlug: 'communications' },
  { title: 'Push', url: '/admin/pn', icon: Bell, pageSlug: 'communications' },
  { title: 'Programs', url: '/admin/programs', icon: UserCog, pageSlug: 'programs' },
  { title: 'Payments', url: '/admin/payments', icon: CreditCard, pageSlug: 'payments' },
  { title: 'Subscriptions', url: '/admin/subscriptions', icon: Crown, pageSlug: 'subscriptions' },
  { title: 'Support', url: '/admin/support', icon: MessageCircle, pageSlug: 'support' },
  { title: 'Tools', url: '/admin/tools', icon: Wrench, pageSlug: 'tools' },
  { title: 'System', url: '/admin/system', icon: Shield, pageSlug: 'system' },
];

interface AdminNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminNav({ collapsed, onToggleCollapse }: AdminNavProps) {
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
    <aside className={cn(
      "fixed top-0 left-0 h-full border-r bg-background z-40 flex flex-col transition-all duration-200",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center h-14 border-b px-3 shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && <h1 className="text-sm font-semibold truncate">Admin</h1>}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleCollapse}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted",
                collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
              )
            }
            title={collapsed ? item.title : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t p-2 shrink-0">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start")}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}