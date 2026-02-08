import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatConversationList } from "@/components/admin/ChatConversationList";
import { ChatPanel } from "@/components/admin/ChatPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function AppAdminSupport() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

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
      .channel('app-admin-conversations')
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
    if (conv.unread_count_admin > 0) {
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? { ...c, unread_count_admin: 0 } : c
      ));
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-top">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={selectedConversation ? handleBackToList : () => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">
            {selectedConversation 
              ? (selectedConversation.profiles?.full_name || 'Unknown User')
              : 'Support Inbox'
            }
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {selectedConversation 
              ? selectedConversation.profiles?.email 
              : `${conversations.length} conversations`
            }
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
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
