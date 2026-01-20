import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageCircle, RefreshCw, ChevronDown } from "lucide-react";
import { ChatSkeleton } from "@/components/app/skeletons";
import { SEOHead } from "@/components/SEOHead";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

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

/**
 * Full-screen Telegram-style chat page
 * - No tab bar (dedicated full-screen experience)
 * - Native iOS keyboard handling (resize: native)
 * - Simple flexbox layout
 */
export default function AppChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isKeyboardOpen } = useKeyboard();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

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
          // Mark as read
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

  // Auto-scroll to bottom - instant on initial load, smooth for new messages
  useEffect(() => {
    if (messages.length === 0) return;
    
    if (!initialScrollDone) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        setInitialScrollDone(true);
      }, 50);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, initialScrollDone]);

  // Scroll to bottom when keyboard opens so last message stays visible
  useEffect(() => {
    if (isKeyboardOpen && messages.length > 0) {
      // Small delay to let keyboard animation complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isKeyboardOpen, messages.length]);

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

      // Note: No fetchMessages needed - realtime subscription handles new messages
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

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || scrollContainerRef.current?.scrollTop !== 0) return;
    
    const touchY = e.touches[0].clientY;
    const distance = Math.max(0, Math.min(100, touchY - touchStartY.current));
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= 60 && conversation?.id) {
      setIsRefreshing(true);
      try {
        await fetchMessages(conversation.id);
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    isPulling.current = false;
  };

  // Navigate back to app home
  const handleBack = () => {
    navigate('/app/home');
  };

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollButton(distanceFromBottom > 200);
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <>
        <SEOHead 
          title="Chat | Ladyboss Academy"
          description="Chat with our support team"
        />
        <div className="flex flex-col bg-background h-full">
          {/* Header */}
          <header 
            className="fixed top-0 left-0 right-0 z-40 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-xl rounded-b-3xl shadow-sm"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
          <div className="flex items-center gap-1 pt-3 pb-2 px-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="-ml-2 h-10 px-2 gap-0.5 text-primary hover:bg-transparent active:opacity-70"
            >
                <ChevronLeft className="h-7 w-7" />
                <span className="text-[17px]">Back</span>
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-[17px]">Support</h1>
                  <p className="text-[13px] text-muted-foreground">Loading...</p>
                </div>
              </div>
            </div>
          </header>
          {/* Spacer for fixed header */}
          <div style={{ height: 'calc(64px + env(safe-area-inset-top))' }} className="shrink-0" />
          <ChatSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Chat | Ladyboss Academy"
        description="Chat with our support team"
      />
      
      {/* Container - h-full to fill NativeAppLayout's main area */}
      <div className="flex flex-col bg-background h-full">
        {/* iOS-style Blur Header - fixed for proper scroll behavior */}
        <header 
          className="fixed top-0 left-0 right-0 z-40 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-xl rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-1 pt-3 pb-2 px-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="-ml-2 h-10 px-2 gap-0.5 text-primary hover:bg-transparent active:opacity-70"
            >
              <ChevronLeft className="h-7 w-7" />
              <span className="text-[17px]">Back</span>
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

        {/* Spacer for fixed header */}
        <div style={{ height: 'calc(64px + env(safe-area-inset-top))' }} className="shrink-0" />

        {/* Messages area - flex-1 takes remaining space, scrollable */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={handleScroll}
        >
          {/* Pull to refresh indicator */}
          {(pullDistance > 0 || isRefreshing) && (
            <div 
              className="flex items-center justify-center transition-all duration-200"
              style={{ 
                height: isRefreshing ? 50 : pullDistance,
                opacity: isRefreshing ? 1 : pullDistance / 60
              }}
            >
              <RefreshCw 
                className={`h-5 w-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ 
                  transform: `rotate(${pullDistance * 3.6}deg)`,
                  transition: isRefreshing ? 'none' : 'transform 0.1s'
                }}
              />
            </div>
          )}
          
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
          
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottomSmooth}
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center z-10 transition-all hover:scale-105 active:scale-95"
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Input Area - shrink-0 so it stays at its natural height */}
        <div 
          className="shrink-0 bg-background/95 backdrop-blur-xl border-t border-border/30"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="px-3 py-1.5">
            <ChatInput
              onSend={handleSendMessage} 
              disabled={sending}
              uploading={uploading}
              placeholder="Type a message..."
            />
          </div>
        </div>
      </div>
    </>
  );
}
