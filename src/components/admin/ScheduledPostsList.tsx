import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, CalendarClock, Send, Trash2, Megaphone,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduledRow {
  id: string;
  channel_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  scheduled_for: string;
  send_push: boolean;
  is_pinned: boolean;
  display_name: string | null;
  channel: { name: string } | null;
  author: { full_name: string | null } | null;
}

interface ScheduledFeedPostRpcRow {
  id: string;
  channel_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  scheduled_for: string;
  send_push: boolean;
  is_pinned: boolean;
  display_name: string | null;
  channel_name: string | null;
  author_full_name: string | null;
}

export function ScheduledPostsList() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['scheduled-feed-posts'],
    queryFn: async () => {
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_scheduled_feed_posts');

      if (!rpcError && rpcData) {
        return ((rpcData as unknown as ScheduledFeedPostRpcRow[])).map((row) => ({
          id: row.id,
          channel_id: row.channel_id,
          title: row.title,
          content: row.content,
          image_url: row.image_url,
          scheduled_for: row.scheduled_for,
          send_push: row.send_push,
          is_pinned: row.is_pinned,
          display_name: row.display_name,
          channel: row.channel_name ? { name: row.channel_name } : null,
          author: { full_name: row.author_full_name },
        })) as ScheduledRow[];
      }

      const isMissingRpc = rpcError && /get_scheduled_feed_posts/i.test(rpcError.message);
      if (rpcError && !isMissingRpc) throw rpcError;

      const { data, error } = await supabase
        .from('feed_posts')
        .select(`
          id, channel_id, title, content, image_url, scheduled_for,
          send_push, is_pinned, display_name,
          channel:feed_channels!feed_posts_channel_id_fkey(name),
          author:profiles!feed_posts_author_id_fkey(full_name)
        `)
        .not('scheduled_for', 'is', null)
        .gt('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ScheduledRow[];
    },
    refetchInterval: 30000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['scheduled-feed-posts'] });
    queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    queryClient.invalidateQueries({ queryKey: ['channel-summaries'] });
  };

  const sendNow = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('feed_posts')
        .update({ scheduled_for: null, created_at: now, updated_at: now })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Sent'); },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });

  const cancelScheduled = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Scheduled post deleted'); },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });

  const reschedule = useMutation({
    mutationFn: async ({ id, when }: { id: string; when: Date }) => {
      const { error } = await supabase
        .from('feed_posts')
        .update({ scheduled_for: when.toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Rescheduled'); },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No scheduled posts.</p>
        <p className="text-xs mt-1">Pick a future date+time from the composer to schedule a message.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <ScheduledRowItem
          key={p.id}
          row={p}
          onSendNow={() => sendNow.mutate(p.id)}
          onDelete={() => cancelScheduled.mutate(p.id)}
          onReschedule={(when) => reschedule.mutate({ id: p.id, when })}
          isSending={sendNow.isPending}
        />
      ))}
    </div>
  );
}

function ScheduledRowItem({
  row, onSendNow, onDelete, onReschedule, isSending,
}: {
  row: ScheduledRow;
  onSendNow: () => void;
  onDelete: () => void;
  onReschedule: (when: Date) => void;
  isSending: boolean;
}) {
  const initial = new Date(row.scheduled_for);
  const [date, setDate] = useState<Date | undefined>(initial);
  const [time, setTime] = useState<string>(format(initial, 'HH:mm'));
  const [open, setOpen] = useState(false);

  const senderName = row.display_name || row.author?.full_name || 'Admin';

  return (
    <div className="border rounded-xl p-4 bg-card flex gap-4">
      {row.image_url ? (
        <img src={row.image_url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-1">
          <Badge variant="secondary" className="font-normal">
            {row.channel?.name || 'Channel'}
          </Badge>
          <span>{senderName}</span>
          {row.send_push && <Badge variant="outline" className="font-normal">Push</Badge>}
          {row.is_pinned && <Badge variant="outline" className="font-normal">Pinned</Badge>}
        </div>
        {row.title && <p className="text-sm font-medium truncate">{row.title}</p>}
        <p className="text-sm text-muted-foreground line-clamp-2">{row.content}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            <CalendarClock className="h-3 w-3 mr-1" />
            {format(initial, 'EEE, MMM d • h:mm a')}
          </Badge>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7">
                Reschedule
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0" sideOffset={6}>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today;
                }}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
              <div className="p-3 border-t flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 w-32"
                />
                <Button
                  size="sm"
                  className="ml-auto h-8"
                  onClick={() => {
                    if (!date) return;
                    const [h, m] = time.split(':').map(Number);
                    const when = new Date(date);
                    when.setHours(h || 0, m || 0, 0, 0);
                    if (when.getTime() <= Date.now() + 30_000) {
                      toast.error('Pick a time in the future');
                      return;
                    }
                    onReschedule(when);
                    setOpen(false);
                  }}
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button" variant="outline" size="sm" className="h-7"
            onClick={onSendNow} disabled={isSending}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" /> Send now
          </Button>
          <Button
            type="button" variant="ghost" size="sm" className="h-7 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
