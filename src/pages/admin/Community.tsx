import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedChannelManager } from '@/components/admin/FeedChannelManager';
import { FeedChatComposer } from '@/components/admin/FeedChatComposer';
import { FeedPostsList } from '@/components/admin/FeedPostsList';
import { SharedJournalsManager } from '@/components/admin/SharedJournalsManager';

export default function Community() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Feed</h1>
        <p className="text-muted-foreground">
          Send messages and manage your community channels
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">New Message</TabsTrigger>
          <TabsTrigger value="posts">History</TabsTrigger>
          <TabsTrigger value="journals">Shared Journals</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <FeedChatComposer onSuccess={() => setActiveTab('posts')} />
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <FeedPostsList />
        </TabsContent>

        <TabsContent value="journals" className="mt-6">
          <SharedJournalsManager />
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <FeedChannelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
