import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, NotebookPen, User, Calendar, Heart, Share2, Loader2, ChevronRight, Send } from 'lucide-react';
import { format } from 'date-fns';
import { getMoodEmoji } from '@/components/app/MoodSelector';

interface SharedJournal {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  shared_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export function SharedJournalsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<SharedJournal | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareChannelId, setShareChannelId] = useState('');
  const [shareDisplayName, setShareDisplayName] = useState('Razie');

  // Fetch shared journal entries
  const { data: journals, isLoading } = useQuery({
    queryKey: ['shared-journals', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('shared_with_admin', true)
        .order('shared_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each entry
      const entriesWithProfiles = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', entry.user_id)
            .maybeSingle();
          
          return {
            ...entry,
            profiles: profile || undefined,
          } as SharedJournal;
        })
      );

      return entriesWithProfiles;
    },
  });

  // Fetch channels for sharing
  const { data: channels } = useQuery({
    queryKey: ['feed-channels-for-share'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('*')
        .eq('is_archived', false)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Share to channel mutation
  const shareToChannelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJournal || !shareChannelId) {
        throw new Error('Missing journal or channel');
      }

      const moodEmoji = getMoodEmoji(selectedJournal.mood);
      const userDisplay = selectedJournal.profiles?.full_name || 'A member';
      
      // Create a post from the journal entry
      const content = `✨ **Shared Reflection from ${userDisplay}** ${moodEmoji || ''}\n\n${selectedJournal.content}`;

      const { error } = await supabase.from('feed_posts').insert({
        channel_id: shareChannelId,
        author_id: user?.id,
        post_type: 'announcement',
        title: selectedJournal.title || 'A Personal Reflection',
        content: content,
        is_pinned: false,
        send_push: false,
        display_name: shareDisplayName || 'Razie',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Journal shared to channel!');
      setShowShareDialog(false);
      setSelectedJournal(null);
      setShareChannelId('');
    },
    onError: (error) => {
      toast.error('Failed to share: ' + error.message);
    },
  });

  const handleShareToChannel = () => {
    if (!shareChannelId) {
      toast.error('Please select a channel');
      return;
    }
    shareToChannelMutation.mutate();
  };

  const getDisplayTitle = (journal: SharedJournal): string => {
    if (journal.title && journal.title.trim()) return journal.title;
    const firstLine = journal.content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0) {
      return firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine;
    }
    return format(new Date(journal.created_at), 'EEEE, MMMM d');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Shared Journals</h2>
        <p className="text-muted-foreground">
          View journal entries that members have shared with you
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search journals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Journals list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : journals && journals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <NotebookPen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Shared Journals Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              When members share their journal entries with you, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {journals?.map((journal) => (
            <Card
              key={journal.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedJournal(journal)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {journal.profiles?.full_name || journal.profiles?.email || 'Unknown'}
                      </span>
                      {journal.mood && (
                        <span className="text-lg">{getMoodEmoji(journal.mood)}</span>
                      )}
                    </div>
                    <h3 className="font-medium truncate">{getDisplayTitle(journal)}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {journal.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(journal.created_at), 'MMM d, yyyy')}
                      </span>
                      {journal.shared_at && (
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          Shared {format(new Date(journal.shared_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Journal Detail Dialog */}
      <Dialog open={!!selectedJournal && !showShareDialog} onOpenChange={(open) => !open && setSelectedJournal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedJournal?.mood && (
                <span className="text-2xl">{getMoodEmoji(selectedJournal.mood)}</span>
              )}
              {selectedJournal && getDisplayTitle(selectedJournal)}
            </DialogTitle>
            <DialogDescription>
              From {selectedJournal?.profiles?.full_name || selectedJournal?.profiles?.email || 'Unknown'} •{' '}
              {selectedJournal && format(new Date(selectedJournal.created_at), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh]">
            <div className="pr-4 whitespace-pre-wrap text-sm leading-relaxed">
              {selectedJournal?.content}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedJournal(null)}>
              Close
            </Button>
            <Button onClick={() => setShowShareDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Share to Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share to Channel Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Channel</DialogTitle>
            <DialogDescription>
              Share this reflection with your community. The member's identity will be visible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Channel</label>
              <Select value={shareChannelId} onValueChange={setShareChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a channel..." />
                </SelectTrigger>
                <SelectContent>
                  {channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Post as</label>
              <Select value={shareDisplayName} onValueChange={setShareDisplayName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Razie">Razie</SelectItem>
                  <SelectItem value="The Team">The Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-muted-foreground">
                ✨ Shared Reflection from {selectedJournal?.profiles?.full_name || 'A member'}{' '}
                {selectedJournal?.mood && getMoodEmoji(selectedJournal.mood)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareToChannel}
              disabled={shareToChannelMutation.isPending || !shareChannelId}
            >
              {shareToChannelMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Share to Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}