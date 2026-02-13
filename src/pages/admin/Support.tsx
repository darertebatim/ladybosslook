import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatConversationList } from "@/components/admin/ChatConversationList";
import { ChatPanel } from "@/components/admin/ChatPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  unread_count_admin: number;
  last_message_at: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
  last_message?: string;
}

export default function Support() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMode, setMobileMode] = useState(false);
  const [inboxType, setInboxType] = useState<'support' | 'coach'>('support');

  const fetchConversations = async () => {
    try {
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('inbox_type', inboxType)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Fetch profiles and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const [profileRes, lastMsgRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', conv.user_id)
              .maybeSingle(),
            supabase
              .from('chat_messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          ]);

          return {
            ...conv,
            profiles: profileRes.data || undefined,
            last_message: lastMsgRes.data?.content
          } as Conversation;
        })
      );

      setConversations(conversationsWithDetails);
      
      // Update selected conversation with fresh data if one is selected
      setSelectedConversation(prev => {
        if (!prev) return null;
        const updated = conversationsWithDetails.find(c => c.id === prev.id);
        return updated || prev;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel(`admin-conversations-${inboxType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inboxType]);

  // Reset selection when switching inbox type
  useEffect(() => {
    setSelectedConversation(null);
    setLoading(true);
    fetchConversations();
  }, [inboxType]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Optimistically clear the unread count in the list
    if (conv.unread_count_admin > 0) {
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? { ...c, unread_count_admin: 0 } : c
      ));
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Mobile mode layout (similar to channel chat)
  if (mobileMode) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header with back button in mobile mode */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <Button variant="ghost" size="icon" onClick={handleBackToList}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {selectedConversation ? (selectedConversation.profiles?.full_name || 'Unknown User') : 'Support Chat'}
              </h1>
              <p className="text-muted-foreground">
                {selectedConversation ? selectedConversation.profiles?.email : 'Manage customer support conversations'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selectedConversation && (
              <Tabs value={inboxType} onValueChange={(v) => setInboxType(v as 'support' | 'coach')}>
                <TabsList>
                  <TabsTrigger value="support">Support</TabsTrigger>
                  <TabsTrigger value="coach">Coach</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <Button variant="outline" size="sm" onClick={() => setMobileMode(false)} className="gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </Button>
          </div>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden bg-background">
          {selectedConversation ? (
            <ChatPanel 
              conversation={selectedConversation} 
              onStatusChange={fetchConversations}
            />
          ) : (
            <ChatConversationList
              conversations={conversations}
              selectedId={null}
              onSelect={handleSelectConversation}
              loading={loading}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop mode layout (original side-by-side)
  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Support Chat</h1>
          <p className="text-muted-foreground">Manage customer support conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={inboxType} onValueChange={(v) => setInboxType(v as 'support' | 'coach')}>
            <TabsList>
              <TabsTrigger value="support">Support</TabsTrigger>
              <TabsTrigger value="coach">Coach</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => setMobileMode(true)} className="gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile Mode
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100%-4rem)] border rounded-lg overflow-hidden bg-background">
        {/* Conversation List */}
        <div className="w-80 shrink-0">
          <ChatConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
            loading={loading}
          />
        </div>

        {/* Chat Panel */}
        <div className="flex-1">
          <ChatPanel 
            conversation={selectedConversation} 
            onStatusChange={fetchConversations}
          />
        </div>
      </div>
    </div>
  );
}
