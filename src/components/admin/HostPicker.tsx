import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, User } from 'lucide-react';

export type HostAssignment = {
  host_id: string;
  role: 'host' | 'co-host' | 'guest';
  display_name?: string;
  photo_url?: string | null;
};

interface HostPickerProps {
  value: HostAssignment[];
  onChange: (hosts: HostAssignment[]) => void;
  label?: string;
  hint?: string;
}

/**
 * Reusable picker for assigning one or more hosts (instructors) to a piece of
 * content. Held in component state — parent is responsible for persisting the
 * resulting list to `content_hosts` after the parent record is saved.
 */
export function HostPicker({ value, onChange, label = 'Hosts', hint }: HostPickerProps) {
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, display_name, photo_url')
        .eq('is_active', true)
        .order('display_name');
      if (error) throw error;
      return data || [];
    },
  });

  const [pendingId, setPendingId] = useState<string>('');

  // Hydrate display_name / photo_url for any incoming host_ids without them
  useEffect(() => {
    if (!instructors.length) return;
    const needsHydration = value.some(
      (h) => h.display_name === undefined,
    );
    if (!needsHydration) return;
    onChange(
      value.map((h) => {
        if (h.display_name !== undefined) return h;
        const inst = instructors.find((i: any) => i.id === h.host_id);
        return {
          ...h,
          display_name: inst?.display_name,
          photo_url: inst?.photo_url,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructors]);

  const available = instructors.filter(
    (i: any) => !value.some((h) => h.host_id === i.id),
  );

  const addHost = () => {
    if (!pendingId) return;
    const inst = instructors.find((i: any) => i.id === pendingId);
    if (!inst) return;
    onChange([
      ...value,
      {
        host_id: inst.id,
        role: value.length === 0 ? 'host' : 'co-host',
        display_name: inst.display_name,
        photo_url: inst.photo_url,
      },
    ]);
    setPendingId('');
  };

  const removeHost = (host_id: string) => {
    onChange(value.filter((h) => h.host_id !== host_id));
  };

  const updateRole = (host_id: string, role: HostAssignment['role']) => {
    onChange(value.map((h) => (h.host_id === host_id ? { ...h, role } : h)));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((h) => (
            <div
              key={h.host_id}
              className="flex items-center gap-2 rounded-lg border bg-card p-2"
            >
              {h.photo_url ? (
                <img
                  src={h.photo_url}
                  alt={h.display_name || ''}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 text-sm font-medium truncate">
                {h.display_name || h.host_id}
              </span>
              <Select
                value={h.role}
                onValueChange={(v) => updateRole(h.host_id, v as HostAssignment['role'])}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="co-host">Co-host</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeHost(h.host_id)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex gap-2">
          <Select value={pendingId} onValueChange={setPendingId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a host…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addHost} disabled={!pendingId} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      )}

      {instructors.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No active instructors. Add some on the Instructors page first.
        </p>
      )}
    </div>
  );
}

/**
 * Persist the picker's host list to `content_hosts` after the parent record
 * has been saved. Replaces all existing host links for the (type, id) pair.
 */
export async function saveContentHosts(
  contentType: 'playlist' | 'routine' | 'program',
  contentId: string,
  hosts: HostAssignment[],
) {
  // Wipe existing
  await (supabase as any)
    .from('content_hosts')
    .delete()
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  if (!hosts.length) return;

  const rows = hosts.map((h, idx) => ({
    host_id: h.host_id,
    content_type: contentType,
    content_id: contentId,
    role: h.role,
    sort_order: idx,
  }));

  const { error } = await (supabase as any).from('content_hosts').insert(rows);
  if (error) throw error;
}

/** Load existing host assignments for a content record (for edit forms). */
export async function loadContentHosts(
  contentType: 'playlist' | 'routine' | 'program',
  contentId: string,
): Promise<HostAssignment[]> {
  const { data, error } = await (supabase as any)
    .from('content_hosts')
    .select('host_id, role, sort_order, instructors(display_name, photo_url)')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('sort_order');
  if (error) throw error;
  return (data || []).map((r: any) => ({
    host_id: r.host_id,
    role: r.role,
    display_name: r.instructors?.display_name,
    photo_url: r.instructors?.photo_url,
  }));
}