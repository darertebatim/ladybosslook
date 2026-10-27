import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { resolveFinalResult, type Personality } from '@/utils/selfcare-personality-scoring';
import type { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';

/**
 * Quiz result picks: 1 playlist + 1 breathing exercise + 1 reflection.
 * Replaces the old "suggested tasks" step — no planner tasks are created.
 */
const PREFS: Record<Personality, { breath: string[]; reflection: string[]; playlist: RegExp }> = {
  giver:         { breath: ['emotion-based', 'calm'], reflection: ['emotion-based', 'deep-dives'], playlist: /love|self|kind|connect|heart/i },
  achiever:      { breath: ['calm', 'night'],         reflection: ['reset', 'calm'],               playlist: /rest|calm|sleep|slow/i },
  survivor:      { breath: ['calm', 'emotion-based'], reflection: ['reset', 'calm'],               playlist: /calm|gentle|heal|comfort/i },
  ghost:         { breath: ['energize', 'focus'],     reflection: ['big-picture', 'deep-dives'],   playlist: /present|wake|self|confiden/i },
  perfectionist: { breath: ['calm', 'focus'],         reflection: ['emotion-based', 'reset'],      playlist: /kind|enough|confiden|self/i },
  ruminator:     { breath: ['calm', 'night'],         reflection: ['calm', 'night'],               playlist: /calm|anxi|sleep|mind/i },
};

interface Pick { id: string; title: string; emoji: string; kicker: string; href: string }

interface Props { step: OnboardingStep; onNext: () => void; answers?: OnboardingAnswers }

function pickBy<T extends { category?: string | null }>(rows: T[], cats: string[]): T | null {
  for (const c of cats) { const m = rows.find((r) => r.category === c); if (m) return m; }
  return rows[0] ?? null;
}

export function ScpPicksScreen({ step, onNext, answers }: Props) {
  const navigate = useNavigate();
  const personality = useMemo<Personality>(() => {
    const raw = answers?.['scp-diagnosis'];
    if (typeof raw === 'string') { try { return JSON.parse(raw).personality; } catch { /* noop */ } }
    return resolveFinalResult(answers || {}).personality;
  }, [answers]);
  const [picks, setPicks] = useState<Pick[] | null>(null);

  useEffect(() => {
    const prefs = PREFS[personality] || PREFS.survivor;
    (async () => {
      const [pl, br, rf] = await Promise.all([
        supabase.from('audio_playlists').select('id, name, category, requires_subscription')
          .eq('is_hidden', false).eq('available_on_mobile', true).order('sort_order').limit(80),
        supabase.from('breathing_exercises').select('id, name, emoji, category')
          .eq('is_active', true).order('sort_order'),
        supabase.from('reflections').select('id, title, emoji, category')
          .eq('is_active', true).order('sort_order'),
      ]);
      const out: Pick[] = [];
      const pls = (pl.data ?? []) as any[];
      const p = pls.find((x) => !x.requires_subscription && prefs.playlist.test(`${x.name} ${x.category ?? ''}`))
        ?? pls.find((x) => !x.requires_subscription) ?? pls[0];
      if (p) out.push({ id: p.id, title: p.name, emoji: '🎧', kicker: 'Listen', href: `/app/player/playlist/${p.id}` });
      const b = pickBy((br.data ?? []) as any[], prefs.breath);
      if (b) out.push({ id: b.id, title: b.name, emoji: b.emoji || '🌬️', kicker: 'Breathe', href: `/app/breathe?exercise=${b.id}` });
      const r = pickBy((rf.data ?? []) as any[], prefs.reflection);
      if (r) out.push({ id: r.id, title: r.title, emoji: r.emoji || '✍️', kicker: 'Reflect', href: `/app/reflections/${r.id}` });
      setPicks(out);
    })();
  }, [personality]);

  const open = (href: string) => {
    haptic.light();
    try { localStorage.setItem('simora_onboarding_completed_selfcare-personality-quiz', 'true'); } catch { /* noop */ }
    navigate(href);
  };

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-14 pb-6 bg-white overflow-y-auto">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <h2 className="text-[24px] font-bold text-[#1a1f3d] mb-1 text-center">Picked for you</h2>
        <p className="text-sm text-[#1a1f3d]/60 mb-6 text-center">
          One thing to listen to, one to breathe, one to reflect on.
        </p>
        {!picks ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#1a1f3d]/50" /></div>
        ) : (
          <div className="space-y-3">
            {picks.map((p) => (
              <button
                key={p.kicker}
                onClick={() => open(p.href)}
                className="w-full min-h-[64px] flex items-center gap-3 p-4 rounded-2xl bg-white border border-black/10 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a1f3d]/5 flex items-center justify-center shrink-0">
                  <FluentEmoji emoji={p.emoji} size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1a1f3d]/60">{p.kicker}</p>
                  <p className="text-[15px] font-medium text-[#1a1f3d] leading-snug line-clamp-2">{p.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#1a1f3d]/40 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => { haptic.light(); onNext(); }}
        className="w-full max-w-md mx-auto mt-6 py-4 rounded-full bg-[#1a1f3d] text-white font-semibold text-base active:opacity-80"
      >
        {step.buttonLabel || 'Continue'}
      </button>
    </div>
  );
}
