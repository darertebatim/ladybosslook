import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2, Send, AlertTriangle, CheckCircle, Users, Megaphone, Bell, BellOff,
  Download, Sparkles, Info,
} from 'lucide-react';

type Platform = 'ios' | 'android';

interface VersionStats {
  version: string;
  count: number;
}

interface Props {
  platform: Platform;
}

const PLATFORM_META: Record<Platform, {
  label: string;
  storeName: string;
  storeUrl: string;
  settingKey: string;
  emoji: string;
}> = {
  ios: {
    label: 'iOS',
    storeName: 'App Store',
    storeUrl: 'https://apps.apple.com/app/routine-ladybosslook/id6755076134',
    settingKey: 'latest_ios_version',
    emoji: '🍎',
  },
  android: {
    label: 'Android',
    storeName: 'Google Play',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.ladybosslook.academy',
    settingKey: 'latest_android_version',
    emoji: '🤖',
  },
};

export function PlatformUpdatePanel({ platform }: Props) {
  const meta = PLATFORM_META[platform];
  const queryClient = useQueryClient();

  const [targetVersion, setTargetVersion] = useState('');
  const [title, setTitle] = useState(`Update Available 🚀`);
  const [body, setBody] = useState('A new version is ready! Update now for the best experience.');

  const [bannerTitle, setBannerTitle] = useState('🆕 Update Available');
  const [bannerDescription, setBannerDescription] = useState(
    'Tap to update to the latest version with new features!'
  );
  const [bannerButtonText, setBannerButtonText] = useState('Update Now');

  const [popupTitle, setPopupTitle] = useState('New Update Available! 🎉');
  const [popupDescription, setPopupDescription] = useState(
    'A new version is ready with exciting features and improvements. Update now for the best experience!'
  );
  const [popupButtonText, setPopupButtonText] = useState('Update Now');

  // Fetch version distribution for this platform.
  // For iOS, also include legacy null-platform rows (pre-tagging fleet was iOS-dominant).
  const { data: versionStats, isLoading: loadingStats } = useQuery({
    queryKey: ['push-version-stats', platform],
    queryFn: async () => {
      let query = supabase
        .from('push_subscriptions')
        .select('app_version, platform')
        .like('endpoint', 'native:%');

      if (platform === 'ios') {
        query = query.or('platform.eq.ios,platform.is.null');
      } else {
        query = query.eq('platform', 'android');
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      let unknownPlatformCount = 0;
      data?.forEach((sub: any) => {
        const v = sub.app_version || 'unknown';
        counts[v] = (counts[v] || 0) + 1;
        if (platform === 'ios' && !sub.platform) unknownPlatformCount++;
      });

      const stats: VersionStats[] = Object.entries(counts)
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => {
          if (a.version === 'unknown') return 1;
          if (b.version === 'unknown') return -1;
          return a.version.localeCompare(b.version, undefined, { numeric: true });
        });

      return { stats, unknownPlatformCount };
    },
    refetchInterval: 30000,
  });

  // Fetch latest version override (per platform)
  const { data: latestVersion, refetch: refetchLatest } = useQuery({
    queryKey: ['latest-version', platform],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', meta.settingKey)
        .maybeSingle();
      return data?.value || '';
    },
  });

  const [latestInput, setLatestInput] = useState('');

  const saveLatestMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', meta.settingKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value })
          .eq('key', meta.settingKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({
            key: meta.settingKey,
            value,
            description: `Latest ${meta.label} app version`,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Latest ${meta.label} version saved`);
      refetchLatest();
    },
    onError: (e: any) => toast.error('Save failed: ' + e.message),
  });

  // Push KPI: how many users have push for this platform vs total
  const { data: pushCounts } = useQuery({
    queryKey: ['platform-push-counts', platform],
    queryFn: async () => {
      let q = supabase
        .from('push_subscriptions')
        .select('user_id, platform', { count: 'exact' })
        .like('endpoint', 'native:%');
      if (platform === 'ios') q = q.or('platform.eq.ios,platform.is.null');
      else q = q.eq('platform', 'android');

      const { data, count } = await q;
      const uniqueUsers = new Set(data?.map((d: any) => d.user_id)).size;
      return { devices: count || 0, users: uniqueUsers };
    },
  });

  // Dry run mutation
  const dryRunMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'send-update-push-notification',
        { body: { targetVersion, title, body, dryRun: true, platform } }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.info(`Dry run: ${data.totalOutdated} ${meta.label} users would receive it`);
    },
    onError: (error: any) => toast.error('Dry run failed: ' + error.message),
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'send-update-push-notification',
        { body: { targetVersion, title, body, dryRun: false, platform } }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sent to ${data.sent} ${meta.label} users (${data.failed} failed)`);
    },
    onError: (error: any) => toast.error('Send failed: ' + error.message),
  });

  // Banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('home_banners')
        .insert({
          title: bannerTitle,
          description: bannerDescription,
          button_text: bannerButtonText,
          button_url: meta.storeUrl,
          is_active: true,
          priority: 100,
          icon: 'sparkles',
          target_below_version: targetVersion || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        `${meta.label} update banner created${
          targetVersion ? ` (visible to users below v${targetVersion})` : ' (visible to all users)'
        }`
      );
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
    },
    onError: (e: any) => toast.error('Failed to create banner: ' + e.message),
  });

  // Popup config (per platform — keys are namespaced)
  const popupSettingsKey =
    platform === 'ios' ? 'app_update_popup' : 'app_update_popup_android';

  const { data: currentPopup } = useQuery({
    queryKey: ['app-update-popup-config', platform],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', popupSettingsKey)
        .maybeSingle();
      if (!data?.value) return null;
      try {
        return JSON.parse(data.value);
      } catch {
        return null;
      }
    },
  });

  const activatePopupMutation = useMutation({
    mutationFn: async () => {
      const config = {
        id: crypto.randomUUID(),
        title: popupTitle,
        description: popupDescription,
        buttonText: popupButtonText,
        platform,
        active: true,
      };

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', popupSettingsKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: JSON.stringify(config) })
          .eq('key', popupSettingsKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({
            key: popupSettingsKey,
            value: JSON.stringify(config),
            description: `${meta.label} app update popup`,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`${meta.label} update popup activated.`);
      queryClient.invalidateQueries({ queryKey: ['app-update-popup-config', platform] });
    },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });

  const deactivatePopupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: JSON.stringify({ ...currentPopup, active: false }) })
        .eq('key', popupSettingsKey);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Popup deactivated');
      queryClient.invalidateQueries({ queryKey: ['app-update-popup-config', platform] });
    },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });

  const totalDevices = versionStats?.stats.reduce((sum, v) => sum + v.count, 0) || 0;
  const outdatedCount =
    versionStats?.stats
      .filter((v) => {
        if (!targetVersion || v.version === 'unknown') return true;
        return v.version < targetVersion;
      })
      .reduce((sum, v) => sum + v.count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Latest version override (Android needs this; iOS optionally) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Latest {meta.label} Version
          </CardTitle>
          <CardDescription>
            {platform === 'android'
              ? 'Google Play has no public lookup API — set the latest version here so the in-app update check works.'
              : 'Auto-fetched from the App Store. Override here if needed.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={latestInput || latestVersion || ''}
              onChange={(e) => setLatestInput(e.target.value)}
              placeholder="e.g. 1.2.0"
            />
            <Button
              onClick={() => saveLatestMutation.mutate(latestInput || latestVersion || '')}
              disabled={saveLatestMutation.isPending || !(latestInput || latestVersion)}
            >
              {saveLatestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
          {latestVersion && (
            <p className="text-xs text-muted-foreground">
              Currently saved: <strong>v{latestVersion}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Version distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {meta.label} Version Distribution
          </CardTitle>
          <CardDescription>
            {totalDevices} {meta.label} devices with push enabled
            {pushCounts ? ` · ${pushCounts.users} unique users` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading stats...
            </div>
          ) : versionStats?.stats.length ? (
            <div className="flex flex-wrap gap-2">
              {versionStats.stats.map((stat) => (
                <Badge
                  key={stat.version}
                  variant={stat.version === latestVersion ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {stat.version === latestVersion && <CheckCircle className="h-3 w-3 mr-1" />}
                  v{stat.version}: {stat.count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No version data yet.</p>
          )}

          {platform === 'ios' && (versionStats?.unknownPlatformCount || 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              {versionStats!.unknownPlatformCount} legacy device(s) without a platform tag are
              counted here. They'll be re-tagged as users reopen the app.
            </p>
          )}

          {platform === 'android' && totalDevices === 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              No tagged Android devices yet. Newly opened Android apps will register their platform
              automatically over the next few days.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Send push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Update Push to {meta.label}
          </CardTitle>
          <CardDescription>
            Push notification to {meta.label} users on outdated versions (push enabled)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`targetVersion-${platform}`}>Target version (send to users below this)</Label>
            <Input
              id={`targetVersion-${platform}`}
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              placeholder={latestVersion || '1.1.08'}
            />
            {targetVersion && (
              <p className="text-sm text-muted-foreground">
                Will send to <strong>{outdatedCount}</strong> {meta.label} users below v{targetVersion}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notification Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Notification Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
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
              No {meta.label} users found below version {targetVersion}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Create Update Banner
          </CardTitle>
          <CardDescription>
            For users without push enabled. Links to the {meta.storeName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Banner Title</Label>
            <Input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Banner Description</Label>
            <Textarea
              value={bannerDescription}
              onChange={(e) => setBannerDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input value={bannerButtonText} onChange={(e) => setBannerButtonText(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Banner is shown to all users (no platform filter on home_banners).
            {targetVersion ? ` Limited to users below v${targetVersion}.` : ''}
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

      {/* Popup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {meta.label} App Update Popup
            {currentPopup?.active && (
              <Badge variant="default" className="ml-2">
                Active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Centered popup shown on app open — links to the {meta.storeName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Popup Title</Label>
            <Input value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Popup Description</Label>
            <Textarea
              value={popupDescription}
              onChange={(e) => setPopupDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input value={popupButtonText} onChange={(e) => setPopupButtonText(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Only shown on {meta.label} devices.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => activatePopupMutation.mutate()}
              disabled={activatePopupMutation.isPending || !popupTitle}
              className="flex-1"
            >
              {activatePopupMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Sparkles className="h-4 w-4 mr-2" />
              {currentPopup?.active ? 'Update & Reactivate' : 'Activate Popup'}
            </Button>
            {currentPopup?.active && (
              <Button
                variant="outline"
                onClick={() => deactivatePopupMutation.mutate()}
                disabled={deactivatePopupMutation.isPending}
              >
                Deactivate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
