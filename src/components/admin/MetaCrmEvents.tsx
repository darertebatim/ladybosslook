import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Send } from 'lucide-react';

interface CrmRow {
  id: string;
  stage: string;
  event_name: string;
  email: string | null;
  source: string | null;
  status: string;
  occurred_at: string;
  created_at: string;
}

const STAGE_LABEL: Record<string, string> = {
  attended: 'Attended webinar',
  purchased: 'Purchased / enrolled',
  qualified: 'Qualified lead',
  email_engaged: 'Email engaged',
};

export function MetaCrmEvents() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const { data: rows, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['meta-crm-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_crm_events')
        .select('id, stage, event_name, email, source, status, occurred_at, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as CrmRow[]) || [];
    },
  });

  const counts = (rows || []).reduce<Record<string, number>>((acc, r) => {
    acc[r.stage] = (acc[r.stage] || 0) + 1;
    return acc;
  }, {});

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-crm-event', {
        body: { mode: 'sync' },
      });
      if (error) throw error;
      toast({
        title: 'Sync complete',
        description: `Sent ${data?.sent ?? 0} new events, skipped ${data?.skipped ?? 0} already-sent.`,
      });
      refetch();
    } catch (err: any) {
      toast({
        title: 'Sync failed',
        description: err?.message || 'Could not send CRM events to Meta.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meta CRM events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Website leads are already sent live through the Conversions API. This sends the{' '}
            <strong>downstream stages</strong> — purchases, email engagement, attendance and
            qualified leads — so Meta can optimize for people who actually convert. Contact details
            are SHA-256 hashed before sending; each stage is sent once per person.
          </p>

          <div className="flex flex-wrap gap-2">
            {Object.entries(STAGE_LABEL).map(([key, label]) => (
              <Badge key={key} variant="secondary">
                {label}: {counts[key] || 0}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runSync} disabled={syncing}>
              <Send className="mr-2 h-4 w-4" />
              {syncing ? 'Sending…' : 'Sync purchases & email engagement (last 90 days)'}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Attendance and qualified-lead stages are sent from the checkmarks in Programs →
            Students.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Meta event</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows || []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{STAGE_LABEL[r.stage] || r.stage}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.event_name}</TableCell>
                    <TableCell className="font-medium">{r.email || '—'}</TableCell>
                    <TableCell className="text-xs">{r.source || '—'}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(r.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
