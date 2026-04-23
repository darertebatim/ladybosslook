import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Library, Save, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TargetType } from './PromoAudienceSelector';

export interface AudiencePayload {
  target_type: TargetType;
  include_programs: string[];
  exclude_programs: string[];
  include_playlists: string[];
  exclude_playlists: string[];
  include_tools: string[];
  exclude_tools: string[];
  target_languages: string[];
  target_timezones: string[];
  include_update_status: string[];
  target_instructor_ids: string[];
}

interface Preset extends AudiencePayload {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
}

interface Props {
  /** Current audience values from the parent (used when saving a preset). */
  current: AudiencePayload;
  /** Currently linked preset id (if any). */
  presetId?: string | null;
  /** Called when the admin picks a preset — parent must hydrate its state. */
  onApplyPreset: (preset: Preset | null) => void;
}

const EMPTY_AUDIENCE: AudiencePayload = {
  target_type: 'all',
  include_programs: [],
  exclude_programs: [],
  include_playlists: [],
  exclude_playlists: [],
  include_tools: [],
  exclude_tools: [],
  target_languages: [],
  target_timezones: [],
  include_update_status: [],
  target_instructor_ids: [],
};

export function AudiencePresetPicker({ current, presetId, onApplyPreset }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [saving, setSaving] = useState(false);

  const { data: presets } = useQuery({
    queryKey: ['audience-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audience_presets')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Preset[];
    },
  });

  const linkedPreset = presets?.find((p) => p.id === presetId) ?? null;

  const handleSelect = (value: string) => {
    if (value === '__none__') {
      onApplyPreset(null);
      return;
    }
    const preset = presets?.find((p) => p.id === value);
    if (preset) onApplyPreset(preset);
  };

  const handleSavePreset = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Give your audience a name.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        emoji: emoji.trim() || '🎯',
        ...current,
        created_by: userData.user?.id ?? null,
      };
      const { data, error } = await supabase
        .from('audience_presets')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Audience saved', description: `"${name}" is now in your library.` });
      queryClient.invalidateQueries({ queryKey: ['audience-presets'] });
      setSaveOpen(false);
      setName('');
      setDescription('');
      setEmoji('🎯');
      // Auto-link the newly created preset
      if (data) onApplyPreset(data as Preset);
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.message?.includes('unique') ? 'An audience with this name already exists.' : err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLinked = async () => {
    if (!linkedPreset) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('audience_presets')
        .update({ ...current })
        .eq('id', linkedPreset.id);
      if (error) throw error;
      toast({ title: 'Audience updated', description: `"${linkedPreset.name}" now reflects current settings.` });
      queryClient.invalidateQueries({ queryKey: ['audience-presets'] });
    } catch (err: any) {
      toast({ title: 'Could not update', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-background">
      <div className="flex items-center gap-2">
        <Library className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Saved Audience</Label>
        {linkedPreset && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {linkedPreset.emoji} {linkedPreset.name}
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={presetId ?? '__none__'} onValueChange={handleSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Pick a saved audience…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— None (custom) —</SelectItem>
            {presets?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {linkedPreset ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleUpdateLinked} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Update "{linkedPreset.name}"
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onApplyPreset(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
            <Save className="h-3.5 w-3.5 mr-1" />
            Save current as preset
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Reuse the same audience across banners and channels. Edit it once in <a href="/admin/audiences" className="underline" target="_blank" rel="noreferrer">Audience Library</a>.
      </p>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save audience as preset</DialogTitle>
            <DialogDescription>
              Saves the current targeting settings so you can reuse them on other banners and channels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div>
                <Label className="text-xs">Emoji</Label>
                <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Persian iOS Users" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes for your team about who this audience is."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSavePreset} disabled={saving}>{saving ? 'Saving…' : 'Save preset'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { EMPTY_AUDIENCE };