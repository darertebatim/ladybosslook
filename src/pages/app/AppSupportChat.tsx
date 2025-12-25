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
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard detection using visualViewport API
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let lastKeyboardHeight = 0;

    const handleResize = () => {
      const keyboardH = Math.max(0, window.innerHeight - viewport.height);
      
      if (Math.abs(keyboardH - lastKeyboardHeight) > 10) {
        lastKeyboardHeight = keyboardH;
        setKeyboardHeight(keyboardH);

        // Scroll to bottom when keyboard opens
        if (keyboardH > 0) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      }
    };

    // Prevent iOS Safari viewport shift
    const handleScroll = () => {
      if (viewport.offsetTop !== 0) {
        window.scrollTo(0, 0);
      }
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleScroll);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch or create conversation
  useEffect(() => {
    if (!user) return;
    
    const fetchConversation = async () => {
      try {
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

  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendNotification = async (conversationId: string, messageContent: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !user) return;

      await supabase.functions.invoke('send-chat-notification', {
        body: {
          conversationId,
          messageContent,
          senderType: 'user',
          senderId: user.id
        }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleSendMessage = async (
    content: string, 
    attachment?: { file: File; name: string; type: string; size: number }
  ) => {
    if (!user) return;
    setSending(true);
    setUploading(!!attachment);

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

      // Upload attachment if present
      let attachmentUrl: string | null = null;
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment.file);
      }

      // Send message
      const messageContent = content || (attachment ? `Sent an attachment: ${attachment.name}` : '');
      
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'user',
          content: messageContent,
          attachment_url: attachmentUrl,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
          attachment_size: attachment?.size || null
        });

      if (msgError) throw msgError;

      // Send push notification to admins
      await sendNotification(conversationId, messageContent);

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
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Header height: 56px + safe-area-inset-top
  // Tab bar height: 72px + safe-area-inset-bottom
  // Input height: ~68px

  return (
    <>
      <SEOHead 
        title="Support Chat | Ladyboss Academy"
        description="Chat with our support team"
      />
      
      <div className="fixed inset-0 bg-background flex flex-col">
        {/* Fixed Header with safe area */}
        <header 
          className="bg-background border-b border-border z-50 shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-3 h-14 px-4">
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
        </header>

        {/* Messages area - positioned between header and input */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            paddingBottom: keyboardHeight > 0 
              ? `calc(80px + ${keyboardHeight}px)` 
              : 'calc(140px + env(safe-area-inset-bottom))'
          }}
        >
          <div className="p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
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
                    attachmentUrl={msg.attachment_url}
                    attachmentName={msg.attachment_name}
                    attachmentType={msg.attachment_type}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Fixed Input Area that moves with keyboard */}
        <div 
          className="fixed left-0 right-0 bg-background border-t border-border z-40"
          style={{
            bottom: keyboardHeight > 0 
              ? keyboardHeight 
              : 'calc(72px + env(safe-area-inset-bottom))',
            paddingBottom: '12px',
            transition: 'bottom 0.15s ease-out',
            willChange: 'bottom'
          }}
        >
          <div className="py-3 px-4">
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={sending || conversation?.status === 'resolved'}
              uploading={uploading}
              placeholder={conversation?.status === 'resolved' 
                ? "This conversation is resolved" 
                : "Type a message..."}
            />
          </div>
        </div>
      </div>
    </>
  );
}