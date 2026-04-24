import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  Package as PackageIcon,
  GraduationCap,
  Sparkles,
  ListMusic,
  MessageCircle,
  Gift,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { buildPackageOneLink } from '@/lib/appsflyer';

/**
 * MultiPicker is duplicated in Instructors.tsx; inline a small adapter here
 * so this component is self-contained. We re-use the picker via a dynamic import
 * to avoid a hard circular dependency between admin pages and components.
 */
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';

export interface InstructorPackage {
  id: string;
  instructor_id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  default_program_slug: string | null;
  default_routine_ids: string[];
  default_playlist_ids: string[];
  default_channel_ids: string[];
  plus_trial_days: number;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  instructorId: string;
  instructorSlug: string;
  programs: { slug: string; title: string }[];
  routines: { id: string; title: string; emoji: string | null }[];
  playlists: { id: string; name: string; cover_image_url: string | null }[];
  channels: { id: string; name: string; cover_image_url: string | null }[];
}

const emptyForm = {
  slug: '',
  name: '',
  description: '',
  cover_image_url: '',
  default_program_slug: '',
  default_routine_ids: [] as string[],
  default_playlist_ids: [] as string[],
  default_channel_ids: [] as string[],
  plus_trial_days: 0,
  is_active: true,
};

export function InstructorPackagesManager({
  instructorId,
  instructorSlug,
  programs,
  routines,
  playlists,
  channels,
}: Props) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<InstructorPackage[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InstructorPackage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rows }, { data: refs }] = await Promise.all([
      supabase
        .from('instructor_packages' as any)
        .select('*')
        .eq('instructor_id', instructorId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('instructor_referrals')
        .select('package_id')
        .eq('instructor_id', instructorId)
        .not('package_id', 'is', null),
    ]);
    setPackages((rows as any) || []);
    const c: Record<string, number> = {};
    (refs || []).forEach((r: any) => {
      if (r.package_id) c[r.package_id] = (c[r.package_id] || 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, slug: `${instructorSlug}-` });
    setOpen(true);
  };

  const openEdit = (p: InstructorPackage) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      name: p.name,
      description: p.description || '',
      cover_image_url: p.cover_image_url || '',
      default_program_slug: p.default_program_slug || '',
      default_routine_ids: p.default_routine_ids || [],
      default_playlist_ids: p.default_playlist_ids || [],
      default_channel_ids: p.default_channel_ids || [],
      plus_trial_days: p.plus_trial_days,
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Slug and name are required.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const payload = {
      instructor_id: instructorId,
      slug: form.slug.trim().toLowerCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      default_program_slug: form.default_program_slug.trim() || null,
      default_routine_ids: form.default_routine_ids,
      default_playlist_ids: form.default_playlist_ids,
      default_channel_ids: form.default_channel_ids,
      plus_trial_days: Number(form.plus_trial_days) || 0,
      is_active: form.is_active,
    };

    const { error } = editing
      ? await supabase
          .from('instructor_packages' as any)
          .update(payload as any)
          .eq('id', editing.id)
      : await supabase.from('instructor_packages' as any).insert(payload as any);

    setSaving(false);
    if (error) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: editing ? 'Package updated' : 'Package created' });
    setOpen(false);
    load();
  };

  const remove = async (p: InstructorPackage) => {
    if (!confirm(`Delete package "${p.name}"? Existing referrals will keep their record but lose the package link.`)) return;
    const { error } = await supabase
      .from('instructor_packages' as any)
      .delete()
      .eq('id', p.id);
    if (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Package deleted' });
    load();
  };

  const copyLink = (slug: string) => {
    const url = buildPackageOneLink(instructorSlug, slug);
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: url });
  };

  return (
    <div className="space-y-3 mt-3 pt-3 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Packages</span>
          <Badge variant="secondary" className="text-xs">{packages.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add package
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : packages.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No packages yet. Add one to give this instructor multiple referral links (e.g. "Money course" vs "Business course").
        </p>
      ) : (
        <div className="space-y-2">
          {packages.map((p) => {
            const url = buildPackageOneLink(instructorSlug, p.slug);
            return (
              <div
                key={p.id}
                className="rounded-lg border p-3 bg-muted/30 space-y-2"
              >
                <div className="flex items-start gap-3">
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.name}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <PackageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{p.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {p.slug}
                      </Badge>
                      {!p.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {counts[p.id] || 0} sign-ups
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      {p.default_program_slug && <span>📚 {p.default_program_slug}</span>}
                      {p.default_routine_ids?.length > 0 && (
                        <span>✨ {p.default_routine_ids.length} routine(s)</span>
                      )}
                      {p.default_playlist_ids?.length > 0 && (
                        <span>🎧 {p.default_playlist_ids.length} playlist(s)</span>
                      )}
                      {p.default_channel_ids?.length > 0 && (
                        <span>💬 {p.default_channel_ids.length} channel(s)</span>
                      )}
                      {p.plus_trial_days > 0 && <span>✨ {p.plus_trial_days}d trial</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] bg-background px-2 py-1 rounded flex-1 truncate min-w-0 border">
                    {url}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyLink(p.slug)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">
              {editing ? 'Edit package' : 'New package'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Each package gets its own referral link and gift bundle.
            </p>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Package name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Money Mastery Course"
                  />
                </div>
                <div>
                  <Label>
                    Slug{' '}
                    {editing && (
                      <span className="text-xs text-muted-foreground">(locked)</span>
                    )}
                  </Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    placeholder={`${instructorSlug}-money`}
                    disabled={!!editing}
                    className="font-mono"
                  />
                </div>
              </div>
              <div>
                <Label>Description (shown on invite)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A short pitch shown when followers tap the link"
                  rows={2}
                />
              </div>
              <ImageUploader
                value={form.cover_image_url}
                onChange={(url) => setForm({ ...form, cover_image_url: url })}
                bucket="instructor-photos"
                folder="packages"
                label="Cover image (optional)"
                placeholder="Upload or paste image URL"
              />
              <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs">
                <span className="text-muted-foreground">Link: </span>
                <span className="font-mono">ladyboss.onelink.me/lt6v?af_sub1={instructorSlug}&af_sub2=</span>
                <span className="font-mono font-semibold text-primary">
                  {form.slug || `${instructorSlug}-package`}
                </span>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" /> What this package unlocks
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  These items override the instructor's default bundle when the
                  package link is used.
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> Auto-enroll in course
                </Label>
                <Select
                  value={form.default_program_slug || '__none__'}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      default_program_slug: v === '__none__' ? '' : v,
                    })
                  }
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

              <MultiPicker
                icon={<Sparkles className="h-4 w-4" />}
                label="Add routines to planner"
                placeholder="Search routines…"
                items={routines.map((r) => ({
                  id: r.id,
                  label: r.title,
                  emoji: r.emoji,
                }))}
                selected={form.default_routine_ids}
                onChange={(ids) => setForm({ ...form, default_routine_ids: ids })}
              />

              <MultiPicker
                icon={<ListMusic className="h-4 w-4" />}
                label="Unlock audio playlists"
                placeholder="Search playlists…"
                items={playlists.map((p) => ({
                  id: p.id,
                  label: p.name,
                  image: p.cover_image_url,
                }))}
                selected={form.default_playlist_ids}
                onChange={(ids) => setForm({ ...form, default_playlist_ids: ids })}
              />

              <MultiPicker
                icon={<MessageCircle className="h-4 w-4" />}
                label="Auto-join chat channels"
                placeholder="Search channels…"
                items={channels.map((c) => ({
                  id: c.id,
                  label: c.name,
                  image: c.cover_image_url,
                }))}
                selected={form.default_channel_ids}
                onChange={(ids) => setForm({ ...form, default_channel_ids: ids })}
              />

              <div className="rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/10">
                <Label className="flex items-center justify-between">
                  <span>Simora Plus trial days</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    One-time per user (across all instructors/packages)
                  </span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.plus_trial_days}
                  onChange={(e) =>
                    setForm({ ...form, plus_trial_days: Number(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>
            </section>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive packages won't grant perks.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t sticky bottom-0 bg-background flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- MultiPicker (local copy) -------------------- */
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
          <Badge variant="secondary" className="ml-1">
            {selected.length}
          </Badge>
        )}
      </Label>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="pl-1 pr-1.5 py-1 gap-1.5 max-w-full"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-5 w-5 rounded object-cover"
                />
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
          <Button
            variant="outline"
            className="w-full justify-start font-normal text-muted-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
        >
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
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-input'
                          }`}
                        >
                          {isSelected && (
                            <span className="text-[10px] text-primary-foreground">
                              ✓
                            </span>
                          )}
                        </div>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-7 w-7 rounded object-cover"
                          />
                        ) : item.emoji ? (
                          <span className="text-xl leading-none w-7 text-center">
                            {item.emoji}
                          </span>
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