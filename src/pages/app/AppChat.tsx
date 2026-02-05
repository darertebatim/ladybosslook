import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageCircle, RefreshCw, ChevronDown, Mic, Heart, HelpCircle } from "lucide-react";
import { ChatSkeleton } from "@/components/app/skeletons";
import { SEOHead } from "@/components/SEOHead";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { haptic } from "@/lib/haptics";

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

// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
};

// Conversation starters
const conversationStarters = [
  { icon: MessageCircle, text: "I have a question", color: "from-primary/20 to-primary/5" },
  { icon: Mic, text: "I'd rather send a voice note", color: "from-emerald-500/20 to-emerald-500/5" },
  { icon: Heart, text: "I just need someone to talk to", color: "from-rose-500/20 to-rose-500/5" },
  { icon: HelpCircle, text: "Something isn't working", color: "from-amber-500/20 to-amber-500/5" },
];

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
  const [swipeBackOffset, setSwipeBackOffset] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isPulling = useRef(false);
  const isSwipingBack = useRef(false);
  const swipeStartedFromEdge = useRef(false);

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
      // Use multiple attempts with increasing delays to ensure DOM is ready
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      };
      
      // Immediate attempt
      scrollToBottom();
      // After React commit
      requestAnimationFrame(() => {
        scrollToBottom();
        // After layout calculations
        setTimeout(scrollToBottom, 100);
        setTimeout(() => {
          scrollToBottom();
          setInitialScrollDone(true);
        }, 300);
      });
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

  // Edge swipe threshold (px from left edge to start swipe-back gesture)
  const EDGE_SWIPE_ZONE = 30;
  const SWIPE_BACK_THRESHOLD = 100;

  // Pull-to-refresh and swipe-back handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    touchStartX.current = touchX;
    touchStartY.current = touchY;
    
    // Check if touch started from left edge (iOS-style back gesture zone)
    if (touchX <= EDGE_SWIPE_ZONE) {
      swipeStartedFromEdge.current = true;
      isSwipingBack.current = true;
    } else {
      swipeStartedFromEdge.current = false;
    }
    
    // Pull-to-refresh only when at top
    if (scrollContainerRef.current?.scrollTop === 0) {
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;
    
    // Handle edge swipe-back gesture (right swipe from left edge)
    if (swipeStartedFromEdge.current && isSwipingBack.current) {
      // Only trigger if horizontal movement is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        // Apply resistance to make it feel natural
        const resistance = 0.5;
        const offset = Math.min(deltaX * resistance, 150);
        setSwipeBackOffset(offset);
        return; // Don't process pull-to-refresh when swiping back
      }
    }
    
    // Pull-to-refresh logic
    if (!isPulling.current || scrollContainerRef.current?.scrollTop !== 0) return;
    
    const distance = Math.max(0, Math.min(100, deltaY));
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    // Handle swipe-back completion
    if (isSwipingBack.current && swipeBackOffset > SWIPE_BACK_THRESHOLD) {
      haptic.light();
      navigate(-1);
    }
    
    // Reset swipe-back state with animation
    setSwipeBackOffset(0);
    isSwipingBack.current = false;
    swipeStartedFromEdge.current = false;
    
    // Handle pull-to-refresh
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
    haptic.light();
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
      
      {/* Container - h-full to fill NativeAppLayout's main area, with swipe-back visual feedback */}
      <div 
        className="flex flex-col bg-background h-full transition-transform duration-200 ease-out"
        style={{ 
          transform: swipeBackOffset > 0 ? `translateX(${swipeBackOffset}px)` : 'none',
          transition: swipeBackOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
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
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
                {/* Warm gradient card */}
                <div className="w-full max-w-sm bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 mb-6">
                  {/* Avatar with gentle pulse */}
                  <div className="relative mx-auto mb-5">
                    <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
                      <span className="text-4xl">💜</span>
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1/2 translate-x-8 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
                  </div>
                  
                  {/* Time-based greeting */}
                  <p className="text-muted-foreground text-[15px] mb-1">
                    {getGreeting().text} {getGreeting().emoji}
                  </p>
                  <h2 className="font-semibold text-xl mb-3">I'm Sarah, and I'm here for you</h2>
                  
                  {/* Core message */}
                  <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                    No rush. No judgment. Just a real person who cares.
                  </p>
                </div>
                
                {/* Conversation starters */}
                <div className="w-full max-w-sm mb-6">
                  <p className="text-[13px] text-muted-foreground/70 mb-3">Tap to start a conversation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {conversationStarters.map((starter, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(starter.text)}
                        disabled={sending}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br ${starter.color} border border-border/30 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
                      >
                        <starter.icon className="h-4 w-4 text-foreground/70 shrink-0" />
                        <span className="text-[13px] font-medium text-foreground/90 leading-tight">{starter.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Warm footer */}
                <p className="text-[13px] text-muted-foreground/60 max-w-[260px] leading-relaxed">
                  Type, or tap the mic if that feels easier — we're listening. We check in throughout the day. 💜
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

        {/* Scroll to bottom button - positioned outside scroll container for visibility */}
        {showScrollButton && (
          <button
            onClick={scrollToBottomSmooth}
            className="absolute bottom-20 right-4 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-20 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        )}

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
