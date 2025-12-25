import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  status: string;
  unread_count_user: number;
}

export default function AppSupportChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch or create conversation
  useEffect(() => {
    if (!user) return;
    
    const fetchConversation = async () => {
      try {
        // First try to get existing conversation
        const { data: existing, error: fetchError } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          setConversation(existing as Conversation);
          await fetchMessages(existing.id);
          // Mark user messages as read
          await supabase
            .from('chat_conversations')
            .update({ unread_count_user: 0 })
            .eq('id', existing.id);
        }
      } catch (error: any) {
        console.error('Error fetching conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load chat",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [user]);

  // Fetch messages
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setMessages((data || []) as Message[]);
  };

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          // Mark as read if from admin
          if (newMessage.sender_type === 'admin') {
            supabase
              .from('chat_conversations')
              .update({ unread_count_user: 0 })
              .eq('id', conversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!user) return;
    setSending(true);

    try {
      let conversationId = conversation?.id;

      // Create conversation if doesn't exist
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            status: 'open'
          })
          .select()
          .single();

        if (convError) throw convError;
        setConversation(newConv as Conversation);
        conversationId = newConv.id;
      }

      // Send message
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'user',
          content
        });

      if (msgError) throw msgError;

      // Refetch messages to ensure sync
      await fetchMessages(conversationId);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Support Chat | Ladyboss Academy"
        description="Chat with our support team"
      />
      
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Support Chat</h1>
              <p className="text-xs text-muted-foreground">
                {conversation?.status === 'resolved' ? 'Resolved' : 'We typically reply within a few hours'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="font-medium text-lg mb-1">Start a conversation</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Send us a message and we'll get back to you as soon as possible
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  content={msg.content}
                  senderType={msg.sender_type}
                  createdAt={msg.created_at}
                  isRead={msg.is_read}
                  isCurrentUser={msg.sender_type === 'user'}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={sending || conversation?.status === 'resolved'}
          placeholder={conversation?.status === 'resolved' 
            ? "This conversation is resolved" 
            : "Type a message..."}
        />
      </div>
    </>
  );
}
