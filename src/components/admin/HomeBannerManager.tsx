import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, EyeOff, Video, Link, Megaphone, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { detectVideoType, extractYouTubeId, getVideoPlatformLabel } from '@/lib/videoUtils';

interface HomeBanner {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  video_url: string | null;
  background_color: string | null;
  icon: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export function HomeBannerManager() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setButtonText('');
    setButtonUrl('');
    setVideoUrl('');
    setIsActive(true);
    setPriority(0);
    setStartsAt('');
    setEndsAt('');
    setEditingBanner(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (banner: HomeBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description || '');
    setButtonText(banner.button_text || '');
    setButtonUrl(banner.button_url || '');
    setVideoUrl(banner.video_url || '');
    setIsActive(banner.is_active);
    setPriority(banner.priority);
    setStartsAt(banner.starts_at ? banner.starts_at.slice(0, 16) : '');
    setEndsAt(banner.ends_at ? banner.ends_at.slice(0, 16) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      const bannerData = {
        title: title.trim(),
        description: description.trim() || null,
        button_text: buttonText.trim() || null,
        button_url: buttonUrl.trim() || null,
        video_url: videoUrl.trim() || null,
        is_active: isActive,
        priority,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('home_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);
        if (error) throw error;
        toast.success('Banner updated');
      } else {
        const { error } = await supabase
          .from('home_banners')
          .insert(bannerData);
        if (error) throw error;
        toast.success('Banner created');
      }

      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (banner: HomeBanner) => {
    try {
      const { error } = await supabase
        .from('home_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);
      if (error) throw error;
      toast.success(banner.is_active ? 'Banner deactivated' : 'Banner activated');
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Failed to update banner');
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      const { error } = await supabase
        .from('home_banners')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Banner deleted');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  // Preview helpers
  const detectedVideoType = videoUrl ? detectVideoType(videoUrl) : null;
  const youtubeId = detectedVideoType === 'youtube' ? extractYouTubeId(videoUrl) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Home Banners
          </CardTitle>
          <CardDescription>
            Create banners with custom messages, buttons, and videos for the app home screen
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Banner title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description text"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g., Watch Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonUrl">Button URL</Label>
                  <Input
                    id="buttonUrl"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="e.g., /app/courses or https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Video URL
                </Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube, Vimeo, Instagram, or direct MP4 link"
                />
                <p className="text-xs text-muted-foreground">
                  Supports: YouTube, Vimeo, Instagram Reels, TikTok, or direct video files (.mp4, .webm)
                </p>
                
                {/* Video preview */}
                {detectedVideoType && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Play className="h-4 w-4" />
                      <span>Detected: <strong>{getVideoPlatformLabel(detectedVideoType)}</strong></span>
                    </div>
                    {youtubeId && (
                      <div className="rounded-lg overflow-hidden border">
                        <img 
                          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                          alt="YouTube thumbnail"
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    {detectedVideoType === 'direct' && (
                      <video
                        src={videoUrl}
                        className="w-full rounded-lg"
                        controls
                        muted
                      />
                    )}
                    {(detectedVideoType === 'instagram' || detectedVideoType === 'tiktok') && (
                      <p className="text-xs text-muted-foreground">
                        Will open in external app (embeds not supported)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Schedule Start (optional)</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">Schedule End (optional)</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority (higher = shown first)</Label>
                <Input
                  id="priority"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading banners...</p>
        ) : banners.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No banners yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => {
              const bannerVideoType = banner.video_url ? detectVideoType(banner.video_url) : null;
              
              return (
                <div
                  key={banner.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    banner.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{banner.title}</span>
                      {bannerVideoType && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                          {getVideoPlatformLabel(bannerVideoType)}
                        </span>
                      )}
                      {banner.button_url && (
                        <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      {!banner.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    {banner.description && (
                      <p className="text-sm text-muted-foreground truncate">{banner.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Priority: {banner.priority}
                      {banner.starts_at && ` • Starts: ${format(new Date(banner.starts_at), 'MMM d, h:mm a')}`}
                      {banner.ends_at && ` • Ends: ${format(new Date(banner.ends_at), 'MMM d, h:mm a')}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(banner)}
                      title={banner.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBanner(banner.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
