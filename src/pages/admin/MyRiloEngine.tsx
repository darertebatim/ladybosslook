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

/* ─────────── Door-aware Day 1–3 path (NEW) ─────────── */

const doorSignatures = [
  {
    door: "selfcare",
    emoji: "🧠",
    label: "Self-Care",
    signature: "60-sec Self-Care Quiz → personalized reset",
    deeper: "Open today's Reset (door-flavored)",
  },
  {
    door: "immigrant",
    emoji: "🌍",
    label: "Immigrant / Bilingual",
    signature: "Open Bilingual Strength playlist (+ sleep story series)",
    deeper: "Continue the bilingual series · emotion-tagged breath",
  },
  {
    door: "productivity",
    emoji: "📋",
    label: "Productivity",
    signature: "Open Planner → Rilo Planner Onboarding → pick first routine",
    deeper: "Plan tomorrow · 1 quick routine task",
  },
  {
    door: "emotion",
    emoji: "💛",
    label: "Emotion",
    signature: "Tag-matched playlist for picked emotion + matching breath + reflection",
    deeper: "Second emotion-tagged step (breath ↔ reflection alternate)",
  },
  {
    door: "exploring",
    emoji: "✨",
    label: "Exploring",
    signature: "Curated tour: 1 playlist + Self-Care Quiz + Planner peek",
    deeper: "Browse routines · 1 Reset",
  },
];

const day1Flow = [
  { emoji: "🚪", title: "Primary door signature step", meta: "Hero — door-flavored (see table above)", kind: "door_signature", isNew: true },
  { emoji: "🌬️", title: "Reset (door-flavored)", meta: "See Vocabulary card above", kind: "reset", isNew: true },
  { emoji: "✨", title: "Browse routines (pick your first)", meta: "Always shown on Day 1", kind: "routine" },
  { emoji: "🧠", title: "Self-Care Quiz teaser", meta: "Injected if Self-Care isn't a chosen door & quiz not done · skippable", kind: "quiz_pick", isNew: true },
  { emoji: "📋", title: "Rilo Planner Onboarding teaser", meta: "Injected if Productivity isn't a chosen door & planner onboarding not done · skippable", kind: "planner_onb", isNew: true },
  { emoji: "🏆", title: "+1 day streak & a new affirmation", meta: "Always last", kind: "reward" },
];

const day2Flow = [
  { emoji: "🚪", title: "Secondary door signature step", meta: "Hero — secondary door's signature (fallback: primary deeper)", kind: "door_signature", isNew: true },
  { emoji: "🔁", title: "Primary door deeper step", meta: "Booster — keeps primary thread alive", kind: "door_deeper", isNew: true },
  { emoji: "🌬️", title: "Reset (door-flavored)", meta: "See Vocabulary card above", kind: "reset" },
  { emoji: "🔥", title: "Continue routine from Day 1", meta: "Picks the first active routine", kind: "routine" },
  { emoji: "🏆", title: "Streak + affirmation", meta: "Always last", kind: "reward" },
];

const day3Flow = [
  { emoji: "🌱", title: "Habit cement: today's routine", meta: "Lead with routine — turns 'try' into 'rhythm'", kind: "routine", isNew: true },
  { emoji: "🚪", title: "Secondary door deeper step", meta: "Keeps secondary alive", kind: "door_deeper" },
  { emoji: "🎧", title: "Featured playlist", meta: "Door-aware pick (emotion tag, bilingual, etc.)", kind: "playlist" },
  { emoji: "🌬️", title: "Reset (door-flavored)", meta: "See Vocabulary card above", kind: "reset" },
  { emoji: "🏆", title: "Streak + affirmation", meta: "Always last", kind: "reward" },
];

/* Example scenarios — primary × secondary combinations */
const scenarios = [
  {
    name: "A · Emotion (sad) + Self-Care",
    days: [
      "Day 1: Playlist tagged 'sadness/depressed' → emotion-tagged breath → Browse routines → Self-Care Quiz teaser",
      "Day 2: Self-Care Quiz (secondary signature) → second emotion-tagged step → reflection reset → continue routine",
      "Day 3: Routine first → Self-Care deeper (quiz outcome routine) → bilingual-or-emotion playlist → reset",
    ],
  },
  {
    name: "B · Immigrant + Productivity",
    days: [
      "Day 1: Bilingual Strength playlist → bilingual sleep story → Browse routines → Planner Onboarding teaser (productivity is secondary, so it still gets seeded)",
      "Day 2: Planner Onboarding + pick first routine (secondary signature) → bilingual continue (primary deeper) → reset",
      "Day 3: Routine first → 'Plan tomorrow' (secondary deeper) → bilingual playlist → reset",
    ],
  },
  {
    name: "C · Productivity + Emotion (anxious)",
    days: [
      "Day 1: Open Planner → Rilo Planner Onboarding → pick first routine → Browse routines → emotion-tagged anxiety breath (because emotion is secondary)",
      "Day 2: Anxiety-tagged playlist (secondary signature) → 1 quick routine task (primary deeper) → reflection reset",
      "Day 3: Routine first → anxiety reflection (secondary deeper) → playlist → reset",
    ],
  },
  {
    name: "D · Self-Care only (no secondary)",
    days: [
      "Day 1: Self-Care Quiz → quiz-outcome reset → Browse routines → Planner Onboarding teaser (productivity not picked)",
      "Day 2: Primary deeper (open today's reset) → routine continue → reset → playlist",
      "Day 3: Routine first → reset → playlist → reward",
    ],
  },
  {
    name: "E · Exploring + Emotion (lonely)",
    days: [
      "Day 1: Curated tour (1 playlist + quiz + planner peek) → lonely/homesick-tagged breath → Browse routines",
      "Day 2: Lonely playlist (secondary signature) → exploring deeper (1 reset) → routine",
      "Day 3: Routine first → lonely reflection → playlist → reset",
    ],
  },
];

/* Emotion picker → tag-slug mapping (1:1; picker keys ARE tag slugs). */
const emotionTagMap = [
  { key: "stressed", slugs: ["stressed"] },
  { key: "anxiety", slugs: ["anxiety"] },
  { key: "sadness", slugs: ["sadness"] },
  { key: "anger", slugs: ["anger"] },
  { key: "overwhelm", slugs: ["overwhelm"] },
  { key: "worry", slugs: ["worry"] },
  { key: "fear", slugs: ["fear"] },
  { key: "irritation", slugs: ["irritation"] },
  { key: "exhausted", slugs: ["exhausted"] },
  { key: "low-energy", slugs: ["low-energy"] },
  { key: "lonely", slugs: ["lonely"] },
  { key: "missing-someone", slugs: ["missing-someone"] },
  { key: "homesick", slugs: ["homesick"] },
  { key: "depressed", slugs: ["depressed"] },
  { key: "envy", slugs: ["envy"] },
];

const standardFlow = [
  { emoji: "💛", title: "Mood check-in", meta: "1 min · pick your mood", kind: "mood" },
  { emoji: "🎧", title: "Today's playlist (ready to play)", meta: "Language match → sort_order", kind: "playlist" },
  { emoji: "🌬️", title: "Reset", meta: "See Vocabulary card above (Day 4+: no door flavor, generic pool)", kind: "reset", isNew: true },
  { emoji: "🔥", title: "Open your Planner (first active routine)", meta: "Quiz outcome already provisioned the routine — navigates to /app/home", kind: "routine" },
  { emoji: "🏆", title: "+1 day streak & a new affirmation", meta: "Reward (always last, never skippable)", kind: "reward" },
];

const dataSources = [
  { table: "emotion_logs", purpose: "Today's mood check-in + valence → mood label for scorer" },
  { table: "selfcare_quiz_results", purpose: "Quiz outcome → routine provisioned via provisionRiloPicks (no separate quiz_pick step)" },
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

type FlowStep = { emoji: string; title: string; meta: string; kind: string; isNew?: boolean };
const StepRow = ({ s }: { s: FlowStep }) => (
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

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">Vocabulary</CardTitle>
          <CardDescription>One definition, used everywhere on this page.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌬️</span>
              <span className="font-semibold">Reset</span>
              <Badge variant="outline" className="text-[10px] font-mono">reset</Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              A single 2–3 min step that resolves to <strong>one breath OR one reflection</strong>, picked deterministically by date seed (alternates day-to-day, deep-links to the specific item). It is <strong>always one item</strong>, never both.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mt-1.5">
              <strong>"Door-flavored"</strong> means the picker is filtered by the user's door before the date seed runs:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside ml-2 mt-1 space-y-0.5">
              <li><strong>Emotion door</strong> → only items tagged with the picked emotion slug (strict)</li>
              <li><strong>Immigrant door</strong> → bilingual item if one exists, else generic</li>
              <li><strong>Self-Care door</strong> → quiz-outcome category if available, else generic</li>
              <li><strong>Productivity / Exploring / no match</strong> → generic 2-min calm pool</li>
              <li><strong>Day 4+ (Standard flow)</strong> → no door flavor, generic pool only</li>
            </ul>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            Whenever you see <em>"Reset"</em>, <em>"reset"</em>, or <em>"door-flavored reset"</em> below — it means this exact step. There is no second concept.
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Door signatures</CardTitle>
          <CardDescription>
            Each Rilo Door has a <strong>signature step</strong> (Day 1 hero) and a <strong>deeper step</strong> (Day 2/3 booster).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="divide-y">
            {doorSignatures.map((d) => (
              <div key={d.door} className="py-2.5 flex items-start gap-3">
                <div className="text-xl leading-none">{d.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{d.label}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{d.door}</Badge>
                  </div>
                  <div className="text-xs mt-0.5"><span className="text-muted-foreground">Signature:</span> {d.signature}</div>
                  <div className="text-xs mt-0.5"><span className="text-muted-foreground">Deeper:</span> {d.deeper}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Day 1 · Door tease</CardTitle>
            <CardDescription>Primary door's signature is the hero. No mood check-in.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {day1Flow.map((s, i) => <StepRow key={i} s={s} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Day 2 · Secondary + reinforce</CardTitle>
            <CardDescription>Secondary signature leads, primary stays alive.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {day2Flow.map((s, i) => <StepRow key={i} s={s} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Day 3 · Habit cement</CardTitle>
            <CardDescription>Routine first. Standard flow takes over after Day 3.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {day3Flow.map((s, i) => <StepRow key={i} s={s} />)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example 3-day scenarios</CardTitle>
          <CardDescription>Primary × Secondary door combinations and the resulting path.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          {scenarios.map((s) => (
            <div key={s.name} className="rounded-lg border p-3">
              <div className="font-medium mb-1.5">{s.name}</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {s.days.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emotion → tag-slug map</CardTitle>
          <CardDescription>
            Strict match. Used when primary door = emotion. Source: <code className="text-xs">useTodayPath.tsx · EMOTION_KEY_TO_TAG_SLUGS</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            {emotionTagMap.map((e) => (
              <div key={e.key} className="py-2 flex items-start gap-3">
                <code className="text-xs bg-muted px-2 py-0.5 rounded shrink-0">{e.key}</code>
                <div className="flex-1 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {e.slugs.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] font-mono">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standard Flow (Day 4+)</CardTitle>
          <CardDescription>Returning user · once the 3-day door path is complete</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {standardFlow.map((s, i) => <StepRow key={i} s={s} />)}
        </CardContent>
      </Card>

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