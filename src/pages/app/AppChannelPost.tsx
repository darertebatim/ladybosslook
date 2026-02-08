import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Send, Image, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Channel {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
}

export default function AppChannelPost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sendPush, setSendPush] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('feed_channels')
        .select('id, name, slug, cover_image_url')
        .eq('is_archived', false)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching channels:', error);
        toast.error('Failed to load channels');
      } else {
        setChannels(data || []);
      }
      setIsLoading(false);
    };

    fetchChannels();
  }, []);

  const handleBack = () => {
    if (selectedChannel) {
      setSelectedChannel(null);
      setContent('');
      setTitle('');
      setImageUrl('');
      setSendPush(false);
    } else {
      const from = (location.state as any)?.from;
      navigate(from || '/app/profile');
    }
  };

  const handleSend = async () => {
    if (!selectedChannel || !content.trim()) {
      toast.error('Please select a channel and enter a message');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('feed_posts').insert({
        channel_id: selectedChannel.id,
        content: content.trim(),
        title: title.trim() || null,
        image_url: imageUrl.trim() || null,
        post_type: 'announcement',
        is_system: true,
        display_name: 'Simora',
        author_id: user?.id,
        send_push: sendPush,
      });

      if (error) throw error;

      toast.success('Message sent to ' + selectedChannel.name);
      setSelectedChannel(null);
      setContent('');
      setTitle('');
      setImageUrl('');
      setSendPush(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Get channel cover - handle emoji: prefix
  const getChannelCover = (channel: Channel) => {
    if (channel.cover_image_url?.startsWith('emoji:')) {
      return channel.cover_image_url.replace('emoji:', '');
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* iOS-style Header */}
      <div 
        className="flex items-center gap-2 px-2 py-2 border-b bg-background/95 backdrop-blur-sm"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          {selectedChannel ? 'Channels' : 'Back'}
        </Button>
        <h1 className="flex-1 text-center font-semibold text-lg pr-12">
          {selectedChannel ? selectedChannel.name : 'New Channel Post'}
        </h1>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {!selectedChannel ? (
          // Channel Selection
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Select a channel to post a message as Simora
            </p>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : channels.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No channels available</p>
            ) : (
              channels.map((channel) => {
                const emoji = getChannelCover(channel);
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 transition-colors text-left"
                  >
                    {emoji ? (
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                        {emoji}
                      </div>
                    ) : channel.cover_image_url ? (
                      <img 
                        src={channel.cover_image_url} 
                        alt={channel.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Megaphone className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{channel.name}</p>
                      <p className="text-sm text-muted-foreground">#{channel.slug}</p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                  </button>
                );
              })
            )}
          </div>
        ) : (
          // Compose Message
          <div className="p-4 space-y-4">
            {/* Title (optional) */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm text-muted-foreground">
                Title (optional)
              </Label>
              <Input
                id="title"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm text-muted-foreground">
                Message *
              </Label>
              <Textarea
                id="content"
                placeholder="Write your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] rounded-xl resize-none"
              />
            </div>

            {/* Image URL (optional) */}
            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm text-muted-foreground flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image URL (optional)
              </Label>
              <Input
                id="image"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rounded-xl"
              />
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-40 object-cover rounded-xl mt-2"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            {/* Send Push Toggle */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-card border border-border/50">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Send Push Notification</p>
                <p className="text-xs text-muted-foreground">Notify all channel members</p>
              </div>
              <Switch
                checked={sendPush}
                onCheckedChange={setSendPush}
              />
            </div>

            {/* Preview Card */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">💜</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Simora</p>
                  {title && <p className="font-semibold text-sm mt-1">{title}</p>}
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                    {content || 'Your message will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Button (only when composing) */}
      {selectedChannel && (
        <div 
          className="p-4 border-t bg-background"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          <Button
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className="w-full h-12 rounded-xl text-base font-medium"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send as Simora
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
