import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, User, UserCog, Loader2 } from 'lucide-react';

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

export function StaffPermissionsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const { toast } = useToast();

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
        // Grant admin role
        await supabase
          .from('user_roles')
          .upsert({ 
            user_id: selectedUser.id, 
            role: 'admin' 
          }, { 
            onConflict: 'user_id' 
          });
        
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

  const getRoleBadge = () => {
    if (!selectedUser) return null;
    
    if (selectedUser.isAdmin) {
      return <Badge className="bg-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    
    if (selectedUser.permissions.length > 0) {
      return <Badge variant="secondary"><UserCog className="h-3 w-3 mr-1" />Staff</Badge>;
    }
    
    return <Badge variant="outline"><User className="h-3 w-3 mr-1" />User</Badge>;
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
                {getRoleBadge()}
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