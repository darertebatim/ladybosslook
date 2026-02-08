import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send, Image, Video, Link, Play, FileText, ExternalLink, 
  Mic, Square, Pin, Bell, X, Trash2, Upload, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { detectVideoType, getVideoPlatformLabel } from '@/lib/videoUtils';

const ACTION_TYPES = [
  { value: 'none', label: 'No Action', icon: null },
  { value: 'play_audio', label: 'Play Audio', icon: Play },
  { value: 'join_session', label: 'Join Session', icon: Video },
  { value: 'view_materials', label: 'View Materials', icon: FileText },
  { value: 'external_link', label: 'External Link', icon: ExternalLink },
];

const SENDER_OPTIONS = [
  { value: 'Simora', label: 'Simora' },
  { value: 'default', label: 'Use my name' },
  { value: 'Razie', label: 'Razie' },
  { value: 'Team', label: 'The Team' },
  { value: 'custom', label: 'Custom...' },
];

export default function AppChannelPost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendPush, setSendPush] = useState(false);
  const [displayName, setDisplayName] = useState('Simora');
  const [customDisplayName, setCustomDisplayName] = useState('');

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Waveform visualization
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Action button
  const [actionType, setActionType] = useState('none');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionPlaylistId, setActionPlaylistId] = useState('');

  // Attachments
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Detected video type
  const detectedVideoType = videoUrl ? detectVideoType(videoUrl) : null;

  // Fetch channels
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['admin-feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('id, name, slug, cover_image_url')
        .eq('is_archived', false)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch playlists for action button
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

  // Voice recording with waveform
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

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
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevels([]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);

      // Animate waveform
      const updateWaveform = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const levels = Array.from(dataArray.slice(0, 20)).map(v => v / 255);
          setAudioLevels(levels);
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
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

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

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
      setShowAttachments(false);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error('Failed to upload: ' + err.message);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // Camera capture (native)
  const handleCameraCapture = async () => {
    if (!Capacitor.isNativePlatform()) {
      imageInputRef.current?.click();
      return;
    }

    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (photo.base64String) {
        setIsUploadingImage(true);
        const fileName = `camera_${Date.now()}.${photo.format}`;
        const blob = await fetch(`data:image/${photo.format};base64,${photo.base64String}`).then(r => r.blob());

        const { data, error } = await supabase.storage
          .from('feed-attachments')
          .upload(fileName, blob, { contentType: `image/${photo.format}` });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('feed-attachments')
          .getPublicUrl(data.path);

        setImageUrl(publicUrl);
        setShowAttachments(false);
        toast.success('Photo uploaded!');
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        toast.error('Camera error: ' + err.message);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async () => {
      let finalAudioUrl: string | null = null;
      let finalAudioDuration: number | null = null;

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
        is_system: displayName === 'Simora',
        display_name: displayName === 'custom' ? customDisplayName : (displayName === 'default' ? null : displayName),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Message sent!');
      resetForm();
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
    setDisplayName('Simora');
    setCustomDisplayName('');
    setActionType('none');
    setActionLabel('');
    setActionUrl('');
    setActionPlaylistId('');
    clearRecording();
    setShowAttachments(false);
  };

  const handleBack = () => {
    const from = (location.state as any)?.from;
    navigate(from || '/app/profile');
  };

  const handleSubmit = () => {
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

  const hasContent = content.trim() || audioBlob || imageUrl || videoUrl;

  // Auto-resize textarea
  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 150) + 'px';
  };

  // iOS keyboard scroll fix
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    };

    const textarea = textareaRef.current;
    textarea?.addEventListener('focus', handleFocus);
    return () => textarea?.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* iOS Header */}
      <div
        className="flex items-center gap-2 px-2 py-2 border-b bg-background/95 backdrop-blur-sm shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <Button variant="ghost" size="sm" onClick={handleBack} className="text-primary">
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
        <h1 className="flex-1 text-center font-semibold text-lg pr-12">New Post</h1>
      </div>

      {/* Scroll Container */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Channel & Sender Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Channel</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {channels?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Post as</Label>
            <Select value={displayName} onValueChange={setDisplayName}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom name */}
        {displayName === 'custom' && (
          <Input
            value={customDisplayName}
            onChange={(e) => setCustomDisplayName(e.target.value)}
            placeholder="Enter custom name..."
            className="rounded-xl"
            dir="auto"
          />
        )}

        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="rounded-xl bg-muted/50 border-0"
          dir="auto"
        />

        {/* Voice Recording Preview */}
        {audioUrl && (
          <div className="flex items-center gap-3 bg-primary/10 rounded-2xl px-4 py-3">
            <audio src={audioUrl} controls className="flex-1 h-10" />
            <Button type="button" variant="ghost" size="icon" onClick={clearRecording}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Attachments Preview */}
        {(imageUrl || videoUrl) && (
          <div className="flex flex-wrap gap-2">
            {imageUrl && (
              <div className="relative group">
                <img src={imageUrl} alt="" className="h-24 w-24 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {videoUrl && (
              <div className="relative bg-muted rounded-xl px-3 py-2 flex items-center gap-2">
                <Video className="h-4 w-4" />
                {detectedVideoType && (
                  <Badge variant="secondary" className="text-xs">
                    {getVideoPlatformLabel(detectedVideoType)}
                  </Badge>
                )}
                <span className="text-sm truncate max-w-24">{videoUrl}</span>
                <button type="button" onClick={() => setVideoUrl('')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="relative">
          <div className="flex items-end gap-2 bg-muted/50 rounded-2xl p-2">
            {/* Attachments Button */}
            <Popover open={showAttachments} onOpenChange={setShowAttachments}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                  <Link className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3 space-y-3">
                {/* Camera */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleCameraCapture}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Take Photo
                </Button>

                {/* Image Upload */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Image URL..."
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isUploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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

                {/* Video URL */}
                <div className="space-y-1">
                  <Label className="text-xs">Video URL</Label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube, Vimeo..."
                    className="text-sm"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Text Input - RTL support via dir="auto" */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onInput={handleTextareaInput}
              placeholder="Type a message..."
              dir="auto"
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent border-none px-2 py-2.5",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none",
                "max-h-36 overflow-y-auto"
              )}
              style={{ minHeight: '42px' }}
            />

            {/* Voice / Send Button */}
            {!content.trim() && !audioBlob ? (
              <Button
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                disabled={createPost.isPending}
                onClick={handleSubmit}
                className="shrink-0 h-10 w-10 rounded-full"
              >
                {createPost.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Recording Indicator with Waveform */}
          {isRecording && (
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2 text-destructive text-sm">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <div className="flex items-center gap-0.5 h-6">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="w-1 bg-destructive rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, level * 24)}px` }}
                  />
                ))}
              </div>
              <span>{formatDuration(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch id="pin" checked={isPinned} onCheckedChange={setIsPinned} className="h-5 w-9" />
            <Label htmlFor="pin" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Pin className="h-3.5 w-3.5" /> Pin
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="push" checked={sendPush} onCheckedChange={setSendPush} className="h-5 w-9" />
            <Label htmlFor="push" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Bell className="h-3.5 w-3.5" /> Push
            </Label>
          </div>

          {/* Action Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg">
                {actionType === 'none' ? 'Add Action' : ACTION_TYPES.find(t => t.value === actionType)?.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 space-y-3">
              <div>
                <Label className="text-xs">Action Type</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
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
      </div>

      {/* Bottom Safe Area */}
      <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </div>
  );
}
