import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';
import { getCurrentZone, FASTING_PROTOCOLS, type FastingZone } from '@/lib/fastingZones';

interface FastingSession {
  id: string;
  protocol: string;
  fasting_hours: number;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export type FastingMode = 'idle' | 'fasting' | 'eating';

interface FastingState {
  activeSession: FastingSession | null;
  selectedProtocol: string;
  selectedFastingHours: number;
  elapsedSeconds: number;
  currentZone: FastingZone;
  progress: number;
  pastSessions: FastingSession[];
  isLoading: boolean;
  // Eating window
  mode: FastingMode;
  eatingElapsedSeconds: number;
  eatingTotalSeconds: number;
  eatingEndTime: Date | null;
  lastEndedSession: FastingSession | null;
}

export function useFastingTracker() {
  const { user } = useAuth();
  const [state, setState] = useState<FastingState>({
    activeSession: null,
    selectedProtocol: '16:8',
    selectedFastingHours: 16,
    elapsedSeconds: 0,
    currentZone: getCurrentZone(0),
    progress: 0,
    pastSessions: [],
    isLoading: true,
    mode: 'idle',
    eatingElapsedSeconds: 0,
    eatingTotalSeconds: 0,
    eatingEndTime: null,
    lastEndedSession: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevZoneRef = useRef<string>('');

  // Compute eating window from the most recent completed session
  const computeEatingWindow = useCallback((session: FastingSession): { mode: FastingMode; eatingElapsed: number; eatingTotal: number; eatingEnd: Date | null } => {
    if (!session.ended_at) return { mode: 'idle', eatingElapsed: 0, eatingTotal: 0, eatingEnd: null };
    
    const protocol = FASTING_PROTOCOLS.find(p => p.id === session.protocol);
    const fastingHours = session.fasting_hours;
    const eatingHours = 24 - fastingHours;
    
    if (eatingHours <= 0) return { mode: 'idle', eatingElapsed: 0, eatingTotal: 0, eatingEnd: null };
    
    const endedAt = new Date(session.ended_at).getTime();
    const eatingEndTime = new Date(endedAt + eatingHours * 3600000);
    const now = Date.now();
    
    if (now >= eatingEndTime.getTime()) {
      return { mode: 'idle', eatingElapsed: 0, eatingTotal: 0, eatingEnd: null };
    }
    
    const eatingElapsed = Math.floor((now - endedAt) / 1000);
    const eatingTotal = eatingHours * 3600;
    
    return { mode: 'eating', eatingElapsed, eatingTotal, eatingEnd: eatingEndTime };
  }, []);

  // Load active session and preferences
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [sessRes, prefRes, histRes] = await Promise.all([
        supabase
          .from('fasting_sessions' as any)
          .select('*')
          .eq('user_id', user.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1),
        supabase
          .from('fasting_preferences' as any)
          .select('*')
          .eq('user_id', user.id)
          .limit(1),
        supabase
          .from('fasting_sessions' as any)
          .select('*')
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(50),
      ]);

      const active = (sessRes.data as any)?.[0] || null;
      const pref = (prefRes.data as any)?.[0];
      const history = (histRes.data as any) || [];

      // Check if most recent completed session has an active eating window
      let mode: FastingMode = 'idle';
      let eatingElapsed = 0;
      let eatingTotal = 0;
      let eatingEnd: Date | null = null;
      let lastEnded: FastingSession | null = null;

      if (active) {
        mode = 'fasting';
      } else if (history.length > 0) {
        const lastSession = history[0] as FastingSession;
        const eating = computeEatingWindow(lastSession);
        mode = eating.mode;
        eatingElapsed = eating.eatingElapsed;
        eatingTotal = eating.eatingTotal;
        eatingEnd = eating.eatingEnd;
        if (eating.mode === 'eating') lastEnded = lastSession;
      }

      setState(prev => ({
        ...prev,
        activeSession: active,
        selectedProtocol: pref?.default_protocol || '16:8',
        selectedFastingHours: pref?.default_fasting_hours || 16,
        pastSessions: history,
        isLoading: false,
        mode,
        eatingElapsedSeconds: eatingElapsed,
        eatingTotalSeconds: eatingTotal,
        eatingEndTime: eatingEnd,
        lastEndedSession: lastEnded,
      }));
    };
    load();
  }, [user, computeEatingWindow]);

  // Timer tick — handles both fasting and eating modes
  useEffect(() => {
    if (state.mode === 'idle') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tick = () => {
      if (state.mode === 'fasting' && state.activeSession) {
        const startedAt = new Date(state.activeSession.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startedAt) / 1000);
        const elapsedHours = elapsed / 3600;
        const zone = getCurrentZone(elapsedHours);
        const targetSeconds = state.activeSession.fasting_hours * 3600;
        const progress = Math.min(elapsed / targetSeconds, 1);

        if (zone.id !== prevZoneRef.current && prevZoneRef.current !== '') {
          haptic.success();
        }
        prevZoneRef.current = zone.id;

        setState(prev => ({
          ...prev,
          elapsedSeconds: elapsed,
          currentZone: zone,
          progress,
        }));
      } else if (state.mode === 'eating' && state.lastEndedSession?.ended_at) {
        const endedAt = new Date(state.lastEndedSession.ended_at).getTime();
        const eatingHours = 24 - state.lastEndedSession.fasting_hours;
        const eatingEndMs = endedAt + eatingHours * 3600000;
        const now = Date.now();

        if (now >= eatingEndMs) {
          // Eating window ended
          setState(prev => ({
            ...prev,
            mode: 'idle',
            eatingElapsedSeconds: 0,
            eatingTotalSeconds: 0,
            eatingEndTime: null,
            lastEndedSession: null,
          }));
          return;
        }

        const eatingElapsed = Math.floor((now - endedAt) / 1000);
        const eatingTotal = eatingHours * 3600;

        setState(prev => ({
          ...prev,
          eatingElapsedSeconds: eatingElapsed,
          eatingTotalSeconds: eatingTotal,
        }));
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.mode, state.activeSession, state.lastEndedSession]);

  const startFast = useCallback(async () => {
    if (!user) return;
    haptic.medium();
    const { data, error } = await supabase
      .from('fasting_sessions' as any)
      .insert({
        user_id: user.id,
        protocol: state.selectedProtocol,
        fasting_hours: state.selectedFastingHours,
        started_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (!error && data) {
      setState(prev => ({
        ...prev,
        activeSession: data as any,
        mode: 'fasting',
        eatingElapsedSeconds: 0,
        eatingTotalSeconds: 0,
        eatingEndTime: null,
        lastEndedSession: null,
      }));
    }
  }, [user, state.selectedProtocol, state.selectedFastingHours]);

  const endFast = useCallback(async () => {
    if (!user || !state.activeSession) return;
    haptic.success();
    const endedAt = new Date().toISOString();
    const { error } = await supabase
      .from('fasting_sessions' as any)
      .update({ ended_at: endedAt } as any)
      .eq('id', state.activeSession.id);

    if (!error) {
      const ended = { ...state.activeSession, ended_at: endedAt };
      
      // Compute eating window for the just-ended session
      const eating = computeEatingWindow(ended);
      
      setState(prev => ({
        ...prev,
        activeSession: null,
        elapsedSeconds: 0,
        progress: 0,
        currentZone: getCurrentZone(0),
        pastSessions: [ended, ...prev.pastSessions],
        mode: eating.mode,
        eatingElapsedSeconds: eating.eatingElapsed,
        eatingTotalSeconds: eating.eatingTotal,
        eatingEndTime: eating.eatingEnd,
        lastEndedSession: eating.mode === 'eating' ? ended : null,
      }));
      return ended;
    }
    return null;
  }, [user, state.activeSession, computeEatingWindow]);

  const deleteFast = useCallback(async (sessionId: string) => {
    if (!user) return;
    await supabase.from('fasting_sessions' as any).delete().eq('id', sessionId);
    setState(prev => ({
      ...prev,
      pastSessions: prev.pastSessions.filter(s => s.id !== sessionId),
    }));
  }, [user]);

  const setProtocol = useCallback(async (protocolId: string) => {
    if (!user) return;
    const protocol = FASTING_PROTOCOLS.find(p => p.id === protocolId);
    if (!protocol) return;
    haptic.light();
    setState(prev => ({
      ...prev,
      selectedProtocol: protocol.id,
      selectedFastingHours: protocol.fastingHours,
    }));

    await supabase
      .from('fasting_preferences' as any)
      .upsert({
        user_id: user.id,
        default_protocol: protocol.id,
        default_fasting_hours: protocol.fastingHours,
      } as any, { onConflict: 'user_id' });
  }, [user]);

  const setCustomHours = useCallback((hours: number) => {
    setState(prev => ({
      ...prev,
      selectedProtocol: 'custom',
      selectedFastingHours: hours,
    }));
  }, []);

  return {
    ...state,
    startFast,
    endFast,
    deleteFast,
    setProtocol,
    setCustomHours,
  };
}
