import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatConversationList } from "@/components/admin/ChatConversationList";
import { ChatPanel } from "@/components/admin/ChatPanel";
import { MobileSupportPreview } from "@/components/admin/MobileSupportPreview";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor } from "lucide-react";
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
    avatar_url?: string | null;
  };
  last_message?: string;
}

export default function Support() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const fetchConversations = async () => {
    try {
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Fetch profiles and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const [profileRes, lastMsgRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
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

    // Subscribe to new conversations
    const channel = supabase
      .channel('admin-conversations')
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
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Optimistically clear the unread count in the list
    if (conv.unread_count_admin > 0) {
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? { ...c, unread_count_admin: 0 } : c
      ));
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Chat</h1>
          <p className="text-muted-foreground">Manage customer support conversations</p>
        </div>
        
        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('desktop')}
            className={cn(
              "h-8 px-3 gap-1.5",
              viewMode === 'desktop' && "bg-background shadow-sm"
            )}
          >
            <Monitor className="h-4 w-4" />
            Desktop
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('mobile')}
            className={cn(
              "h-8 px-3 gap-1.5",
              viewMode === 'mobile' && "bg-background shadow-sm"
            )}
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </Button>
        </div>
      </div>

      {viewMode === 'desktop' ? (
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
      ) : (
        <div className="flex h-[calc(100%-4rem)] gap-4">
          {/* Conversation List */}
          <div className="w-80 shrink-0 border rounded-lg overflow-hidden bg-background">
            <ChatConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id || null}
              onSelect={handleSelectConversation}
              loading={loading}
            />
          </div>

          {/* Mobile Preview Frame */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-6">
            <div className="w-[390px] h-[700px] bg-background rounded-[40px] border-[8px] border-foreground/20 overflow-hidden shadow-2xl relative">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-20" />
              
              {/* Screen content */}
              <div className="h-full pt-6 overflow-hidden">
                <MobileSupportPreview
                  conversation={selectedConversation}
                  onBack={() => setSelectedConversation(null)}
                  onStatusChange={fetchConversations}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
