import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { PromoAudienceSelector, type TargetType } from './PromoAudienceSelector';
import type { Preset } from './AudiencePresetPicker';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preset: Preset | null;
}

export function AudienceEditorDialog({ open, onOpenChange, preset }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('custom');
  const [includePrograms, setIncludePrograms] = useState<string[]>([]);
  const [excludePrograms, setExcludePrograms] = useState<string[]>([]);
  const [includePlaylists, setIncludePlaylists] = useState<string[]>([]);
  const [excludePlaylists, setExcludePlaylists] = useState<string[]>([]);
  const [includeTools, setIncludeTools] = useState<string[]>([]);
  const [excludeTools, setExcludeTools] = useState<string[]>([]);
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [targetTimezones, setTargetTimezones] = useState<string[]>([]);
  const [includeUpdateStatus, setIncludeUpdateStatus] = useState<string[]>([]);
  const [targetInstructorIds, setTargetInstructorIds] = useState<string[]>([]);
  const [includeForms, setIncludeForms] = useState<string[]>([]);
  const [excludeForms, setExcludeForms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState<{ users: number; devices: number | null } | null>(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(preset?.name ?? '');
    setEmoji(preset?.emoji ?? '🎯');
    setDescription(preset?.description ?? '');
    setTargetType((preset?.target_type as TargetType) ?? 'custom');
    setIncludePrograms(preset?.include_programs ?? []);
    setExcludePrograms(preset?.exclude_programs ?? []);
    setIncludePlaylists(preset?.include_playlists ?? []);
    setExcludePlaylists(preset?.exclude_playlists ?? []);
    setIncludeTools(preset?.include_tools ?? []);
    setExcludeTools(preset?.exclude_tools ?? []);
    setTargetLanguages(preset?.target_languages ?? []);
    setTargetTimezones(preset?.target_timezones ?? []);
    setIncludeUpdateStatus(preset?.include_update_status ?? []);
    setTargetInstructorIds(preset?.target_instructor_ids ?? []);
    setIncludeForms(preset?.include_forms ?? []);
    setExcludeForms(preset?.exclude_forms ?? []);
    setCount(null);
  }, [open, preset]);

  const payload = () => ({
    target_type: targetType,
    include_programs: includePrograms,
    exclude_programs: excludePrograms,
    include_playlists: includePlaylists,
    exclude_playlists: excludePlaylists,
    include_tools: includeTools,
    exclude_tools: excludeTools,
    target_languages: targetLanguages,
    target_timezones: targetTimezones,
    include_update_status: includeUpdateStatus,
    target_instructor_ids: targetInstructorIds,
    include_forms: includeForms,
    exclude_forms: excludeForms,
  });

  const checkCount = async () => {
    setCounting(true);
    try {
      const { data, error } = await supabase.functions.invoke('preview-audience-recipients', {
        body: { audience: payload(), channel: 'push' },
      });
      if (error) throw error;
      setCount({ users: data.matched_users ?? 0, devices: data.devices_total ?? null });
    } catch (e: any) {
      toast({ title: 'Could not count', description: e.message, variant: 'destructive' });
    } finally {
      setCounting(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const row = { name: name.trim(), emoji: emoji.trim() || '🎯', description: description.trim() || null, ...payload() };
      if (preset) {
        const { error } = await supabase.from('audience_presets').update(row as any).eq('id', preset.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from('audience_presets').insert({ ...row, created_by: u.user?.id ?? null } as any);
        if (error) throw error;
      }
      toast({ title: preset ? 'Audience updated' : 'Audience created' });
      qc.invalidateQueries({ queryKey: ['audience-presets'] });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: 'Could not save',
        description: e?.message?.includes('unique') ? 'An audience with this name already exists.' : e.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{preset ? `Edit "${preset.name}"` : 'New audience'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div>
              <Label className="text-xs">Emoji</Label>
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Smart IG — no analysis form" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <PromoAudienceSelector
            targetType={targetType} setTargetType={setTargetType}
            includePrograms={includePrograms} setIncludePrograms={setIncludePrograms}
            excludePrograms={excludePrograms} setExcludePrograms={setExcludePrograms}
            includePlaylists={includePlaylists} setIncludePlaylists={setIncludePlaylists}
            excludePlaylists={excludePlaylists} setExcludePlaylists={setExcludePlaylists}
            includeTools={includeTools} setIncludeTools={setIncludeTools}
            excludeTools={excludeTools} setExcludeTools={setExcludeTools}
            targetLanguages={targetLanguages} setTargetLanguages={setTargetLanguages}
            targetTimezones={targetTimezones} setTargetTimezones={setTargetTimezones}
            includeUpdateStatus={includeUpdateStatus} setIncludeUpdateStatus={setIncludeUpdateStatus}
            targetInstructorIds={targetInstructorIds} setTargetInstructorIds={setTargetInstructorIds}
            includeForms={includeForms} setIncludeForms={setIncludeForms}
            excludeForms={excludeForms} setExcludeForms={setExcludeForms}
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={checkCount} disabled={counting}>
              <Users className="h-4 w-4 mr-1" /> {counting ? 'Counting…' : 'Count people'}
            </Button>
            {count && (
              <span className="text-sm">
                <strong>{count.users}</strong> people{count.devices !== null && <> · {count.devices} devices</>}
              </span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save audience'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
