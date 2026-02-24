import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioManager } from '@/components/admin/AudioManager';
import { MediaCategoryManager } from '@/components/admin/MediaCategoryManager';
import { Music, Tag } from 'lucide-react';

export default function Audio() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audio Management</h2>
        <p className="text-muted-foreground">Manage audio content, playlists, and tracks</p>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <AudioManager />
        </TabsContent>

        <TabsContent value="categories">
          <MediaCategoryManager type="audio" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
