import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SessionsManager } from '@/components/admin/SessionsManager';
import { useToast } from '@/hooks/use-toast';
import { User, Video, Calendar, Save } from 'lucide-react';

interface OneOnOneRound {
  id: string;
  program_slug: string;
  round_name: string;
  owner_user_id: string;
  instructor_id: string | null;
  google_meet_link: string | null;
  status: string;
  first_session_duration: number | null;
}

export default function OneOnOneClientsManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [openSessions, setOpenSessions] = useState<{
    roundId: string;
    roundName: string;
    programTitle: string;
    programSlug: string;
    defaultMeetLink?: string;
    defaultDuration?: number;
  } | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { instructor_id: string | null; google_meet_link: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data: rounds, isLoading } = useQuery({
    queryKey: ['one-on-one-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select(
          'id, program_slug, round_name, owner_user_id, instructor_id, google_meet_link, status, first_session_duration'
        )
        .eq('is_one_on_one', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as OneOnOneRound[];
    },
  });

  const userIds = Array.from(new Set((rounds || []).map((r) => r.owner_user_id)));
  const slugs = Array.from(new Set((rounds || []).map((r) => r.program_slug)));

  const { data: profiles } = useQuery({
    queryKey: ['one-on-one-profiles', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: catalog } = useQuery({
    queryKey: ['one-on-one-catalog', slugs],
    enabled: slugs.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title, default_session_count')
        .in('slug', slugs);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: instructors } = useQuery({
    queryKey: ['instructors-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, display_name, is_active')
        .order('display_name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sessionCounts } = useQuery({
    queryKey: ['one-on-one-session-counts', (rounds || []).map((r) => r.id)],
    enabled: !!rounds && rounds.length > 0,
    queryFn: async () => {
      const ids = (rounds || []).map((r) => r.id);
      const { data, error } = await supabase
        .from('program_sessions')
        .select('round_id')
        .in('round_id', ids);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data || []) {
        map[row.round_id as string] = (map[row.round_id as string] || 0) + 1;
      }
      return map;
    },
  });

  const handleSave = async (r: OneOnOneRound) => {
    const draft = drafts[r.id];
    if (!draft) return;
    setSaving(r.id);
    try {
      const { error } = await supabase
        .from('program_rounds')
        .update({
          instructor_id: draft.instructor_id,
          google_meet_link: draft.google_meet_link || null,
        })
        .eq('id', r.id);
      if (error) throw error;
      toast({ title: 'Saved' });
      setDrafts((d) => {
        const { [r.id]: _, ...rest } = d;
        return rest;
      });
      qc.invalidateQueries({ queryKey: ['one-on-one-rounds'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading 1:1 clients…</p>;
  }

  if (!rounds || rounds.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No 1:1 clients yet. Mark a program as a 1:1 Service in the Program Catalog
          to start auto-provisioning client rounds on enrollment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each row is one client's private round. Set the instructor and a recurring Google
        Meet link (reused for every session with this client), then schedule sessions.
      </p>

      {rounds.map((r) => {
        const profile = profiles?.find((p: any) => p.id === r.owner_user_id);
        const cat = catalog?.find((c: any) => c.slug === r.program_slug);
        const draft = drafts[r.id] ?? {
          instructor_id: r.instructor_id,
          google_meet_link: r.google_meet_link || '',
        };
        const dirty =
          drafts[r.id] !== undefined &&
          (drafts[r.id].instructor_id !== r.instructor_id ||
            drafts[r.id].google_meet_link !== (r.google_meet_link || ''));
        const scheduled = sessionCounts?.[r.id] || 0;
        const purchased = cat?.default_session_count || null;

        return (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {(profile as any)?.full_name || (profile as any)?.email || 'Unknown user'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat?.title || r.program_slug} · {r.round_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    {scheduled}
                    {purchased ? ` / ${purchased}` : ''} sessions
                  </Badge>
                  <Badge variant={r.status === 'active' ? 'default' : 'outline'}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Instructor</Label>
                  <Select
                    value={draft.instructor_id || 'none'}
                    onValueChange={(v) =>
                      setDrafts((d) => ({
                        ...d,
                        [r.id]: { ...draft, instructor_id: v === 'none' ? null : v },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Unassigned —</SelectItem>
                      {instructors?.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.display_name}
                          {!i.is_active ? ' (inactive)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Video className="h-3 w-3" /> Recurring Google Meet link
                  </Label>
                  <Input
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={draft.google_meet_link}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [r.id]: { ...draft, google_meet_link: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                {dirty && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(r)}
                    disabled={saving === r.id}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving === r.id ? 'Saving…' : 'Save'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setOpenSessions({
                      roundId: r.id,
                      roundName: r.round_name,
                      programTitle: cat?.title || r.program_slug,
                      programSlug: r.program_slug,
                      defaultMeetLink: r.google_meet_link || '',
                      defaultDuration: r.first_session_duration || 60,
                    })
                  }
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Manage sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!openSessions} onOpenChange={(o) => !o && setOpenSessions(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {openSessions && (
            <SessionsManager
              roundId={openSessions.roundId}
              roundName={openSessions.roundName}
              programTitle={openSessions.programTitle}
              programSlug={openSessions.programSlug}
              defaultMeetLink={openSessions.defaultMeetLink}
              defaultDuration={openSessions.defaultDuration}
              onClose={() => setOpenSessions(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}