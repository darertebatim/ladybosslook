import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Send, AlertTriangle, CheckCircle, Users, Megaphone, Bell, BellOff } from 'lucide-react';

interface VersionStats {
  version: string;
  count: number;
}

export function UpdateNotificationSender() {
  const queryClient = useQueryClient();
  const [targetVersion, setTargetVersion] = useState('');
  const [title, setTitle] = useState('Update Available 🚀');
  const [body, setBody] = useState('A new version is ready! Update now for the best experience.');

  // Banner form state
  const [bannerTitle, setBannerTitle] = useState('🆕 Update Available');
  const [bannerDescription, setBannerDescription] = useState('Tap to update to the latest version with new features!');
  const [bannerButtonText, setBannerButtonText] = useState('Update Now');

  // Fetch version distribution from push_subscriptions
  const { data: versionStats, isLoading: loadingStats } = useQuery({
    queryKey: ['push-version-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('app_version')
        .like('endpoint', 'native:%');

      if (error) throw error;

      // Group by version
      const counts: Record<string, number> = {};
      data?.forEach((sub) => {
        const v = sub.app_version || 'unknown';
        counts[v] = (counts[v] || 0) + 1;
      });

      // Convert to array and sort
      const stats: VersionStats[] = Object.entries(counts)
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => {
          if (a.version === 'unknown') return 1;
          if (b.version === 'unknown') return -1;
          return a.version.localeCompare(b.version, undefined, { numeric: true });
        });

      return stats;
    },
    refetchInterval: 30000,
  });

  // Fetch latest iOS version from app_settings
  const { data: latestVersion } = useQuery({
    queryKey: ['latest-ios-version'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'latest_ios_version')
        .maybeSingle();
      return data?.value || '';
    },
  });

  // Count users without push notifications (for banner targeting)
  const { data: usersWithoutPush } = useQuery({
    queryKey: ['users-without-push'],
    queryFn: async () => {
      // Get total active users with recent activity
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Get users with push subscriptions
      const { data: pushUsers } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .like('endpoint', 'native:%');

      const pushUserCount = new Set(pushUsers?.map(p => p.user_id)).size;
      
      return {
        total: totalUsers || 0,
        withPush: pushUserCount,
        withoutPush: (totalUsers || 0) - pushUserCount,
      };
    },
  });

  // Dry run mutation
  const dryRunMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-update-push-notification', {
        body: { targetVersion, title, body, dryRun: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.info(`Dry run complete: ${data.totalOutdated} users would receive notification`);
    },
    onError: (error: any) => {
      toast.error('Dry run failed: ' + error.message);
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-update-push-notification', {
        body: { targetVersion, title, body, dryRun: false },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sent to ${data.sent} users (${data.failed} failed)`);
    },
    onError: (error: any) => {
      toast.error('Send failed: ' + error.message);
    },
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('home_banners')
        .insert({
          title: bannerTitle,
          description: bannerDescription,
          button_text: bannerButtonText,
          button_url: 'https://apps.apple.com/app/simora-ladybosslook/id6755076134',
          is_active: true,
          priority: 100, // High priority
          icon: 'sparkles',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Update banner created and is now live on the home screen');
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
    },
    onError: (error: any) => {
      toast.error('Failed to create banner: ' + error.message);
    },
  });

  const totalDevices = versionStats?.reduce((sum, v) => sum + v.count, 0) || 0;
  const outdatedCount = versionStats
    ?.filter((v) => {
      if (!targetVersion || v.version === 'unknown') return true;
      return v.version < targetVersion;
    })
    .reduce((sum, v) => sum + v.count, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Version Distribution
          </CardTitle>
          <CardDescription>
            Current app versions across {totalDevices} registered devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading stats...
            </div>
          ) : versionStats?.length ? (
            <div className="flex flex-wrap gap-2">
              {versionStats.map((stat) => (
                <Badge
                  key={stat.version}
                  variant={stat.version === latestVersion ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {stat.version === latestVersion && <CheckCircle className="h-3 w-3 mr-1" />}
                  v{stat.version}: {stat.count} users
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No version data available yet</p>
          )}

          {latestVersion && (
            <p className="text-sm text-muted-foreground mt-4">
              Latest version in App Store: <strong>v{latestVersion}</strong>
            </p>
          )}

          {usersWithoutPush && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span><strong>{usersWithoutPush.withPush}</strong> users with push</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BellOff className="h-4 w-4" />
                <span><strong>{usersWithoutPush.withoutPush}</strong> without push (need banner)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Update Push Notification
          </CardTitle>
          <CardDescription>
            Push notification to users on outdated versions (who have push enabled)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetVersion">Target Version (send to users below this)</Label>
            <Input
              id="targetVersion"
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              placeholder={latestVersion || '1.1.08'}
            />
            {targetVersion && (
              <p className="text-sm text-muted-foreground">
                Will send to <strong>{outdatedCount}</strong> users below v{targetVersion}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Notification Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => dryRunMutation.mutate()}
              disabled={!targetVersion || dryRunMutation.isPending}
            >
              {dryRunMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Preview (Dry Run)
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!targetVersion || sendMutation.isPending}
            >
              {sendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send to {outdatedCount} Users
            </Button>
          </div>

          {outdatedCount === 0 && targetVersion && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              No users found below version {targetVersion}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Create Update Banner
          </CardTitle>
          <CardDescription>
            For users without push notifications enabled, show a banner on the home screen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bannerTitle">Banner Title</Label>
            <Input
              id="bannerTitle"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerDescription">Banner Description</Label>
            <Textarea
              id="bannerDescription"
              value={bannerDescription}
              onChange={(e) => setBannerDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerButtonText">Button Text</Label>
            <Input
              id="bannerButtonText"
              value={bannerButtonText}
              onChange={(e) => setBannerButtonText(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Button will link to the App Store. Banner will be shown to all users on the home screen.
          </p>

          <Button
            onClick={() => createBannerMutation.mutate()}
            disabled={createBannerMutation.isPending || !bannerTitle}
            className="w-full"
          >
            {createBannerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Megaphone className="h-4 w-4 mr-2" />
            Create Update Banner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
