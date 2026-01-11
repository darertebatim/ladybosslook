import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedChannelManager } from '@/components/admin/FeedChannelManager';
import { FeedPostCreator } from '@/components/admin/FeedPostCreator';
import { FeedPostsList } from '@/components/admin/FeedPostsList';

export default function Community() {
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Feed</h1>
        <p className="text-muted-foreground">
          Manage channels and create posts for your community
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="create">Create Post</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <FeedPostsList />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <FeedPostCreator onSuccess={() => setActiveTab('posts')} />
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <FeedChannelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
