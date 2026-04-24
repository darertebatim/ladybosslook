import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Copy, Pencil, Trash2, Search, X, GraduationCap, ListMusic, Sparkles, Gift, MessageCircle } from 'lucide-react';
import { buildInstructorOneLink } from '@/lib/appsflyer';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { InstructorPackagesManager } from '@/components/admin/InstructorPackagesManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Instructor {
  id: string;
  slug: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  default_program_slug: string | null;
  default_routine_ids: string[];
  default_playlist_ids: string[];
  default_channel_ids: string[];
  plus_trial_days: number;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  slug: '',
  display_name: '',
  photo_url: '',
  bio: '',
  default_program_slug: '',
  default_routine_ids: [] as string[],
  default_playlist_ids: [] as string[],
  default_channel_ids: [] as string[],
  plus_trial_days: 7,
  is_active: true,
};

export default function Instructors() {
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<{ slug: string; title: string }[]>([]);
  const [routines, setRoutines] = useState<{ id: string; title: string; emoji: string | null }[]>([]);
  const [playlists, setPlaylists] = useState<{ id: string; name: string; cover_image_url: string | null }[]>([]);
  const [channels, setChannels] = useState<{ id: string; name: string; cover_image_url: string | null }[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: rows }, { data: refs }, { data: progs }, { data: rts }, { data: pls }, { data: chs }] = await Promise.all([
      supabase.from('instructors').select('*').order('created_at', { ascending: false }),
      supabase.from('instructor_referrals').select('instructor_id'),
      supabase.from('program_catalog' as any).select('slug, title').eq('is_active', true).order('title'),
      supabase.from('routines_bank').select('id, title, emoji').eq('is_active', true).order('title'),
      supabase.from('audio_playlists').select('id, name, cover_image_url').eq('is_hidden', false).order('name'),
      supabase.from('feed_channels').select('id, name, cover_image_url').eq('is_archived', false).order('name'),
    ]);
    setInstructors((rows as Instructor[]) || []);
    const counts: Record<string, number> = {};
    (refs || []).forEach((r: any) => {
      counts[r.instructor_id] = (counts[r.instructor_id] || 0) + 1;
    });
    setStats(counts);
    setPrograms((progs as any) || []);
    setRoutines((rts as any) || []);
    setPlaylists((pls as any) || []);
    setChannels((chs as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (ins: Instructor) => {
    setEditing(ins);
    setForm({
      slug: ins.slug,
      display_name: ins.display_name,
      photo_url: ins.photo_url || '',
      bio: ins.bio || '',
      default_program_slug: ins.default_program_slug || '',
      default_routine_ids: ins.default_routine_ids || [],
      default_playlist_ids: ins.default_playlist_ids || [],
      default_channel_ids: ins.default_channel_ids || [],
      plus_trial_days: ins.plus_trial_days,
      is_active: ins.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.slug.trim() || !form.display_name.trim()) {
      toast({ title: 'Missing fields', description: 'Slug and display name are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      display_name: form.display_name.trim(),
      photo_url: form.photo_url.trim() || null,
      bio: form.bio.trim() || null,
      default_program_slug: form.default_program_slug.trim() || null,
      default_routine_ids: form.default_routine_ids,
      default_playlist_ids: form.default_playlist_ids,
      default_channel_ids: form.default_channel_ids,
      plus_trial_days: Number(form.plus_trial_days) || 0,
      is_active: form.is_active,
    };

    const { data: savedRow, error } = editing
      ? await supabase.from('instructors').update(payload as any).eq('id', editing.id).select('id').maybeSingle()
      : await supabase.from('instructors').insert(payload as any).select('id').maybeSingle();

    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }

    // Backfill: ensure all already-referred users can SEE the linked channels
    // by removing any existing exclusions for those channels.
    const instructorId = editing?.id || (savedRow as any)?.id;
    if (instructorId && form.default_channel_ids.length > 0) {
      try {
        const { data: refs } = await supabase
          .from('instructor_referrals')
          .select('user_id')
          .eq('instructor_id', instructorId);
        const userIds = (refs || []).map((r: any) => r.user_id);
        if (userIds.length > 0) {
          await supabase
            .from('feed_channel_exclusions')
            .delete()
            .in('user_id', userIds)
            .in('channel_id', form.default_channel_ids);
        }
      } catch (err) {
        console.warn('[Instructors] Channel backfill failed:', err);
      }
    }

    toast({ title: editing ? 'Instructor updated' : 'Instructor created' });
    setOpen(false);
    load();
  };

  const remove = async (ins: Instructor) => {
    if (!confirm(`Delete instructor "${ins.display_name}"? Their referral history will be removed.`)) return;
    const { error } = await supabase.from('instructors').delete().eq('id', ins.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Instructor deleted' });
    load();
  };

  const copyLink = (slug: string) => {
    const url = buildInstructorOneLink(slug);
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: url });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instructors</h2>
          <p className="text-muted-foreground">
            Create partner links that auto-enroll followers when they install the app.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New instructor
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : instructors.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No instructors yet.</p>
          <Button onClick={openCreate}>Create your first instructor</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instructors.map((ins) => {
            const url = buildInstructorOneLink(ins.slug);
            return (
              <Card key={ins.id} className="p-5">
                <div className="flex items-start gap-4">
                  {ins.photo_url ? (
                    <img src={ins.photo_url} alt={ins.display_name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                      {ins.display_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{ins.display_name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">{ins.slug}</Badge>
                      {!ins.is_active && <Badge variant="secondary">Inactive</Badge>}
                      <Badge variant="secondary">{stats[ins.id] || 0} referrals</Badge>
                    </div>
                    {ins.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ins.bio}</p>}
                    <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                      {ins.default_program_slug && <div>Program: <span className="font-mono">{ins.default_program_slug}</span></div>}
                      {ins.default_routine_ids?.length > 0 && <div>{ins.default_routine_ids.length} routine(s) auto-added</div>}
                      {ins.default_playlist_ids?.length > 0 && <div>{ins.default_playlist_ids.length} playlist(s) unlocked</div>}
                      {ins.default_channel_ids?.length > 0 && <div>{ins.default_channel_ids.length} chat channel(s) auto-joined</div>}
                      {ins.plus_trial_days > 0 && <div>{ins.plus_trial_days}-day Plus trial</div>}
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate min-w-0">{url}</code>
                      <Button size="sm" variant="outline" onClick={() => copyLink(ins.slug)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                    </div>
                    <InstructorPackagesManager
                      instructorId={ins.id}
                      instructorSlug={ins.slug}
                      programs={programs}
                      routines={routines}
                      playlists={playlists}
                      channels={channels}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(ins)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(ins)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">{editing ? 'Edit instructor' : 'New instructor'}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Configure how this instructor's link rewards new and existing followers.
            </p>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            {/* === Identity section === */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identity</h3>

              <div className="flex gap-4 items-start">
                <div className="w-28 shrink-0">
                  <PhotoCircle url={form.photo_url} name={form.display_name} />
                </div>
                <div className="flex-1">
                  <ImageUploader
                    value={form.photo_url}
                    onChange={(url) => setForm({ ...form, photo_url: url })}
                    bucket="instructor-photos"
                    folder="profiles"
                    label="Profile photo"
                    placeholder="Upload or paste image URL"
                    previewHeight="h-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Display name</Label>
                  <Input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Sarah Smith"
                  />
                </div>
                <div>
                  <Label>Slug {editing && <span className="text-xs text-muted-foreground">(locked)</span>}</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="sarah"
                    disabled={!!editing}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs">
                <span className="text-muted-foreground">Link: </span>
                <span className="font-mono">ladyboss.onelink.me/lt6v?af_sub1=</span>
                <span className="font-mono font-semibold text-primary">{form.slug || 'sarah'}</span>
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="One-line intro shown on the welcome screen"
                  rows={2}
                />
              </div>
            </section>

            <Separator />

            {/* === Perks section === */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" /> What followers unlock
                </h3>
                <p className="text-xs text-muted-foreground mt-1">All items below are automatically applied to new and existing users who follow this link.</p>
              </div>

              {/* Course / Program */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> Auto-enroll in course
                </Label>
                <Select
                  value={form.default_program_slug || '__none__'}
                  onValueChange={(v) => setForm({ ...form, default_program_slug: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No course —</SelectItem>
                    {programs.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Routines */}
              <MultiPicker
                icon={<Sparkles className="h-4 w-4" />}
                label="Add routines to planner"
                placeholder="Search routines…"
                items={routines.map((r) => ({ id: r.id, label: r.title, emoji: r.emoji }))}
                selected={form.default_routine_ids}
                onChange={(ids) => setForm({ ...form, default_routine_ids: ids })}
              />

              {/* Playlists */}
              <MultiPicker
                icon={<ListMusic className="h-4 w-4" />}
                label="Unlock audio playlists"
                placeholder="Search playlists…"
                items={playlists.map((p) => ({ id: p.id, label: p.name, image: p.cover_image_url }))}
                selected={form.default_playlist_ids}
                onChange={(ids) => setForm({ ...form, default_playlist_ids: ids })}
              />

              {/* Chat channels */}
              <MultiPicker
                icon={<MessageCircle className="h-4 w-4" />}
                label="Auto-join chat channels"
                placeholder="Search channels…"
                items={channels.map((c) => ({ id: c.id, label: c.name, image: c.cover_image_url }))}
                selected={form.default_channel_ids}
                onChange={(ids) => setForm({ ...form, default_channel_ids: ids })}
              />

              {/* Trial */}
              <div className="rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/10">
                <Label className="flex items-center justify-between">
                  <span>Simora Plus trial days</span>
                  <span className="text-xs text-muted-foreground font-normal">One-time per user</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.plus_trial_days}
                  onChange={(e) => setForm({ ...form, plus_trial_days: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </section>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive instructors' links won't grant perks.</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t sticky bottom-0 bg-background flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create instructor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- helpers -------------------- */

function PhotoCircle({ url, name }: { url: string; name: string }) {
  if (url) {
    return <img src={url} alt={name || 'preview'} className="h-24 w-24 rounded-full object-cover border-2 border-border" />;
  }
  return (
    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-semibold text-muted-foreground border-2 border-dashed">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

interface PickerItem {
  id: string;
  label: string;
  emoji?: string | null;
  image?: string | null;
}

function MultiPicker({
  icon,
  label,
  placeholder,
  items,
  selected,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  items: PickerItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedItems = items.filter((i) => selected.includes(i.id));

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  return (
    <div>
      <Label className="flex items-center gap-1.5">
        {icon} {label}
        {selected.length > 0 && (
          <Badge variant="secondary" className="ml-1">{selected.length}</Badge>
        )}
      </Label>

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="pl-1 pr-1.5 py-1 gap-1.5 max-w-full"
            >
              {item.image ? (
                <img src={item.image} alt="" className="h-5 w-5 rounded object-cover" />
              ) : item.emoji ? (
                <span className="text-base leading-none">{item.emoji}</span>
              ) : null}
              <span className="truncate max-w-[160px]">{item.label}</span>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="hover:bg-background rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground">
            <Search className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-64">
                  {items.map((item) => {
                    const isSelected = selected.includes(item.id);
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.label} ${item.id}`}
                        onSelect={() => toggle(item.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                          {isSelected && <span className="text-[10px] text-primary-foreground">✓</span>}
                        </div>
                        {item.image ? (
                          <img src={item.image} alt="" className="h-7 w-7 rounded object-cover" />
                        ) : item.emoji ? (
                          <span className="text-xl leading-none w-7 text-center">{item.emoji}</span>
                        ) : (
                          <span className="w-7" />
                        )}
                        <span className="flex-1 truncate">{item.label}</span>
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}