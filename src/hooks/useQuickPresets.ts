import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PROTEIN_PRESETS } from '@/lib/proteinTracking';

export type QuickPresetTool = 'protein' | 'water';

export interface QuickPreset {
  id: string;
  label: string;
  amount: number;
  iconKey: string | null;
  portion?: string | null;
  sortOrder: number;
  isDefault: boolean;
}

function defaultsFor(tool: QuickPresetTool): QuickPreset[] {
  if (tool === 'protein') {
    return PROTEIN_PRESETS.map((p, i) => ({
      id: `default-${i}`,
      label: p.label,
      amount: p.value,
      iconKey: p.iconKey ?? null,
      portion: p.portion ?? null,
      sortOrder: i,
      isDefault: true,
    }));
  }
  return [];
}

export function useQuickPresets(tool: QuickPresetTool) {
  const queryClient = useQueryClient();
  const key = ['quick-presets', tool];

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<QuickPreset[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return defaultsFor(tool);

      const { data, error } = await supabase
        .from('user_quick_presets')
        .select('*')
        .eq('user_id', userId)
        .eq('tool', tool)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return defaultsFor(tool);

      return data.map((row) => ({
        id: row.id,
        label: row.label,
        amount: Number(row.amount),
        iconKey: row.icon,
        sortOrder: row.sort_order,
        isDefault: false,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const isUsingDefaults = (query.data ?? []).every((p) => p.isDefault);

  // Persist the current defaults so they become editable rows
  const materialize = async (): Promise<QuickPreset[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error('Not signed in');

    const { data: existing } = await supabase
      .from('user_quick_presets')
      .select('id')
      .eq('user_id', userId)
      .eq('tool', tool)
      .limit(1);

    if (existing && existing.length > 0) return query.data ?? [];

    const rows = defaultsFor(tool).map((p, i) => ({
      user_id: userId,
      tool,
      label: p.label,
      amount: p.amount,
      icon: p.iconKey,
      sort_order: i,
    }));
    const { error } = await supabase.from('user_quick_presets').insert(rows);
    if (error) throw error;
    return [];
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const upsertPreset = useMutation({
    mutationFn: async (input: { id?: string; label: string; amount: number; iconKey?: string | null }) => {
      await materialize();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not signed in');

      if (input.id && !input.id.startsWith('default-')) {
        const { error } = await supabase
          .from('user_quick_presets')
          .update({ label: input.label, amount: input.amount, icon: input.iconKey ?? null })
          .eq('id', input.id);
        if (error) throw error;
        return;
      }

      const { count } = await supabase
        .from('user_quick_presets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tool', tool);

      const { error } = await supabase.from('user_quick_presets').insert({
        user_id: userId,
        tool,
        label: input.label,
        amount: input.amount,
        icon: input.iconKey ?? null,
        sort_order: count ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      await materialize();
      if (id.startsWith('default-')) {
        // After materializing, delete by label match
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const label = (query.data ?? []).find((p) => p.id === id)?.label;
        if (!userId || !label) return;
        const { error } = await supabase
          .from('user_quick_presets')
          .delete()
          .eq('user_id', userId)
          .eq('tool', tool)
          .eq('label', label);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('user_quick_presets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const resetPresets = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      const { error } = await supabase
        .from('user_quick_presets')
        .delete()
        .eq('user_id', userId)
        .eq('tool', tool);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    presets: query.data ?? defaultsFor(tool),
    isLoading: query.isLoading,
    isUsingDefaults,
    upsertPreset,
    deletePreset,
    resetPresets,
  };
}
