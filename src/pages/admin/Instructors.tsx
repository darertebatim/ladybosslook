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
import { Plus, Copy, Pencil, Trash2, Link2 } from 'lucide-react';
import { buildInstructorOneLink } from '@/lib/appsflyer';

interface Instructor {
  id: string;
  slug: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  default_program_slug: string | null;
  default_routine_ids: string[];
  plus_trial_days: number;
  is_active: boolean;
  created_at: string;
}

interface ReferralStat {
  instructor_id: string;
  count: number;
}

const emptyForm = {
  slug: '',
  display_name: '',
  photo_url: '',
  bio: '',
  default_program_slug: '',
  default_routine_ids: '', // comma-separated UUIDs
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

  const load = async () => {
    setLoading(true);
    const [{ data: rows }, { data: refs }] = await Promise.all([
      supabase.from('instructors').select('*').order('created_at', { ascending: false }),
      supabase.from('instructor_referrals').select('instructor_id'),
    ]);
    setInstructors((rows as Instructor[]) || []);
    const counts: Record<string, number> = {};
    (refs || []).forEach((r: any) => {
      counts[r.instructor_id] = (counts[r.instructor_id] || 0) + 1;
    });
    setStats(counts);
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
      default_routine_ids: (ins.default_routine_ids || []).join(', '),
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
    const routineIds = form.default_routine_ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      display_name: form.display_name.trim(),
      photo_url: form.photo_url.trim() || null,
      bio: form.bio.trim() || null,
      default_program_slug: form.default_program_slug.trim() || null,
      default_routine_ids: routineIds,
      plus_trial_days: Number(form.plus_trial_days) || 0,
      is_active: form.is_active,
    };

    const { error } = editing
      ? await supabase.from('instructors').update(payload).eq('id', editing.id)
      : await supabase.from('instructors').insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
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
                      {ins.plus_trial_days > 0 && <div>{ins.plus_trial_days}-day Plus trial</div>}
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate min-w-0">{url}</code>
                      <Button size="sm" variant="outline" onClick={() => copyLink(ins.slug)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                    </div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit instructor' : 'New instructor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Slug (unique, lowercase)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="sarah"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground mt-1">Used in the link: ladyboss.onelink.me/lt6v?af_sub1=<b>{form.slug || 'sarah'}</b></p>
            </div>
            <div>
              <Label>Display name</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Sarah Smith"
              />
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://…"
              />
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
            <div>
              <Label>Default program slug (optional)</Label>
              <Input
                value={form.default_program_slug}
                onChange={(e) => setForm({ ...form, default_program_slug: e.target.value })}
                placeholder="iqmoney-income-growth"
              />
            </div>
            <div>
              <Label>Routine IDs to auto-add (comma separated)</Label>
              <Textarea
                value={form.default_routine_ids}
                onChange={(e) => setForm({ ...form, default_routine_ids: e.target.value })}
                placeholder="6c2d0492-9310-46a2-99ad-be5c2ddbc3f6, …"
                rows={2}
              />
            </div>
            <div>
              <Label>Simora Plus trial days</Label>
              <Input
                type="number"
                min={0}
                value={form.plus_trial_days}
                onChange={(e) => setForm({ ...form, plus_trial_days: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create instructor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}