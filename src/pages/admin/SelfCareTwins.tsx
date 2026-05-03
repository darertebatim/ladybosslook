import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";

const SELF_CARE_TAGS = [
  'sleep','nutrition','movement','calm','presence','gratitude','self-kindness',
  'tidyup','productivity','hygiene','evening','easy-win','connection','lovedones',
];

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
      const tagLower = (t.tag || "").toLowerCase();
      if (SELF_CARE_TAGS.includes(tagLower)) sc.push(t);
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
            return scTokens.some(w => taskTokens.has(w));
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
          Non-self-care tasks that look similar to a self-care reference task.
          Pick the right twin and save — that link will be used to count completions toward Self-Care Balance.
        </p>
      </div>

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
    </div>
  );
}