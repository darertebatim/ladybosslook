import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, RefreshCw } from "lucide-react";

type Row = Record<string, any>;

const BUCKET_SLUGS = [
  "basics","story","customers","products","sales","marketing","money",
  "vision","tools","team","operations","partners","competitors",
];

const INPUT_KINDS = ["short_text","long_text","single_choice","multi_choice","number","url","email"];

function useTable<T extends Row>(table: string, orderBy: string, ascending = true) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from(table).select("*").order(orderBy, { ascending });
    if (error) toast({ title: `Load ${table} failed`, description: error.message, variant: "destructive" });
    setRows((data ?? []) as T[]);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const upsert = async (row: Partial<T>) => {
    const { error } = await (supabase as any).from(table).upsert(row);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Saved" });
    refresh();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    refresh();
  };

  return { rows, loading, refresh, upsert, remove };
}

function EditorDialog({
  open, onOpenChange, title, initial, fields, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial: Row;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "textarea" | "number" | "switch" | "select" | "multiselect" | "json";
    options?: string[];
    required?: boolean;
  }>;
  onSave: (row: Row) => Promise<boolean> | boolean;
}) {
  const [draft, setDraft] = useState<Row>(initial);
  useEffect(() => { setDraft(initial); }, [initial, open]);

  const set = (k: string, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}{f.required ? " *" : ""}</Label>
              {f.type === "text" && (
                <Input value={draft[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              )}
              {f.type === "textarea" && (
                <Textarea rows={4} value={draft[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              )}
              {f.type === "number" && (
                <Input type="number" value={draft[f.key] ?? 0}
                  onChange={(e) => set(f.key, Number(e.target.value))} />
              )}
              {f.type === "switch" && (
                <Switch checked={!!draft[f.key]} onCheckedChange={(v) => set(f.key, v)} />
              )}
              {f.type === "select" && (
                <Select value={String(draft[f.key] ?? "")} onValueChange={(v) => set(f.key, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {f.type === "multiselect" && (
                <div className="flex flex-wrap gap-2">
                  {(f.options ?? []).map((o) => {
                    const arr: string[] = Array.isArray(draft[f.key]) ? draft[f.key] : [];
                    const on = arr.includes(o);
                    return (
                      <button key={o} type="button"
                        onClick={() => set(f.key, on ? arr.filter(x => x !== o) : [...arr, o])}
                        className={`px-2.5 py-1 rounded-md text-xs border ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              )}
              {f.type === "json" && (
                <Textarea rows={4} className="font-mono text-xs"
                  value={typeof draft[f.key] === "string" ? draft[f.key] : JSON.stringify(draft[f.key] ?? null, null, 2)}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder='e.g. ["Option A","Option B"]' />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            // parse JSON fields
            const final: Row = { ...draft };
            for (const f of fields) {
              if (f.type === "json" && typeof final[f.key] === "string") {
                try { final[f.key] = final[f.key].trim() ? JSON.parse(final[f.key]) : null; }
                catch { /* leave as string; will fail at DB level with toast */ }
              }
            }
            const ok = await onSave(final);
            if (ok) onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Buckets ----------
function BucketsTab() {
  const t = useTable<Row>("aperture_buckets", "display_order");
  const [editing, setEditing] = useState<Row | null>(null);

  return (
    <Section title="Buckets" description="The 13 territories Aperture knows about. Briefs feed the AI; titles/blurbs show to users."
      onRefresh={t.refresh} onAdd={() => setEditing({ source: "default", is_active: true, display_order: t.rows.length + 1 })}>
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Territory</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {t.rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.display_order ?? r.sort_order}</TableCell>
              <TableCell className="font-mono text-xs">{r.slug}</TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground line-clamp-1">{r.territory}</TableCell>
              <TableCell className="text-xs">{r.target_count ?? 8}</TableCell>
              <TableCell>{r.is_active ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => t.remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditorDialog
        open={!!editing} onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? "Edit bucket" : "New bucket"}
        initial={editing ?? {}}
        onSave={(row) => t.upsert(row)}
        fields={[
          { key: "slug", label: "Slug", type: "text", required: true },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "glyph", label: "Glyph (emoji)", type: "text" },
          { key: "blurb", label: "Blurb (one-liner)", type: "text" },
          { key: "territory", label: "Territory (user-facing description)", type: "textarea" },
          { key: "brief", label: "AI Brief (internal context)", type: "textarea" },
          { key: "display_order", label: "Display order", type: "number" },
          { key: "target_count", label: "Target facts (100% threshold)", type: "number" },
          { key: "is_active", label: "Active", type: "switch" },
          { key: "source", label: "Source", type: "select", options: ["default","custom"] },
        ]}
      />
    </Section>
  );
}

// ---------- Bucket Questions ----------
function BucketQuestionsTab() {
  const t = useTable<Row>("aperture_bucket_questions", "sort_order");
  const [editing, setEditing] = useState<Row | null>(null);
  const [filterBucket, setFilterBucket] = useState<string>("all");

  const filtered = useMemo(
    () => filterBucket === "all" ? t.rows : t.rows.filter(r => r.bucket_slug === filterBucket),
    [t.rows, filterBucket],
  );

  return (
    <Section title="Bucket Questions" description="Questions Aperture can ask the user, grouped by bucket."
      onRefresh={t.refresh} onAdd={() => setEditing({ is_active: true, layer: "core", audience: "all", sort_order: 1, input_kind: "long_text" })}>
      <div className="mb-3 flex items-center gap-2">
        <Label className="text-xs">Bucket:</Label>
        <Select value={filterBucket} onValueChange={setFilterBucket}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {BUCKET_SLUGS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Bucket</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Prompt</TableHead>
          <TableHead>Layer</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.bucket_slug}</TableCell>
              <TableCell className="font-mono text-xs">{r.question_key}</TableCell>
              <TableCell className="line-clamp-2 max-w-md">{r.prompt}</TableCell>
              <TableCell><Badge variant="outline">{r.layer ?? "—"}</Badge></TableCell>
              <TableCell>{r.is_active ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => t.remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditorDialog
        open={!!editing} onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? "Edit question" : "New question"}
        initial={editing ?? {}}
        onSave={(row) => t.upsert(row)}
        fields={[
          { key: "bucket_slug", label: "Bucket", type: "select", options: BUCKET_SLUGS, required: true },
          { key: "question_key", label: "Question key", type: "text", required: true },
          { key: "prompt", label: "Prompt", type: "textarea", required: true },
          { key: "hint", label: "Hint", type: "text" },
          { key: "input_kind", label: "Input kind", type: "select", options: INPUT_KINDS },
          { key: "choices", label: "Choices (JSON array)", type: "json" },
          { key: "layer", label: "Layer", type: "select", options: ["core","deep","situational"] },
          { key: "audience", label: "Audience", type: "text" },
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />
    </Section>
  );
}

// ---------- Onboarding Questions ----------
function OnboardingTab({ flow }: { flow: "quick" | "full" }) {
  const t = useTable<Row>("aperture_onboarding_questions", "step");
  const [editing, setEditing] = useState<Row | null>(null);
  const rows = useMemo(() => t.rows.filter(r => r.flow === flow), [t.rows, flow]);

  return (
    <Section title={flow === "quick" ? "Quick Onboarding" : "Full Questionnaire"}
      description={flow === "quick"
        ? "The fast 3-phase intake shown to brand-new users."
        : "The deeper ~43-question business intake, grouped by section."}
      onRefresh={t.refresh}
      onAdd={() => setEditing({ flow, is_active: true, step: 1, sort_order: rows.length + 1, input_kind: "long_text", bucket_slugs: [] })}>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Step</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Prompt</TableHead>
          <TableHead>Targets</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.step}.{r.sort_order}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.section ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{r.question_key}</TableCell>
              <TableCell className="line-clamp-2 max-w-md">{r.prompt}</TableCell>
              <TableCell className="text-xs">{(r.bucket_slugs ?? []).join(", ")}</TableCell>
              <TableCell>{r.is_active ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => t.remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditorDialog
        open={!!editing} onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? "Edit question" : "New question"}
        initial={editing ?? {}}
        onSave={(row) => t.upsert(row)}
        fields={[
          { key: "flow", label: "Flow", type: "select", options: ["quick","full"], required: true },
          { key: "step", label: "Step / phase", type: "number", required: true },
          { key: "section", label: "Section label", type: "text" },
          { key: "question_key", label: "Question key", type: "text", required: true },
          { key: "prompt", label: "Prompt", type: "textarea", required: true },
          { key: "hint", label: "Hint", type: "text" },
          { key: "input_kind", label: "Input kind", type: "select", options: INPUT_KINDS },
          { key: "options", label: "Options (JSON)", type: "json" },
          { key: "bucket_slugs", label: "Target buckets", type: "multiselect", options: BUCKET_SLUGS },
          { key: "bucket_question_keys",
            label: "Bucket question keys ticked off (JSON array of strings). The AI won't re-ask these.",
            type: "json" },
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />
    </Section>
  );
}

// ---------- Industries ----------
function IndustriesTab() {
  const t = useTable<Row>("aperture_industries", "sort_order");
  const [editing, setEditing] = useState<Row | null>(null);

  return (
    <Section title="Industries" description="The industry picker shown during Quick Onboarding."
      onRefresh={t.refresh} onAdd={() => setEditing({ is_active: true, sort_order: t.rows.length + 1 })}>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Group</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {t.rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs">{r.group_label ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{r.slug}</TableCell>
              <TableCell>{r.label}</TableCell>
              <TableCell>{r.is_active ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => t.remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditorDialog
        open={!!editing} onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? "Edit industry" : "New industry"}
        initial={editing ?? {}}
        onSave={(row) => t.upsert(row)}
        fields={[
          { key: "slug", label: "Slug", type: "text", required: true },
          { key: "label", label: "Label", type: "text", required: true },
          { key: "group_label", label: "Group", type: "text" },
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />
    </Section>
  );
}

// ---------- Tools ----------
const TOOL_CATEGORY_OPTIONS = [
  "Accounting","AI","Design","E-commerce","Email & CRM","Communication",
  "HR & People","Marketing & Social","Payments","Productivity",
  "Scheduling","Website & Domain","Industry-specific",
];
const TOOL_INDUSTRY_OPTIONS = [
  "Food & Hospitality","Beauty & Wellness","Fitness, Training & Movement",
  "Retail & E-Commerce","Professional Services & Agencies",
  "Coaching, Consulting & Therapy","Education & Tutoring","Real Estate",
  "General Contracting & Renovation","Outdoor & Recurring Trade Services",
  "Medical & Dental Practices",
];

function ToolsTab() {
  const t = useTable<Row>("aperture_tools", "sort_order");
  const [editing, setEditing] = useState<Row | null>(null);

  return (
    <Section
      title="Tools"
      description="The tool stack picker shown in Quick Onboarding ('Which tools do you use?')."
      onRefresh={t.refresh}
      onAdd={() => setEditing({ is_active: true, sort_order: t.rows.length + 1, categories: [], industries: [] })}
    >
      <Table>
        <TableHeader><TableRow>
          <TableHead>Categories</TableHead>
          <TableHead>Industries</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {t.rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs">
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(r.categories) && r.categories.length > 0
                    ? r.categories
                    : r.category ? [r.category] : []
                  ).map((c: string) => <Badge key={c} variant="outline">{c}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="text-xs">
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(r.industries) ? r.industries : []).map((c: string) => (
                    <Badge key={c}>{c}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{r.slug}</TableCell>
              <TableCell>{r.label}</TableCell>
              <TableCell>{r.is_active ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => t.remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditorDialog
        open={!!editing} onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? "Edit tool" : "New tool"}
        initial={editing ?? {}}
        onSave={(row) => {
          // Keep legacy single `category` in sync with the first selected category.
          const cats: string[] = Array.isArray(row.categories) ? row.categories : [];
          return t.upsert({ ...row, category: cats[0] ?? row.category ?? null });
        }}
        fields={[
          { key: "slug", label: "Slug", type: "text", required: true },
          { key: "label", label: "Label", type: "text", required: true },
          { key: "categories", label: "Categories", type: "multiselect", options: TOOL_CATEGORY_OPTIONS, required: true },
          { key: "industries", label: "Industries (industry-specific tools only)", type: "multiselect", options: TOOL_INDUSTRY_OPTIONS },
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />
    </Section>
  );
}

// ---------- Actions (Playbooks & Prompts) ----------
const ACTION_CATEGORIES = [
  "Marketing","Sales","Pricing","Customers","Operations","Mindset","Product","Finance","Legal","Growth"
];
const ACTION_KINDS = ["playbook","prompt"];

function ActionsTab() {
  const t = useTable<Row>("aperture_actions", "category");
  const [editing, setEditing] = useState<Row | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<string>("all");

  const filtered = useMemo(() => {
    return t.rows.filter((r: Row) => {
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterKind !== "all" && r.kind !== filterKind) return false;
      return true;
    });
  }, [t.rows, filterCategory, filterKind]);

  return (
    <Section title="Playbooks & Prompts" description="The Library cards shown to users. Playbooks are multi-step AI walkthroughs; prompts are one-shot outputs."
      onRefresh={t.refresh} onAdd={() => setEditing({ kind: "playbook", category: "Marketing", is_published: true, steps: [], needs: [] })}>
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Category:</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {ACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Kind:</Label>
          <Select value={filterKind} onValueChange={setFilterKind}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {ACTION_KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Needs</TableHead>
          <TableHead>Published</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {filtered.map((r: Row) => (
            <TableRow key={r.slug}>
              <TableCell className="text-xs">{r.category}</TableCell>
              <TableCell><Badge variant={r.kind === "playbook" ? "default" : "outline"}>{r.kind}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{r.slug}</TableCell>
              <TableCell className="max-w-xs truncate">{r.title}</TableCell>
              <TableCell className="text-xs">{r.duration ?? "—"}</TableCell>
              <TableCell className="text-xs">{(r.needs ?? []).join(", ")}</TableCell>
              <TableCell>{r.is_published ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => t.remove(r.slug)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditorDialog
        open={!!editing} onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.slug ? "Edit action" : "New action"}
        initial={editing ?? {}}
        onSave={(row) => t.upsert(row)}
        fields={[
          { key: "slug", label: "Slug (unique ID)", type: "text", required: true },
          { key: "kind", label: "Kind", type: "select", options: ACTION_KINDS, required: true },
          { key: "category", label: "Category", type: "select", options: ACTION_CATEGORIES, required: true },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "blurb", label: "Blurb (one-liner)", type: "textarea" },
          { key: "why", label: "Why this (personalization hint)", type: "textarea" },
          { key: "duration", label: "Duration (e.g. '8 min')", type: "text" },
          { key: "needs", label: "Memory buckets needed", type: "multiselect", options: BUCKET_SLUGS },
          { key: "steps", label: "Steps (JSON array of {prompt, exampleAnswer?})", type: "json" },
          { key: "output", label: "Output (for prompts — sample result)", type: "textarea" },
          { key: "is_published", label: "Published", type: "switch" },
        ]}
      />
    </Section>
  );
}

// ---------- Shared Section wrapper ----------
function Section({ title, description, onRefresh, onAdd, children }: {
  title: string; description: string;
  onRefresh?: () => void; onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex gap-2">
          {onRefresh && <Button size="sm" variant="outline" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-1.5" />Refresh</Button>}
          {onAdd && <Button size="sm" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" />Add</Button>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---------- Page ----------
export default function ApertureAdmin() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aperture</h1>
        <p className="text-sm text-muted-foreground">
          Source of truth for buckets, questions, onboarding, and industries. Changes apply immediately to the live product.
        </p>
      </div>
      <Tabs defaultValue="buckets">
        <TabsList>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="bucket-questions">Bucket Questions</TabsTrigger>
          <TabsTrigger value="quick">Quick Onboarding</TabsTrigger>
          <TabsTrigger value="full">Full Questionnaire</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="actions">Playbooks & Prompts</TabsTrigger>
          <TabsTrigger value="reset">Reset User</TabsTrigger>
        </TabsList>
        <TabsContent value="buckets" className="mt-4"><BucketsTab /></TabsContent>
        <TabsContent value="bucket-questions" className="mt-4"><BucketQuestionsTab /></TabsContent>
        <TabsContent value="quick" className="mt-4"><OnboardingTab flow="quick" /></TabsContent>
        <TabsContent value="full" className="mt-4"><OnboardingTab flow="full" /></TabsContent>
        <TabsContent value="industries" className="mt-4"><IndustriesTab /></TabsContent>
        <TabsContent value="tools" className="mt-4"><ToolsTab /></TabsContent>
        <TabsContent value="actions" className="mt-4"><ActionsTab /></TabsContent>
        <TabsContent value="reset" className="mt-4"><ResetUserTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Reset User ----------
function ResetUserTab() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!email.trim()) return;
    if (!confirm(`Reset ALL Aperture data for ${email}? This deletes memory, chats, profile, generated items, files, documents, and events. The auth account stays.`)) return;
    setBusy(true); setResult(null);
    const { data, error } = await supabase.functions.invoke("aperture-reset-user", {
      body: { email: email.trim() },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as any)?.error) {
      toast({ title: "Reset failed", description: (data as any).error, variant: "destructive" });
      return;
    }
    setResult(data);
    toast({ title: "User reset", description: `Cleared Aperture data for ${email}` });
  };

  return (
    <Section title="Reset Aperture User" description="Wipe a user's Aperture state (memory, chats, profile, generated content, files) so they can run onboarding from scratch. The auth account is preserved.">
      <div className="flex items-end gap-2 max-w-xl">
        <div className="flex-1 space-y-1.5">
          <Label>User email</Label>
          <Input type="email" placeholder="user@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button onClick={run} disabled={busy || !email.trim()} variant="destructive">
          {busy ? "Resetting…" : "Reset user"}
        </Button>
      </div>
      {result && (
        <pre className="mt-4 text-xs bg-muted/40 rounded-md p-3 overflow-auto max-h-80">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </Section>
  );
}