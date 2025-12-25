import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, Bell, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Broadcast {
  id: string;
  title: string | null;
  content: string;
  target_type: string;
  target_course: string | null;
  sent_count: number;
  send_push: boolean;
  send_email: boolean;
  created_at: string;
}

export function BroadcastHistory() {
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
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(broadcast.created_at), 'MMM d, h:mm a')}
                  </span>
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
