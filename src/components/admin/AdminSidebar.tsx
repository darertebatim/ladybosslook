import { LayoutDashboard, Users, GraduationCap, Music, Send, UserCog, CreditCard, Shield, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Enrollment', url: '/admin/enrollment', icon: GraduationCap },
  { title: 'Audio', url: '/admin/audio', icon: Music },
  { title: 'Communications', url: '/admin/communications', icon: Send },
  { title: 'Programs', url: '/admin/programs', icon: UserCog },
  { title: 'Payments', url: '/admin/payments', icon: CreditCard },
  { title: 'System', url: '/admin/system', icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

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

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "text-center" : ""}>
            {isCollapsed ? "Admin" : "Admin Dashboard"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.end}
                      className={({ isActive }) => 
                        `flex items-center gap-3 hover:bg-muted/50 ${isActive ? 'bg-muted' : ''}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                          {!isCollapsed && (
                            <span className={isActive ? 'font-medium text-primary' : ''}>
                              {item.title}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size="sm"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
