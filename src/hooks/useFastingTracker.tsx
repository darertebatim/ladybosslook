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

interface FastingState {
  activeSession: FastingSession | null;
  selectedProtocol: string;
  selectedFastingHours: number;
  elapsedSeconds: number;
  currentZone: FastingZone;
  progress: number;
  pastSessions: FastingSession[];
  isLoading: boolean;
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
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevZoneRef = useRef<string>('');

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

      setState(prev => ({
        ...prev,
        activeSession: active,
        selectedProtocol: pref?.default_protocol || '16:8',
        selectedFastingHours: pref?.default_fasting_hours || 16,
        pastSessions: history,
        isLoading: false,
      }));
    };
    load();
  }, [user]);

  // Timer tick
  useEffect(() => {
    if (!state.activeSession) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tick = () => {
      const startedAt = new Date(state.activeSession!.started_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startedAt) / 1000);
      const elapsedHours = elapsed / 3600;
      const zone = getCurrentZone(elapsedHours);
      const targetSeconds = state.activeSession!.fasting_hours * 3600;
      const progress = Math.min(elapsed / targetSeconds, 1);

      // Haptic on zone change
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
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.activeSession]);

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
      setState(prev => ({ ...prev, activeSession: data as any }));
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
      setState(prev => ({
        ...prev,
        activeSession: null,
        elapsedSeconds: 0,
        progress: 0,
        currentZone: getCurrentZone(0),
        pastSessions: [ended, ...prev.pastSessions],
      }));
      return ended;
    }
    return null;
  }, [user, state.activeSession]);

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

  return {
    ...state,
    startFast,
    endFast,
    deleteFast,
    setProtocol,
  };
}
