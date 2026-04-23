import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Library, Trash2, Pencil, Save, X } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  target_type: string;
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
  updated_at: string;
}

export default function AudienceLibrary() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEmoji, setEditEmoji] = useState('🎯');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: presets, isLoading } = useQuery({
    queryKey: ['audience-presets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audience_presets').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Preset[];
    },
  });

  // Count usage across consumers
  const { data: usage } = useQuery({
    queryKey: ['audience-presets-usage'],
    queryFn: async () => {
      const [pb, hb, fc] = await Promise.all([
        supabase.from('promo_banners').select('audience_preset_id').not('audience_preset_id', 'is', null),
        supabase.from('home_banners').select('audience_preset_id').not('audience_preset_id', 'is', null),
        supabase.from('feed_channels').select('audience_preset_id').not('audience_preset_id', 'is', null),
      ]);
      const counts: Record<string, { promo: number; box: number; channel: number }> = {};
      const bump = (id: string | null, key: 'promo' | 'box' | 'channel') => {
        if (!id) return;
        counts[id] = counts[id] || { promo: 0, box: 0, channel: 0 };
        counts[id][key]++;
      };
      pb.data?.forEach((r: any) => bump(r.audience_preset_id, 'promo'));
      hb.data?.forEach((r: any) => bump(r.audience_preset_id, 'box'));
      fc.data?.forEach((r: any) => bump(r.audience_preset_id, 'channel'));
      return counts;
    },
  });

  const startEdit = (p: Preset) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.description ?? '');
    setEditEmoji(p.emoji);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('audience_presets')
      .update({ name: editName.trim(), description: editDesc.trim() || null, emoji: editEmoji.trim() || '🎯' })
      .eq('id', editingId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Audience updated' });
    qc.invalidateQueries({ queryKey: ['audience-presets'] });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('audience_presets').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Audience deleted', description: 'Linked banners and channels keep their inline settings.' });
    qc.invalidateQueries({ queryKey: ['audience-presets'] });
    qc.invalidateQueries({ queryKey: ['audience-presets-usage'] });
    setDeleteId(null);
  };

  const summarize = (p: Preset) => {
    const parts: string[] = [];
    if (p.target_type !== 'custom') parts.push(p.target_type === 'all' ? '🌍 All users' : '🎓 Enrolled');
    if (p.include_programs.length) parts.push(`+${p.include_programs.length} programs`);
    if (p.exclude_programs.length) parts.push(`-${p.exclude_programs.length} programs`);
    if (p.include_playlists.length) parts.push(`+${p.include_playlists.length} playlists`);
    if (p.include_tools.length) parts.push(`🛠️ ${p.include_tools.length} tools`);
    if (p.target_languages.length) parts.push(`🌐 ${p.target_languages.length} langs`);
    if (p.target_timezones.length) parts.push(`🕐 ${p.target_timezones.length} TZs`);
    if (p.target_instructor_ids.length) parts.push(`👩‍🏫 ${p.target_instructor_ids.length} instructors`);
    if (p.include_update_status.length) parts.push(`📱 ${p.include_update_status.join(', ')}`);
    return parts.join(' · ') || 'Empty audience';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Library className="h-6 w-6" /> Audience Library</h2>
        <p className="text-muted-foreground">
          Single source of truth for audience targeting. Reuse the same audience across promo banners, box banners, and channels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved audiences</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !presets?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">No saved audiences yet.</p>
              <p className="text-xs">Open any banner or channel, configure targeting, then click "Save current as preset".</p>
            </div>
          ) : (
            <div className="space-y-3">
              {presets.map((p) => {
                const u = usage?.[p.id];
                const total = (u?.promo ?? 0) + (u?.box ?? 0) + (u?.channel ?? 0);
                return (
                  <div key={p.id} className="border rounded-lg p-4 space-y-2">
                    {editingId === p.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <div>
                            <Label className="text-xs">Emoji</Label>
                            <Input value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} maxLength={4} />
                          </div>
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                        </div>
                        <Label className="text-xs">Description</Label>
                        <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium flex items-center gap-2">
                              <span className="text-lg">{p.emoji}</span> {p.name}
                              {total > 0 && <Badge variant="secondary">{total} in use</Badge>}
                            </div>
                            {p.description && <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>}
                            <p className="text-xs text-muted-foreground mt-2">{summarize(p)}</p>
                            {u && total > 0 && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Used by: {u.promo > 0 && `${u.promo} promo banner${u.promo === 1 ? '' : 's'}`}{u.promo > 0 && (u.box > 0 || u.channel > 0) && ' · '}
                                {u.box > 0 && `${u.box} box banner${u.box === 1 ? '' : 's'}`}{u.box > 0 && u.channel > 0 && ' · '}
                                {u.channel > 0 && `${u.channel} channel${u.channel === 1 ? '' : 's'}`}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(p)} title="Rename"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            💡 To edit the targeting itself (programs, languages, etc.), open any banner or channel that uses this preset, change the fields, then click "Update [preset name]".
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete audience preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Banners and channels currently linked to this preset will keep their inline targeting — they just won't be linked anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}