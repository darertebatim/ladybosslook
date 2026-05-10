import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { whatIsRiloFlow } from "@/data/onboarding-flows/what-is-rilo";

// Normalized (lowercased, no spaces/dashes) self-care tag keys.
// DB has mixed casing/spacing like "Easy Win", "easy-win", "TidyUp", "LovedOnes".
const SELF_CARE_TAGS = new Set([
  'sleep','nutrition','movement','calm','presence','gratitude','selfkindness',
  'tidyup','productivity','hygiene','evening','easywin','connection','lovedones',
]);

function normTag(t: string | null) {
  return (t || '').toLowerCase().replace(/[\s\-_]/g, '');
}

interface Task {
  id: string;
  title: string;
  emoji: string | null;
  tag: string | null;
  self_care_equivalent_id: string | null;
}

function norm(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

// Token-overlap similarity (Jaccard on word sets, with substring boost)
function similarity(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = new Set(na.split(/\s+/).filter(w => w.length > 2));
  const tb = new Set(nb.split(/\s+/).filter(w => w.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  const inter = [...ta].filter(w => tb.has(w)).length;
  const union = new Set([...ta, ...tb]).size;
  let score = inter / union;
  if (na.includes(nb) || nb.includes(na)) score = Math.max(score, 0.7);
  return score;
}

export default function SelfCareTwins() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [onlyUnmarked, setOnlyUnmarked] = useState(true);
  const [minScore, setMinScore] = useState(0.5);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin-task-bank-twins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('id, title, emoji, tag, self_care_equivalent_id')
        .order('title');
      if (error) throw error;
      return data as Task[];
    },
  });

  const setTwin = useMutation({
    mutationFn: async ({ id, twinId }: { id: string; twinId: string | null }) => {
      const { error } = await supabase
        .from('admin_task_bank')
        .update({ self_care_equivalent_id: twinId })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-task-bank-twins'] });
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { selfCare, nonSelfCare } = useMemo(() => {
    const sc: Task[] = [], non: Task[] = [];
    for (const t of tasks) {
      if (SELF_CARE_TAGS.has(normTag(t.tag))) sc.push(t);
      else non.push(t);
    }
    return { selfCare: sc, nonSelfCare: non };
  }, [tasks]);

  const rows = useMemo(() => {
    const lowSearch = search.toLowerCase();
    const result = nonSelfCare
      .filter(t => !search || t.title?.toLowerCase().includes(lowSearch))
      .map(t => {
        const scored = selfCare
          .map(sc => ({ sc, score: similarity(t.title, sc.title) }))
          .sort((a, b) => b.score - a.score);
        const matches = scored.filter(m => m.score >= minScore).slice(0, 5);
        // Picker options: include any self-care task sharing a meaningful word,
        // even if below the row threshold — so you can always pick the right twin.
        const taskTokens = new Set(
          norm(t.title).split(/\s+/).filter(w => w.length > 2)
        );
        const pickerOptions = scored
          .filter(m => {
            if (m.score >= minScore) return true;
            const scTokens = norm(m.sc.title).split(/\s+/).filter(w => w.length > 2);
            // Require at least 2 shared meaningful words to avoid noise
            // (e.g. "Skip that drink tonight" sharing only "drink").
            const shared = scTokens.filter(w => taskTokens.has(w)).length;
            return shared >= 2;
          })
          .slice(0, 20);
        return { task: t, matches, pickerOptions };
      })
      .filter(r => r.matches.length > 0)
      .filter(r => !onlyUnmarked || !r.task.self_care_equivalent_id);
    return result;
  }, [nonSelfCare, selfCare, search, onlyUnmarked, minScore]);

  const scById = useMemo(() => {
    const m = new Map<string, Task>();
    selfCare.forEach(s => m.set(s.id, s));
    return m;
  }, [selfCare]);

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Self-Care Twins (audit)</h1>
        <p className="text-muted-foreground text-sm">
          Match tasks to a self-care reference task. Use the DB tab for admin_task_bank
          twin links, and the Onboarding tab to plan replacements for "What's Rilo" picker tasks.
        </p>
      </div>

      <Tabs defaultValue="db" className="space-y-4">
        <TabsList>
          <TabsTrigger value="db">DB tasks</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding (What's Rilo)</TabsTrigger>
        </TabsList>

        <TabsContent value="db" className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search task title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyUnmarked} onChange={(e) => setOnlyUnmarked(e.target.checked)} />
          Only unmarked
        </label>
        <label className="flex items-center gap-2 text-sm">
          Min score:
          <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={0.3}>0.3 (loose)</option>
            <option value={0.5}>0.5</option>
            <option value={0.7}>0.7</option>
            <option value={1}>1.0 (exact)</option>
          </select>
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          {rows.length} candidates · {selfCare.length} self-care refs · {nonSelfCare.length} non-self-care total
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Non-self-care task</th>
                <th className="p-3">Tag</th>
                <th className="p-3">Best self-care match</th>
                <th className="p-3">Pick twin</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ task, matches, pickerOptions }) => {
                const current = task.self_care_equivalent_id ? scById.get(task.self_care_equivalent_id) : null;
                const top = matches[0];
                return (
                  <tr key={task.id} className="border-t align-top">
                    <td className="p-3">
                      <div className="font-medium">{task.emoji} {task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.id.slice(0, 8)}</div>
                    </td>
                    <td className="p-3">
                      {task.tag ? <Badge variant="outline">{task.tag}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      {top && (
                        <div>
                          <div>{top.sc.emoji} {top.sc.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {top.sc.tag} · score {top.score.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 min-w-[260px]">
                      <Select
                        value={task.self_care_equivalent_id ?? ""}
                        onValueChange={(v) => setTwin.mutate({ id: task.id, twinId: v || null })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={current ? `${current.emoji} ${current.title}` : "Choose…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {pickerOptions.map(m => (
                            <SelectItem key={m.sc.id} value={m.sc.id}>
                              {m.sc.emoji} {m.sc.title} · {m.sc.tag} ({m.score.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      {task.self_care_equivalent_id ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Check className="w-4 h-4" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTwin.mutate({ id: task.id, twinId: null })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!top}
                          onClick={() => top && setTwin.mutate({ id: task.id, twinId: top.sc.id })}
                        >
                          Use top
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No matches at this threshold.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingTwins selfCare={selfCare} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- Onboarding twin planner ----------------

type OnbAction = 'replace' | 'delete' | 'keep' | '';
interface OnbDecision { action: OnbAction; twinId: string; }
const STORAGE_KEY = 'onboarding_twin_decisions_v1';

function loadDecisions(): Record<string, OnbDecision> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveDecisions(d: Record<string, OnbDecision>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function OnboardingTwins({ selfCare }: { selfCare: Task[] }) {
  const [decisions, setDecisions] = useState<Record<string, OnbDecision>>(loadDecisions);

  const buckets = useMemo(() => {
    const out: { bucket: string; label: string; emoji: string }[] = [];
    for (const step of whatIsRiloFlow.steps as any[]) {
      if (step.type === 'rilo-pick-tasks' && Array.isArray(step.pickerTasks)) {
        for (const t of step.pickerTasks) {
          out.push({ bucket: step.bucket, label: t.label, emoji: t.emoji });
        }
      }
    }
    return out;
  }, []);

  const update = (key: string, patch: Partial<OnbDecision>) => {
    setDecisions(prev => {
      const next = { ...prev, [key]: { action: '', twinId: '', ...prev[key], ...patch } };
      saveDecisions(next);
      return next;
    });
  };

  const exportPlan = () => {
    const plan = buckets.map(b => {
      const key = `${b.bucket}::${b.label}`;
      const d = decisions[key];
      const twin = d?.twinId ? selfCare.find(s => s.id === d.twinId) : null;
      return { ...b, action: d?.action || 'keep', twin: twin ? `${twin.emoji} ${twin.title}` : null };
    });
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    toast.success("Plan copied to clipboard");
  };

  const counts = useMemo(() => {
    let r = 0, d = 0, k = 0, u = 0;
    for (const b of buckets) {
      const dec = decisions[`${b.bucket}::${b.label}`];
      if (dec?.action === 'replace') r++;
      else if (dec?.action === 'delete') d++;
      else if (dec?.action === 'keep') k++;
      else u++;
    }
    return { r, d, k, u };
  }, [buckets, decisions]);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="text-sm">
          <Badge variant="outline" className="mr-2">Replace: {counts.r}</Badge>
          <Badge variant="outline" className="mr-2">Delete: {counts.d}</Badge>
          <Badge variant="outline" className="mr-2">Keep: {counts.k}</Badge>
          <Badge variant="secondary">Undecided: {counts.u}</Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={exportPlan}>Copy plan as JSON</Button>
          <Button size="sm" variant="ghost" onClick={() => { localStorage.removeItem(STORAGE_KEY); setDecisions({}); }}>
            Reset
          </Button>
        </div>
      </Card>

      {(['morning','afternoon','evening'] as const).map(bucket => {
        const items = buckets.filter(b => b.bucket === bucket);
        return (
          <Card key={bucket} className="overflow-x-auto">
            <div className="px-4 py-3 border-b font-semibold capitalize">{bucket}</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 w-[26%]">Onboarding task</th>
                  <th className="p-3 w-[34%]">Top self-care twin</th>
                  <th className="p-3 w-[28%]">Pick twin</th>
                  <th className="p-3 w-[12%]">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(b => {
                  const key = `${b.bucket}::${b.label}`;
                  const scored = selfCare
                    .map(sc => ({ sc, score: similarity(b.label, sc.title) }))
                    .sort((a, b) => b.score - a.score);
                  const top = scored[0];
                  const options = scored.slice(0, 25);
                  const dec = decisions[key];
                  const chosen = dec?.twinId ? selfCare.find(s => s.id === dec.twinId) : null;
                  return (
                    <tr key={key} className="border-t align-top">
                      <td className="p-3 font-medium">{b.emoji} {b.label}</td>
                      <td className="p-3">
                        {top && top.score > 0 ? (
                          <div>
                            <div>{top.sc.emoji} {top.sc.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {top.sc.tag} · score {top.score.toFixed(2)}
                            </div>
                          </div>
                        ) : <span className="text-muted-foreground">No match</span>}
                      </td>
                      <td className="p-3">
                        <Select
                          value={dec?.twinId ?? ""}
                          onValueChange={(v) => update(key, { twinId: v, action: dec?.action || 'replace' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={chosen ? `${chosen.emoji} ${chosen.title}` : "Choose twin…"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[320px]">
                            {options.map(o => (
                              <SelectItem key={o.sc.id} value={o.sc.id}>
                                {o.sc.emoji} {o.sc.title} · {o.sc.tag} ({o.score.toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={dec?.action ?? ""}
                          onValueChange={(v) => update(key, { action: v as OnbAction })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="replace">Replace</SelectItem>
                            <SelectItem value="delete">Delete</SelectItem>
                            <SelectItem value="keep">Keep</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}