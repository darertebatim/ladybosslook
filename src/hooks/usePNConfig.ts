import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Push Notification Configuration from server
 * Admin controls content/timing, app schedules local notifications
 */
export interface PNConfig {
  id: string;
  notification_key: string;
  title: string;
  body: string;
  emoji: string;
  schedule_hour: number;
  schedule_minute: number;
  repeat_days: number[];
  is_enabled: boolean;
  sound: string;
  is_urgent: boolean;
  category: string;
  sort_order: number;
  updated_at: string;
}

interface UsePNConfigReturn {
  configs: PNConfig[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastSyncedAt: Date | null;
}

/**
 * Hook to fetch and subscribe to push notification configurations
 * Used by both:
 * - Admin UI (to manage configs)
 * - Local notification scheduler (to schedule notifications)
 */
export function usePNConfig(): UsePNConfigReturn {
  const [configs, setConfigs] = useState<PNConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pn_config')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setConfigs(data || []);
      setLastSyncedAt(new Date());
      console.log('[PNConfig] Fetched', data?.length || 0, 'notification configs');
    } catch (err) {
      console.error('[PNConfig] Error fetching configs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch configs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    // Initial fetch
    fetchConfigs();

    // Set up realtime subscription
    const channel = supabase
      .channel('pn_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pn_config',
        },
        (payload: RealtimePostgresChangesPayload<PNConfig>) => {
          console.log('[PNConfig] Realtime update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            setConfigs(prev => [...prev, payload.new as PNConfig].sort((a, b) => a.sort_order - b.sort_order));
          } else if (payload.eventType === 'UPDATE') {
            setConfigs(prev => 
              prev.map(c => c.id === (payload.new as PNConfig).id ? payload.new as PNConfig : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setConfigs(prev => prev.filter(c => c.id !== (payload.old as PNConfig).id));
          }
          
          setLastSyncedAt(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConfigs]);

  return {
    configs,
    isLoading,
    error,
    refetch: fetchConfigs,
    lastSyncedAt,
  };
}

/**
 * Hook to update a single PN config (admin only)
 */
export function useUpdatePNConfig() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateConfig = useCallback(async (
    id: string, 
    updates: Partial<Omit<PNConfig, 'id' | 'notification_key' | 'updated_at'>>
  ) => {
    try {
      setIsUpdating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('pn_config')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      console.log('[PNConfig] Updated config:', id);
      return true;
    } catch (err) {
      console.error('[PNConfig] Error updating config:', err);
      setError(err instanceof Error ? err.message : 'Failed to update config');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { updateConfig, isUpdating, error };
}
