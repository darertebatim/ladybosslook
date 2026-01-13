import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, Image, Video, Link, Play, FileText, ExternalLink, 
  Mic, Square, Send, Pin, Bell, X, Trash2, Upload 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedMessage } from '@/components/feed/FeedMessage';
import { detectVideoType, getVideoPlatformLabel, getVideoEmbedUrl, extractYouTubeId } from '@/lib/videoUtils';

const ACTION_TYPES = [
  { value: 'none', label: 'No Action', icon: null },
  { value: 'play_audio', label: 'Play Audio', icon: Play },
  { value: 'join_session', label: 'Join Session', icon: Video },
  { value: 'view_materials', label: 'View Materials', icon: FileText },
  { value: 'external_link', label: 'External Link', icon: ExternalLink },
];

interface FeedChatComposerProps {
  onSuccess?: () => void;
}

export function FeedChatComposer({ onSuccess }: FeedChatComposerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendPush, setSendPush] = useState(false);
  const [displayName, setDisplayName] = useState('default');
  const [customDisplayName, setCustomDisplayName] = useState('');

  const SENDER_OPTIONS = [
    { value: 'default', label: 'Use my name' },
    { value: 'Razie', label: 'Razie' },
    { value: 'Team', label: 'The Team' },
    { value: 'custom', label: 'Custom...' },
  ];
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Action button
  const [actionType, setActionType] = useState('none');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionPlaylistId, setActionPlaylistId] = useState('');
  
  // Attachments panel
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Detect video type when URL changes
  const detectedVideoType = videoUrl ? detectVideoType(videoUrl) : null;

  const { data: channels } = useQuery({
    queryKey: ['admin-feed-channels'],
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

  const { data: playlists } = useQuery({
    queryKey: ['playlists-for-action'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  const uploadVoiceMessage = async (blob: Blob): Promise<{ url: string; duration: number }> => {
    const fileName = `voice_${Date.now()}.webm`;
    const { data, error } = await supabase.storage
      .from('feed-voice-messages')
      .upload(fileName, blob, { contentType: 'audio/webm' });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('feed-voice-messages')
      .getPublicUrl(data.path);
    
    return { url: publicUrl, duration: recordingDuration };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('feed-attachments')
        .upload(fileName, file, { contentType: file.type });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('feed-attachments')
        .getPublicUrl(data.path);

      setImageUrl(publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error('Failed to upload image: ' + err.message);
    } finally {
      setIsUploadingImage(false);
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const createPost = useMutation({
    mutationFn: async () => {
      let finalAudioUrl: string | null = null;
      let finalAudioDuration: number | null = null;
      
      // Upload voice message if exists
      if (audioBlob) {
        const { url, duration } = await uploadVoiceMessage(audioBlob);
        finalAudioUrl = url;
        finalAudioDuration = duration;
      }

      const actionData: Record<string, any> = {};
      
      if (actionType !== 'none') {
        actionData.label = actionLabel || undefined;
        
        if (actionType === 'play_audio' && actionPlaylistId) {
          actionData.playlistId = actionPlaylistId;
        } else if (['join_session', 'view_materials', 'external_link'].includes(actionType)) {
          actionData.url = actionUrl;
          if (actionType === 'join_session') {
            actionData.meetingUrl = actionUrl;
          }
        }
      }

      const { error } = await supabase.from('feed_posts').insert({
        channel_id: channelId,
        author_id: user?.id,
        post_type: finalAudioUrl ? 'voice_message' : 'announcement',
        title: title || null,
        content: content,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        audio_url: finalAudioUrl,
        audio_duration: finalAudioDuration,
        action_type: actionType,
        action_data: actionData,
        is_pinned: isPinned,
        send_push: sendPush,
        display_name: displayName === 'custom' ? customDisplayName : (displayName === 'default' ? null : displayName),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Message sent!');
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to send: ' + error.message);
    },
  });

  const resetForm = () => {
    setContent('');
    setTitle('');
    setImageUrl('');
    setVideoUrl('');
    setIsPinned(false);
    setSendPush(false);
    setDisplayName('default');
    setCustomDisplayName('');
    setActionType('none');
    setActionLabel('');
    setActionUrl('');
    setActionPlaylistId('');
    clearRecording();
    setShowAttachments(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId) {
      toast.error('Please select a channel');
      return;
    }
    if (!content.trim() && !audioBlob) {
      toast.error('Please add a message or voice recording');
      return;
    }
    createPost.mutate();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Preview post data
  const previewPost = {
    id: 'preview',
    channel_id: channelId,
    author_id: user?.id || '',
    post_type: audioUrl ? 'voice_message' : 'announcement',
    title: title || null,
    content: content,
    image_url: imageUrl || null,
    video_url: videoUrl || null,
    audio_url: audioUrl,
    audio_duration: recordingDuration,
    action_type: actionType as any,
    action_data: actionType !== 'none' ? { label: actionLabel, url: actionUrl, playlistId: actionPlaylistId } : {},
    is_pinned: isPinned,
    is_system: false,
    send_push: sendPush,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    display_name: displayName === 'custom' ? customDisplayName : (displayName === 'default' ? null : displayName),
    author: {
      full_name: profile?.full_name || 'Admin',
      avatar_url: profile?.avatar_url || null,
    },
    channel: channels?.find(c => c.id === channelId),
    reactions_count: {},
    user_reactions: [],
    comments_count: 0,
  };

  const hasContent = content.trim() || audioBlob || imageUrl || videoUrl;

  return (
    <div className="space-y-6">
      {/* Channel and Sender selector */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Channel</Label>
          <Select value={channelId} onValueChange={setChannelId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select channel..." />
            </SelectTrigger>
            <SelectContent>
              {channels?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sender name selector */}
        <div>
          <Label className="text-sm font-medium">Post as</Label>
          <Select value={displayName} onValueChange={setDisplayName}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select sender..." />
            </SelectTrigger>
            <SelectContent>
              {SENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom name input */}
      {displayName === 'custom' && (
        <div>
          <Input
            value={customDisplayName}
            onChange={(e) => setCustomDisplayName(e.target.value)}
            placeholder="Enter custom sender name..."
            className="border-dashed"
          />
        </div>
      )}

      {/* Live Preview */}
      {channelId && hasContent && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">Preview</Label>
          <div className="border rounded-xl bg-background overflow-hidden">
            <FeedMessage 
              post={previewPost as any} 
              allowReactions={false}
            />
          </div>
        </div>
      )}

      {/* Composer */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title (optional) */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="border-none bg-muted/50 focus-visible:ring-1"
          />
        </div>

        {/* Voice recording preview */}
        {audioUrl && (
          <div className="flex items-center gap-3 bg-primary/10 rounded-2xl px-4 py-3">
            <audio src={audioUrl} controls className="flex-1 h-10" />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={clearRecording}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Attachments preview */}
        {(imageUrl || videoUrl) && (
          <div className="flex flex-wrap gap-2">
            {imageUrl && (
              <div className="relative group">
                <img src={imageUrl} alt="" className="h-20 w-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {videoUrl && (
              <div className="relative group bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Video className="h-4 w-4" />
                {detectedVideoType && (
                  <Badge variant="secondary" className="text-xs">
                    {getVideoPlatformLabel(detectedVideoType)}
                  </Badge>
                )}
                <span className="text-sm truncate max-w-32">{videoUrl}</span>
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main input area */}
        <div className="relative">
          <div className="flex items-end gap-2 bg-muted/50 rounded-2xl p-2">
            {/* Attachments button */}
            <Popover open={showAttachments} onOpenChange={setShowAttachments}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                  <Link className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-3 space-y-4">
                {/* Image Section */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste URL or upload..."
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      disabled={isUploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Video Section */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Video URL</Label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube, Vimeo, Instagram, MP4..."
                  />
                  {videoUrl && detectedVideoType && (
                    <Badge variant="secondary" className="text-xs">
                      {getVideoPlatformLabel(detectedVideoType)} detected
                    </Badge>
                  )}
                  {videoUrl && !detectedVideoType && (
                    <p className="text-xs text-muted-foreground">
                      Unsupported format. Use YouTube, Vimeo, Instagram, or direct video URL.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Text input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent border-none px-2 py-2.5",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none",
                "max-h-32 overflow-y-auto"
              )}
              style={{ minHeight: '42px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />

            {/* Voice/Send button */}
            {!content.trim() && !audioBlob ? (
              <Button
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                  </>
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={createPost.isPending || (!content.trim() && !audioBlob)}
                className="shrink-0 h-10 w-10 rounded-full"
              >
                {createPost.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-8 left-0 flex items-center gap-2 text-destructive text-sm">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Recording {formatDuration(recordingDuration)}
            </div>
          )}
        </div>

        {/* Action button settings */}
        <div className="flex flex-wrap gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              id="pin"
              checked={isPinned}
              onCheckedChange={setIsPinned}
              className="h-5 w-9"
            />
            <Label htmlFor="pin" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Pin className="h-3.5 w-3.5" /> Pin
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="push"
              checked={sendPush}
              onCheckedChange={setSendPush}
              className="h-5 w-9"
            />
            <Label htmlFor="push" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Bell className="h-3.5 w-3.5" /> Push
            </Label>
          </div>

          {/* Action button picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                {actionType === 'none' ? 'Add Action' : ACTION_TYPES.find(t => t.value === actionType)?.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3 space-y-3">
              <div>
                <Label className="text-xs">Action Type</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {actionType !== 'none' && (
                <>
                  <div>
                    <Label className="text-xs">Button Label</Label>
                    <Input
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      placeholder="e.g., Listen Now"
                      className="mt-1"
                    />
                  </div>

                  {actionType === 'play_audio' && (
                    <div>
                      <Label className="text-xs">Playlist</Label>
                      <Select value={actionPlaylistId} onValueChange={setActionPlaylistId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {playlists?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {['join_session', 'view_materials', 'external_link'].includes(actionType) && (
                    <div>
                      <Label className="text-xs">URL</Label>
                      <Input
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  )}
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </div>
  );
}
