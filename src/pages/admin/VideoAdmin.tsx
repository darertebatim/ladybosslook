import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlaylistManager } from '@/components/admin/VideoPlaylistManager';
import { VideoManager } from '@/components/admin/VideoManager';
import { MediaCategoryManager } from '@/components/admin/MediaCategoryManager';
import { Video, Tag } from 'lucide-react';

export default function VideoAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Video Management</h2>
        <p className="text-muted-foreground">Manage video content, playlists, and tracks</p>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <VideoPlaylistManager />
          <VideoManager />
        </TabsContent>

        <TabsContent value="categories">
          <MediaCategoryManager type="video" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
