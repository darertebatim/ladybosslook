import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, Bell, Mail, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Broadcast {
  id: string;
  title: string | null;
  content: string;
  target_type: string;
  target_course: string | null;
  sent_count: number;
  send_push: boolean;
  send_email: boolean;
  link_url: string | null;
  link_text: string | null;
  created_at: string;
}

export function BroadcastHistory() {
  const queryClient = useQueryClient();
  
  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['broadcast-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Broadcast[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      // First delete all chat messages that reference this broadcast
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('broadcast_id', broadcastId);
      
      if (messagesError) throw messagesError;
      
      // Then delete the broadcast itself
      const { error: broadcastError } = await supabase
        .from('broadcast_messages')
        .delete()
        .eq('id', broadcastId);
      
      if (broadcastError) throw broadcastError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });
      toast.success('Broadcast deleted from all chats');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete broadcast');
    }
  });

  const getTargetLabel = (broadcast: Broadcast) => {
    if (broadcast.target_type === 'all') return 'All Students';
    if (broadcast.target_type === 'round') return `Specific Round`;
    if (broadcast.target_course) return broadcast.target_course;
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Broadcast History
        </CardTitle>
        <CardDescription>
          Recent broadcast messages sent to user chats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {broadcasts && broadcasts.length > 0 ? (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div 
                key={broadcast.id}
                className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {broadcast.title || 'Untitled Broadcast'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {broadcast.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getTargetLabel(broadcast)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {broadcast.sent_count} delivered
                      </div>
                      {broadcast.send_push && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Bell className="h-3 w-3" />
                          Push
                        </div>
                      )}
                      {broadcast.send_email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          Email
                        </div>
                      )}
                      {broadcast.link_url && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <LinkIcon className="h-3 w-3" />
                          Link
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(broadcast.created_at), 'MMM d, h:mm a')}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this broadcast and remove it from all {broadcast.sent_count} user chats. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(broadcast.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No broadcasts sent yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
