import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatConversationList } from "@/components/admin/ChatConversationList";
import { ChatPanel } from "@/components/admin/ChatPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [inboxType, setInboxType] = useState<'support' | 'coach'>('support');

  const fetchConversations = async () => {
    try {
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('inbox_type', inboxType)
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
      .channel(`app-admin-conversations-${inboxType}`)
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

  useEffect(() => {
    setSelectedConversation(null);
    setLoading(true);
    fetchConversations();
  }, [inboxType]);

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

  const handleBack = () => {
    if (selectedConversation) {
      handleBackToList();
    } else {
      // Navigate back to profile or previous page
      const from = (location.state as any)?.from;
      if (from) {
        navigate(from);
      } else {
        navigate('/app/profile');
      }
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* iOS-style Header with safe area */}
      <div 
        className="flex items-center gap-2 px-2 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
      >
        <Button 
          variant="ghost" 
          size="sm"
          className="h-10 px-2 gap-1 text-primary hover:text-primary active:scale-95"
          onClick={handleBack}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-[17px]">
            {selectedConversation ? 'Inbox' : 'Back'}
          </span>
        </Button>
        <div className="flex-1 min-w-0 text-center pr-12">
          {selectedConversation ? (
            <>
              <h1 className="text-[17px] font-semibold truncate">
                {selectedConversation.profiles?.full_name || 'Unknown User'}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedConversation.profiles?.email}
              </p>
            </>
          ) : (
            <Tabs value={inboxType} onValueChange={(v) => setInboxType(v as 'support' | 'coach')} className="w-full flex justify-center">
              <TabsList className="h-8">
                <TabsTrigger value="support" className="text-xs px-3 py-1">Support</TabsTrigger>
                <TabsTrigger value="coach" className="text-xs px-3 py-1">Coach</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Content with proper overflow handling */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedConversation ? (
          <ChatPanel 
            conversation={selectedConversation} 
            onStatusChange={fetchConversations}
          />
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <ChatConversationList
              conversations={conversations}
              selectedId={null}
              onSelect={handleSelectConversation}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Safe area bottom spacer for list view */}
      {!selectedConversation && (
        <div className="shrink-0" style={{ height: "env(safe-area-inset-bottom)" }} />
      )}
    </div>
  );
}
