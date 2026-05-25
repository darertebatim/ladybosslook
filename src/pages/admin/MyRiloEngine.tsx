import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin documentation page for the My Rilo "Path" engine.
 * Source of truth: src/lib/pathEngine.ts + src/hooks/useTodayPath.tsx
 */

const dayOneFlow = [
  { emoji: "🧠", title: "Take the 60-second Self-Care Quiz", meta: "3 min · personalize your path", kind: "quiz_pick" },
  { emoji: "🌬️", title: "Reset: a breath OR reflection (random daily)", meta: "2–3 min · alternates breath ↔ reflection by date", kind: "reset", isNew: true },
  { emoji: "✨", title: "Browse routines (pick your first)", meta: "1 min", kind: "routine" },
  { emoji: "🏆", title: "+1 day streak & a new affirmation", meta: "Reward", kind: "reward" },
];

const standardFlow = [
  { emoji: "💛", title: "Mood check-in", meta: "1 min · pick your mood", kind: "mood" },
  { emoji: "🎧", title: "Today's playlist (ready to play)", meta: "Language match → sort_order", kind: "playlist" },
  { emoji: "🌬️", title: "Reset: a breath OR reflection (random daily)", meta: "2–3 min · alternates by date · deep-links to specific item", kind: "reset", isNew: true },
  { emoji: "🧠", title: "Rilo-picked from your quiz (top gap category)", meta: "5 min · Self-care", kind: "quiz_pick" },
  { emoji: "🔥", title: "Open your Planner (first active routine)", meta: "Navigates to /app/home", kind: "routine" },
  { emoji: "🏆", title: "+1 day streak & a new affirmation", meta: "Reward (always last, never skippable)", kind: "reward" },
];

const dataSources = [
  { table: "emotion_logs", purpose: "Today's mood check-in + valence → mood label for scorer" },
  { table: "selfcare_quiz_results", purpose: "gap_categories[0] used for quiz_pick step" },
  { table: "user_routines_bank", purpose: "Up to 4 active routines, weaved into path" },
  { table: "audio_playlists", purpose: "Featured playlist (deterministic: lowest sort_order, available + not hidden)" },
  { table: "breathing_exercises", purpose: "Reset pool — active + not premium; one picked per day by date seed" },
  { table: "reflections", purpose: "Reset pool — active + is_free; one picked per day by date seed" },
  { table: "path_dismissals", purpose: "Per-day skip list, filtered from steps" },
  { table: "path_step_actions", purpose: "snooze (15m default) · swap · skip_tomorrow" },
  { table: "user_streaks", purpose: "Current streak displayed in header" },
];

const roadmap = [
  { title: "Time-of-day awareness", desc: "Mood pinned to morning, community in evening, length adapts by clock bucket." },
  { title: "Mood-driven reset pick", desc: "After mood log: stressed → calm breath, tired → energize breath, sad → self-compassion reflection, happy → gratitude reflection. Today: random by date." },
  { title: "Novelty / anti-repetition", desc: "7-day completion history demotes yesterday's steps; rotate breath patterns." },
  { title: "Length budgeting", desc: "User picks 'I have 10 min' → engine trims to fit." },
  { title: "Streak / momentum nudges", desc: "Celebration steps on day-7, day-30, recovery shields." },
  { title: "Quiz depth", desc: "Rotate through all gap_categories instead of only [0]." },
  { title: "Smarter playlist match", desc: "Pick playlist by today's mood + language + recent listens (not just sort_order)." },
  { title: "Routine ordering", desc: "By recency-of-use, user-defined order, or mood fit." },
];

const StepRow = ({ s }: { s: typeof dayOneFlow[number] & { isNew?: boolean } }) => (
  <div className="flex items-start gap-3 py-2.5">
    <div className="text-2xl leading-none">{s.emoji}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-sm">{s.title}</span>
        <Badge variant="outline" className="text-[10px] font-mono">{s.kind}</Badge>
        {s.isNew && <Badge className="text-[10px] bg-primary/15 text-primary border-0">NEW</Badge>}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{s.meta}</div>
    </div>
  </div>
);

function useResetInventory() {
  return useQuery({
    queryKey: ["myrilo-reset-inventory"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [b, r] = await Promise.all([
        supabase.from("breathing_exercises")
          .select("id, name, category, emoji, is_premium, is_active")
          .order("category").order("sort_order", { ascending: true }),
        supabase.from("reflections")
          .select("id, title, category, emoji, is_free, is_active")
          .order("category").order("sort_order", { ascending: true }),
      ]);
      return { breaths: b.data ?? [], reflections: r.data ?? [] };
    },
  });
}

function groupByCategory<T extends { category: string | null }>(rows: T[]) {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const k = r.category || "uncategorized";
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(r);
  }
  return Array.from(out.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function ResetInventoryCard() {
  const { data, isLoading } = useResetInventory();
  const breaths = data?.breaths ?? [];
  const reflections = data?.reflections ?? [];
  const breathsEligible = breaths.filter((b: any) => b.is_active && !b.is_premium);
  const reflectionsEligible = reflections.filter((r: any) => r.is_active && r.is_free);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reset pool — current inventory</CardTitle>
        <CardDescription>
          What the engine can pick from for the "Reset" step. Eligibility: breath = <code>is_active &amp;&amp; !is_premium</code>; reflection = <code>is_active &amp;&amp; is_free</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="font-medium">🌬️ Breathing exercises</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {breathsEligible.length} eligible · {breaths.length} total
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-medium">📓 Reflections</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {reflectionsEligible.length} eligible · {reflections.length} total
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Breaths by category</div>
              <div className="divide-y">
                {groupByCategory(breathsEligible as any).map(([cat, rows]) => (
                  <div key={cat} className="py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono">{cat}</Badge>
                      <span className="text-xs text-muted-foreground">{rows.length} items</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {rows.slice(0, 6).map((r: any) => `${r.emoji ?? ""} ${r.name}`).join(" · ")}
                      {rows.length > 6 ? ` · +${rows.length - 6} more` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Reflections by category</div>
              <div className="divide-y">
                {groupByCategory(reflectionsEligible as any).map(([cat, rows]) => (
                  <div key={cat} className="py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono">{cat}</Badge>
                      <span className="text-xs text-muted-foreground">{rows.length} items</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {rows.slice(0, 6).map((r: any) => `${r.emoji ?? ""} ${r.title}`).join(" · ")}
                      {rows.length > 6 ? ` · +${rows.length - 6} more` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyRiloEngine() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">My Rilo — Path Engine</h2>
        <p className="text-muted-foreground">
          Deterministic rule-based engine that builds today's path for each user.
          Source: <code className="text-xs">src/lib/pathEngine.ts</code> + <code className="text-xs">src/hooks/useTodayPath.tsx</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> How a path is built
          </CardTitle>
          <CardDescription>
            One synchronous pass per user per day. No AI. No scoring on main path (scoring only powers the Swap sheet for alternates).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Fetch 7 parallel queries (mood, quiz, routines, dismissals, actions, streak, playlist).</li>
            <li>Decide <strong>Day-1</strong> (no routines + no quiz) vs <strong>Standard</strong>.</li>
            <li>Build ordered step list from the matching template.</li>
            <li>Filter out today's dismissals, active snoozes, and skip-tomorrow markers.</li>
            <li>Apply swap_target replacements from path_step_actions.</li>
            <li>Cap at 8 steps. Reward always last.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Day-1 Flow</CardTitle>
            <CardDescription>New user · no routines · no quiz result</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {dayOneFlow.map((s, i) => <StepRow key={i} s={s} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standard Flow</CardTitle>
            <CardDescription>Returning user · order is fixed (no scoring yet)</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {standardFlow.map((s, i) => <StepRow key={i} s={s} />)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Data sources (current)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            {dataSources.map((d) => (
              <div key={d.table} className="py-2 flex items-start gap-3">
                <code className="text-xs bg-muted px-2 py-0.5 rounded shrink-0">{d.table}</code>
                <span className="text-muted-foreground">{d.purpose}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ResetInventoryCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User actions (per step)</CardTitle>
          <CardDescription>Stored in <code className="text-xs">path_step_actions</code></CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>Skip</strong> — adds to <code>path_dismissals</code> for today only.</div>
          <div><strong>Snooze</strong> — hides step for 15 min (configurable).</div>
          <div><strong>Swap</strong> — replaces step with one of the top 5 ranked alternates from <code>pathScorer.ts</code>.</div>
          <div><strong>Skip tomorrow</strong> — pre-dismisses the step for tomorrow.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Roadmap (not built yet)
          </CardTitle>
          <CardDescription>Engine upgrades planned for upcoming phases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            {roadmap.map((r) => (
              <div key={r.title} className="py-2.5">
                <div className="font-medium">{r.title}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{r.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        This page is documentation only — it doesn't drive runtime behavior. To change the path, edit{" "}
        <code>src/lib/pathEngine.ts</code> and update the flows above to match.
      </p>
    </div>
  );
}