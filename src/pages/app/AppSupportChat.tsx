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
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

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
  is_broadcast?: boolean;
}

interface Conversation {
  id: string;
  status: string;
  unread_count_user: number;
}

// Helper to get date separator label
const getDateLabel = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

// Check if we need a date separator between two messages
const needsDateSeparator = (currentMsg: Message, prevMsg: Message | null): boolean => {
  if (!prevMsg) return true;
  return !isSameDay(new Date(currentMsg.created_at), new Date(prevMsg.created_at));
};

// Time threshold for grouping messages (5 minutes)
const GROUP_TIME_THRESHOLD = 5 * 60 * 1000;

// Check if message should show avatar (first in group)
const shouldShowAvatar = (msg: Message, prevMsg: Message | null): boolean => {
  if (!prevMsg) return true;
  if (prevMsg.sender_type !== msg.sender_type) return true;
  const timeDiff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
  return timeDiff > GROUP_TIME_THRESHOLD;
};

// Check if message is first in its group
const isFirstInGroup = (msg: Message, prevMsg: Message | null): boolean => {
  return shouldShowAvatar(msg, prevMsg);
};

// Check if message is last in its group
const isLastInGroup = (msg: Message, nextMsg: Message | null): boolean => {
  if (!nextMsg) return true;
  if (nextMsg.sender_type !== msg.sender_type) return true;
  const timeDiff = new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime();
  return timeDiff > GROUP_TIME_THRESHOLD;
};

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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Keyboard handling - use Capacitor plugin for native, visualViewport for web
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Use Capacitor Keyboard plugin for native apps
      const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardHeight(info.keyboardHeight);
        setIsKeyboardVisible(true);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      });

      const hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      });

      return () => {
        showListener.then(l => l.remove());
        hideListener.then(l => l.remove());
      };
    } else {
      // Fallback to visualViewport for web
      const viewport = window.visualViewport;
      if (!viewport) return;

      const handleResize = () => {
        const keyboardH = Math.max(0, window.innerHeight - viewport.height);
        setKeyboardHeight(keyboardH);
        setIsKeyboardVisible(keyboardH > 50);
        
        if (keyboardH > 50) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      };

      viewport.addEventListener('resize', handleResize);
      return () => viewport.removeEventListener('resize', handleResize);
    }
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
        {/* iOS-style Blur Header */}
        <header 
          className="bg-background/80 backdrop-blur-xl border-b border-border/50 z-50 shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-3 pt-6 pb-3 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div>
                <h1 className="font-semibold text-[17px]">Support</h1>
                <p className="text-[13px] text-muted-foreground">
                  {conversation?.status === 'resolved' ? 'Resolved' : 'Usually replies within hours'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages area - positioned between header and input */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            paddingBottom: isKeyboardVisible 
              ? `${60 + keyboardHeight}px`
              : 'calc(130px + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div className="p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-primary/60" />
                </div>
                <h2 className="font-semibold text-lg mb-1">Start a conversation</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Send us a message and we'll get back to you as soon as possible
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                  const showDateSeparator = needsDateSeparator(msg, prevMsg);
                  
                  // Grouping logic
                  const showAvatar = shouldShowAvatar(msg, showDateSeparator ? null : prevMsg);
                  const firstInGroup = isFirstInGroup(msg, showDateSeparator ? null : prevMsg);
                  const lastInGroup = isLastInGroup(msg, nextMsg);
                  
                  return (
                    <div key={msg.id}>
                      {/* Date Separator */}
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <div className="px-3 py-1 rounded-full bg-muted/60 backdrop-blur-sm">
                            <span className="text-xs font-medium text-muted-foreground">
                              {getDateLabel(new Date(msg.created_at))}
                            </span>
                          </div>
                        </div>
                      )}
                      <ChatMessage
                        content={msg.content}
                        senderType={msg.sender_type}
                        createdAt={msg.created_at}
                        isRead={msg.is_read}
                        isCurrentUser={msg.sender_type === 'user'}
                        attachmentUrl={msg.attachment_url}
                        attachmentName={msg.attachment_name}
                        attachmentType={msg.attachment_type}
                        isBroadcast={msg.is_broadcast}
                        senderName="Ladyboss Support"
                        showAvatar={showAvatar}
                        isFirstInGroup={firstInGroup}
                        isLastInGroup={lastInGroup}
                        showTimestamp={lastInGroup}
                      />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Fixed Input Area that moves with keyboard */}
        <div 
          className="fixed left-0 right-0 bg-background/95 backdrop-blur-xl z-40"
          style={{
            bottom: isKeyboardVisible 
              ? `${keyboardHeight}px`
              : isInputFocused && Capacitor.isNativePlatform()
                ? '300px'
                : 'calc(72px + env(safe-area-inset-bottom, 0px))',
            transition: isKeyboardVisible ? 'none' : 'bottom 0.15s ease-out'
          }}
        >
          <div className="px-3 py-1.5">
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={sending}
              uploading={uploading}
              placeholder="Type a message..."
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
}