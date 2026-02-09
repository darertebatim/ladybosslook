import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePNConfig, useUpdatePNConfig, type PNConfig } from '@/hooks/usePNConfig';
import { ChevronDown, ChevronUp, Clock, Bell, Save, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_LABELS: Record<string, string> = {
  daily: '📅 Daily',
  time_period: '⏰ Time Periods',
  goal_nudge: '💧 Goal Nudges',
  weekly: '📊 Weekly',
  momentum: '🔥 Momentum',
};

const CATEGORY_ORDER = ['daily', 'time_period', 'goal_nudge', 'weekly', 'momentum'];

export function PNConfigEditor() {
  const { configs, isLoading, error, refetch, lastSyncedAt } = usePNConfig();
  const { updateConfig, isUpdating } = useUpdatePNConfig();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<Partial<PNConfig> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Group configs by category
  const groupedConfigs = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = configs.filter(c => c.category === category);
    return acc;
  }, {} as Record<string, PNConfig[]>);

  // Send silent push to sync config to all devices
  const handleSyncToDevices = async () => {
    setIsSyncing(true);
    try {
      const { data, error: syncError } = await supabase.functions.invoke('sync-pn-config');
      
      if (syncError) throw syncError;
      
      toast.success(`Synced to ${data.sent} devices`, {
        description: data.failed > 0 ? `${data.failed} failed` : undefined,
      });
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Failed to sync to devices');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleEnabled = async (config: PNConfig) => {
    const success = await updateConfig(config.id, { is_enabled: !config.is_enabled });
    if (success) {
      toast.success(`${config.title} ${config.is_enabled ? 'disabled' : 'enabled'}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingConfig || !expandedId) return;
    
    const success = await updateConfig(expandedId, editingConfig);
    if (success) {
      toast.success('Notification updated');
      setEditingConfig(null);
    }
  };

  const startEditing = (config: PNConfig) => {
    setEditingConfig({
      title: config.title,
      body: config.body,
      emoji: config.emoji,
      schedule_hour: config.schedule_hour,
      schedule_minute: config.schedule_minute,
      is_urgent: config.is_urgent,
    });
    setExpandedId(config.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          {configs.length} notification configs
          {lastSyncedAt && (
            <span className="ml-2">
              • Last synced: {lastSyncedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSyncToDevices} 
            disabled={isSyncing}
          >
            <Send className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
            Sync to Devices
          </Button>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {CATEGORY_ORDER.map(category => {
        const categoryConfigs = groupedConfigs[category] || [];
        if (categoryConfigs.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                {CATEGORY_LABELS[category] || category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryConfigs.map(config => {
                const isExpanded = expandedId === config.id;
                const editing = isExpanded ? editingConfig : null;

                return (
                  <Collapsible
                    key={config.id}
                    open={isExpanded}
                    onOpenChange={(open) => {
                      if (open) {
                        startEditing(config);
                      } else {
                        setExpandedId(null);
                        setEditingConfig(null);
                      }
                    }}
                  >
                    <div className={`border rounded-lg p-3 ${!config.is_enabled ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{config.emoji}</span>
                          <div>
                            <div className="font-medium text-sm">{config.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {String(config.schedule_hour).padStart(2, '0')}:{String(config.schedule_minute).padStart(2, '0')}
                              {config.is_urgent && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                  URGENT
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.is_enabled}
                            onCheckedChange={() => handleToggleEnabled(config)}
                            disabled={isUpdating}
                          />
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      <CollapsibleContent className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="emoji">Emoji</Label>
                            <Input
                              id="emoji"
                              value={editing?.emoji ?? config.emoji}
                              onChange={(e) => setEditingConfig(prev => ({ ...prev, emoji: e.target.value }))}
                              className="w-20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={editing?.title ?? config.title}
                              onChange={(e) => setEditingConfig(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="body">Message Body</Label>
                          <Input
                            id="body"
                            value={editing?.body ?? config.body}
                            onChange={(e) => setEditingConfig(prev => ({ ...prev, body: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hour">Hour (0-23)</Label>
                            <Input
                              id="hour"
                              type="number"
                              min={0}
                              max={23}
                              value={editing?.schedule_hour ?? config.schedule_hour}
                              onChange={(e) => setEditingConfig(prev => ({ ...prev, schedule_hour: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="minute">Minute (0-59)</Label>
                            <Input
                              id="minute"
                              type="number"
                              min={0}
                              max={59}
                              value={editing?.schedule_minute ?? config.schedule_minute}
                              onChange={(e) => setEditingConfig(prev => ({ ...prev, schedule_minute: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Urgent Mode</Label>
                            <div className="flex items-center h-10">
                              <Switch
                                checked={editing?.is_urgent ?? config.is_urgent}
                                onCheckedChange={(checked) => setEditingConfig(prev => ({ ...prev, is_urgent: checked }))}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExpandedId(null);
                              setEditingConfig(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">How Hybrid Notifications Work</p>
              <p className="text-muted-foreground mt-1">
                Changes you make here are synced to all user devices in real-time. 
                The app schedules <strong>local notifications</strong> based on this config,
                so notifications work even offline — but you control the content and timing from here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
