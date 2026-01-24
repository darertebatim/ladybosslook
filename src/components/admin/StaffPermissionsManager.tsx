import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, User, UserCog, Loader2, ChevronRight, Bell, GraduationCap } from 'lucide-react';

const ADMIN_PAGES = [
  { slug: 'overview', label: 'Overview' },
  { slug: 'users', label: 'Users' },
  { slug: 'enrollment', label: 'Enrollment' },
  { slug: 'audio', label: 'Audio' },
  { slug: 'communications', label: 'Communications' },
  { slug: 'programs', label: 'Programs' },
  { slug: 'payments', label: 'Payments' },
  { slug: 'support', label: 'Support' },
  { slug: 'system', label: 'System' },
];

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  isAdmin: boolean;
  permissions: string[];
}

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  isAdmin: boolean;
  permissions: string[];
}

export function StaffPermissionsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [enrollingUserId, setEnrollingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch staff list on mount
  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    setLoadingStaff(true);
    try {
      // Get all admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      // Get all users with page permissions
      const { data: permissionsData } = await supabase
        .from('user_admin_permissions')
        .select('user_id, page_slug');

      // Collect unique user IDs
      const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);
      const staffIds = new Set(permissionsData?.map(p => p.user_id) || []);
      const allUserIds = [...new Set([...adminIds, ...staffIds])];

      if (allUserIds.length === 0) {
        setStaffList([]);
        setLoadingStaff(false);
        return;
      }

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', allUserIds);

      // Build staff list
      const staff: StaffMember[] = (profiles || []).map(profile => {
        const isAdmin = adminIds.has(profile.id);
        const userPermissions = permissionsData
          ?.filter(p => p.user_id === profile.id)
          .map(p => p.page_slug) || [];

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          isAdmin,
          permissions: isAdmin ? [] : userPermissions
        };
      });

      // Sort: admins first, then by name/email
      staff.sort((a, b) => {
        if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
        return (a.full_name || a.email).localeCompare(b.full_name || b.email);
      });

      setStaffList(staff);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedUser({
      id: staff.id,
      email: staff.email,
      full_name: staff.full_name,
      isAdmin: staff.isAdmin,
      permissions: staff.permissions
    });
    setSearchQuery('');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSelectedUser(null);
    
    try {
      // Search for user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${searchQuery}%`)
        .limit(1)
        .single();

      if (profileError || !profile) {
        toast({
          title: "User not found",
          description: "No user found with that email",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .single();

      const isAdmin = roleData?.role === 'admin';

      // Get user's current permissions
      const { data: permissionsData } = await supabase
        .from('user_admin_permissions')
        .select('page_slug')
        .eq('user_id', profile.id);

      setSelectedUser({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        isAdmin,
        permissions: permissionsData?.map(p => p.page_slug) || []
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      if (selectedUser.isAdmin) {
        // Remove admin role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);
        
        setSelectedUser({ ...selectedUser, isAdmin: false });
        toast({
          title: "Admin access removed",
          description: `${selectedUser.email} is no longer an admin`
        });
      } else {
        // Grant admin role - use insert (not upsert) since unique is on (user_id, role)
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: selectedUser.id, 
            role: 'admin' 
          });
        
        if (insertError) {
          console.error('Insert admin role error:', insertError);
          throw insertError;
        }
        
        // Clear page permissions since admin has full access
        await supabase
          .from('user_admin_permissions')
          .delete()
          .eq('user_id', selectedUser.id);
        
        setSelectedUser({ ...selectedUser, isAdmin: true, permissions: [] });
        toast({
          title: "Admin access granted",
          description: `${selectedUser.email} is now an admin with full access`
        });
      }
      
      // Refresh staff list
      fetchStaffList();
    } catch (error) {
      console.error('Toggle admin error:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (pageSlug: string) => {
    if (!selectedUser || selectedUser.isAdmin) return;
    
    setSaving(true);
    try {
      const hasPermission = selectedUser.permissions.includes(pageSlug);
      
      if (hasPermission) {
        // Remove permission
        await supabase
          .from('user_admin_permissions')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('page_slug', pageSlug);
        
        setSelectedUser({
          ...selectedUser,
          permissions: selectedUser.permissions.filter(p => p !== pageSlug)
        });
      } else {
        // Add permission
        await supabase
          .from('user_admin_permissions')
          .insert({ user_id: selectedUser.id, page_slug: pageSlug });
        
        setSelectedUser({
          ...selectedUser,
          permissions: [...selectedUser.permissions, pageSlug]
        });
      }
      
      toast({
        title: "Permission updated",
        description: `${pageSlug} access ${hasPermission ? 'removed' : 'granted'}`
      });
      
      // Refresh staff list
      fetchStaffList();
    } catch (error) {
      console.error('Toggle permission error:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (user: { isAdmin: boolean; permissions: string[] }) => {
    if (user.isAdmin) {
      return <Badge className="bg-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    
    if (user.permissions.length > 0) {
      return <Badge variant="secondary"><UserCog className="h-3 w-3 mr-1" />Staff</Badge>;
    }
    
    return <Badge variant="outline"><User className="h-3 w-3 mr-1" />User</Badge>;
  };

  const getPermissionLabels = (permissions: string[]) => {
    return permissions
      .filter(slug => slug !== 'support_notifications')
      .map(slug => ADMIN_PAGES.find(p => p.slug === slug)?.label || slug)
      .join(', ');
  };

  const hasNotificationPermission = (permissions: string[]) => {
    return permissions.includes('support_notifications');
  };

  const handleToggleNotifications = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const hasPermission = selectedUser.permissions.includes('support_notifications');
      
      if (hasPermission) {
        await supabase
          .from('user_admin_permissions')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('page_slug', 'support_notifications');
        
        setSelectedUser({
          ...selectedUser,
          permissions: selectedUser.permissions.filter(p => p !== 'support_notifications')
        });
      } else {
        await supabase
          .from('user_admin_permissions')
          .insert({ user_id: selectedUser.id, page_slug: 'support_notifications' });
        
        setSelectedUser({
          ...selectedUser,
          permissions: [...selectedUser.permissions, 'support_notifications']
        });
      }
      
      toast({
        title: "Notification setting updated",
        description: hasPermission ? 'Will no longer receive chat notifications' : 'Will now receive chat notifications'
      });
      
      fetchStaffList();
    } catch (error) {
      console.error('Toggle notifications error:', error);
      toast({
        title: "Error",
        description: "Failed to update notification setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollAllPrograms = async (userId: string, userEmail: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEnrollingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-enroll-all-programs', {
        body: { targetUserId: userId }
      });

      if (error) throw error;

      toast({
        title: "Enrolled Successfully",
        description: `${userEmail}: ${data.message}`
      });
    } catch (error: any) {
      console.error('Enroll error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in all programs",
        variant: "destructive"
      });
    } finally {
      setEnrollingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Staff Permissions Manager
        </CardTitle>
        <CardDescription>
          Search for a user to manage their admin access and page permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Staff List */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            Current Staff {!loadingStaff && `(${staffList.length})`}
          </h3>
          {loadingStaff ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : staffList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No staff members with permissions yet
            </p>
          ) : (
            <div className="border rounded-lg divide-y">
              {staffList.map(staff => (
                <div
                  key={staff.id}
                  className={`flex items-center justify-between p-3 hover:bg-muted/50 transition-colors ${
                    selectedUser?.id === staff.id ? 'bg-muted' : ''
                  }`}
                >
                  <button
                    onClick={() => handleSelectStaff(staff)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {staff.full_name || 'No name'}
                      </p>
                      {getRoleBadge(staff)}
                      {hasNotificationPermission(staff.permissions) && (
                        <Bell className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {staff.email}
                    </p>
                    {!staff.isAdmin && staff.permissions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPermissionLabels(staff.permissions)}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEnrollAllPrograms(staff.id, staff.email, e)}
                      disabled={enrollingUserId === staff.id}
                      title="Enroll in All Programs"
                    >
                      {enrollingUserId === staff.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GraduationCap className="h-4 w-4" />
                      )}
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Details */}
        {selectedUser && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedUser.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                {getRoleBadge(selectedUser)}
              </div>

              {/* Admin Toggle */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label htmlFor="admin-toggle" className="font-medium">Full Admin Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Grants access to all admin pages
                  </p>
                </div>
                <Switch
                  id="admin-toggle"
                  checked={selectedUser.isAdmin}
                  onCheckedChange={handleToggleAdmin}
                  disabled={saving}
                />
              </div>

              {/* Notification Settings */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label htmlFor="notifications-toggle" className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    Receive Support Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications when users send support messages
                  </p>
                </div>
                <Switch
                  id="notifications-toggle"
                  checked={selectedUser.permissions.includes('support_notifications')}
                  onCheckedChange={handleToggleNotifications}
                  disabled={saving}
                />
              </div>

              {/* Enroll in All Programs */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label className="font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Enroll in All Programs
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enroll this user in all active programs and rounds
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEnrollAllPrograms(selectedUser.id, selectedUser.email)}
                  disabled={enrollingUserId === selectedUser.id}
                >
                  {enrollingUserId === selectedUser.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <GraduationCap className="h-4 w-4 mr-2" />
                  )}
                  Enroll Now
                </Button>
              </div>

              {/* Page Permissions */}
              {!selectedUser.isAdmin && (
                <div className="border-t pt-4">
                  <Label className="font-medium">Page Permissions</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which admin pages this user can access
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ADMIN_PAGES.map(page => (
                      <div key={page.slug} className="flex items-center space-x-2">
                        <Checkbox
                          id={`page-${page.slug}`}
                          checked={selectedUser.permissions.includes(page.slug)}
                          onCheckedChange={() => handleTogglePermission(page.slug)}
                          disabled={saving}
                        />
                        <Label 
                          htmlFor={`page-${page.slug}`}
                          className="text-sm cursor-pointer"
                        >
                          {page.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}