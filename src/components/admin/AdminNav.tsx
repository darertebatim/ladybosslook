import { LayoutDashboard, Users, Music, Send, UserCog, CreditCard, Shield, LogOut, MessageCircle, Newspaper, Wrench, Bell, PanelLeftClose, PanelLeft, Sparkles, Palette, FlaskConical, Smartphone, Image, Video, FileText, BookOpen, Brain, BarChart3, UserPlus, Library, Route as RouteIcon, Tags, TagsIcon, Aperture, Magnet, Presentation, ClipboardList, Clapperboard, ChevronDown, Settings as SettingsIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  pageSlug: string;
  end?: boolean;
}

const menuItems: NavItem[] = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard, end: true, pageSlug: 'overview' },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3, pageSlug: 'overview' },
  { title: 'Users', url: '/admin/users', icon: Users, pageSlug: 'users' },
  { title: 'Channels', url: '/admin/channels', icon: Newspaper, pageSlug: 'community' },
  { title: 'Communications', url: '/admin/communications', icon: Send, pageSlug: 'communications' },
  { title: 'Lead Center', url: '/admin/leads', icon: Magnet, pageSlug: 'communications' },
  { title: 'Push', url: '/admin/pn', icon: Bell, pageSlug: 'communications' },
  { title: 'Banners', url: '/admin/banners', icon: Image, pageSlug: 'communications' },
  { title: 'Audiences', url: '/admin/audiences', icon: Library, pageSlug: 'communications' },
  { title: 'Programs', url: '/admin/programs', icon: UserCog, pageSlug: 'programs' },
  { title: 'Forms', url: '/admin/forms', icon: ClipboardList, pageSlug: 'programs' },
  { title: 'Payments', url: '/admin/payments', icon: CreditCard, pageSlug: 'payments' },
  { title: 'Subscriptions', url: '/admin/subscriptions', icon: Sparkles, pageSlug: 'payments' },
  { title: 'Support', url: '/admin/support', icon: MessageCircle, pageSlug: 'support' },
  { title: 'Tools', url: '/admin/tools', icon: Wrench, pageSlug: 'tools' },
  { title: 'System', url: '/admin/system', icon: Shield, pageSlug: 'system' },
  { title: 'RiloBiz', url: '/admin/aperture', icon: Aperture, pageSlug: 'system' },
];

const mediaItems: NavItem[] = [
  { title: 'Instructors', url: '/admin/instructors', icon: UserPlus, pageSlug: 'users' },
  { title: 'Audio', url: '/admin/audio', icon: Music, pageSlug: 'audio' },
  { title: 'Video', url: '/admin/video', icon: Video, pageSlug: 'audio' },
  { title: 'Courses', url: '/admin/learn', icon: Presentation, pageSlug: 'programs' },
  { title: 'Documents', url: '/admin/documents', icon: FileText, pageSlug: 'system' },
  { title: 'Reading', url: '/admin/read', icon: BookOpen, pageSlug: 'tools' },
  { title: 'Quizzes', url: '/admin/quizzes', icon: Brain, pageSlug: 'tools' },
];

const settingsItems: NavItem[] = [
  { title: 'Onboarding', url: '/admin/onboarding', icon: FlaskConical, pageSlug: 'tools' },
  { title: 'My Rilo Engine', url: '/admin/my-rilo', icon: RouteIcon, pageSlug: 'tools' },
  { title: 'Content Tagging', url: '/admin/tags/content', icon: TagsIcon, pageSlug: 'tools' },
  { title: 'Brand', url: '/admin/brand', icon: Palette, pageSlug: 'system' },
  { title: 'App Test', url: '/admin/app', icon: Smartphone, pageSlug: 'system' },
];

interface AdminNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function UmbrellaGroup({
  label,
  icon: Icon,
  items,
  collapsed,
  active,
  open,
  onToggle,
}: {
  label: string;
  icon: any;
  items: NavItem[];
  collapsed: boolean;
  active: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? label : undefined}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted',
          collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
        {!collapsed && <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && (
        <div className={cn('space-y-0.5', !collapsed && 'ml-3 border-l pl-1')}>
          {items.map((m) => (
            <NavLink
              key={m.title}
              to={m.url}
              title={collapsed ? m.title : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted',
                  collapsed ? 'justify-center px-2 py-2' : 'px-3 py-1.5',
                  isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
                )
              }
            >
              <m.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{m.title}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminNav({ collapsed, onToggleCollapse }: AdminNavProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAccessAdminPage } = useAuth();
  const location = useLocation();

  const visibleMedia = mediaItems.filter((item) => canAccessAdminPage(item.pageSlug));
  const mediaActive = visibleMedia.some((i) => location.pathname.startsWith(i.url));
  const [mediaOpen, setMediaOpen] = useState(mediaActive);

  const visibleSettings = settingsItems.filter((item) => canAccessAdminPage(item.pageSlug));
  const settingsActive = visibleSettings.some((i) => location.pathname.startsWith(i.url));
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out'
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    }
  };

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter((item) => canAccessAdminPage(item.pageSlug));

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full border-r bg-background z-40 flex flex-col transition-all duration-200',
        collapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center h-14 border-b px-3 shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
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
          <div key={item.title}>
            <NavLink
              to={item.url}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted',
                  collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
            {item.title === 'Users' && visibleMedia.length > 0 && (
              <UmbrellaGroup
                label="Media"
                icon={Clapperboard}
                items={visibleMedia}
                collapsed={collapsed}
                active={mediaActive}
                open={mediaOpen}
                onToggle={() => setMediaOpen((o) => !o)}
              />
            )}
            {item.title === 'Tools' && visibleSettings.length > 0 && (
              <UmbrellaGroup
                label="Rilo Settings"
                icon={SettingsIcon}
                items={visibleSettings}
                collapsed={collapsed}
                active={settingsActive}
                open={settingsOpen}
                onToggle={() => setSettingsOpen((o) => !o)}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t p-2 shrink-0">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className={cn('w-full', collapsed ? 'justify-center px-2' : 'justify-start')}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
