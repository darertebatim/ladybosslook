import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedChannelManager } from '@/components/admin/FeedChannelManager';
import { FeedChatComposer } from '@/components/admin/FeedChatComposer';
import { AdminChannelChat } from '@/components/admin/AdminChannelChat';
import { SharedJournalsManager } from '@/components/admin/SharedJournalsManager';

export default function Community() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Channels</h1>
        <p className="text-muted-foreground">
          Send messages and manage your community channels
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">New Message</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="journals">Journals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <FeedChatComposer onSuccess={() => setActiveTab('messages')} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <AdminChannelChat />
        </TabsContent>

        <TabsContent value="journals" className="mt-6">
          <SharedJournalsManager />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <FeedChannelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
