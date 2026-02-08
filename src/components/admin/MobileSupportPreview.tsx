import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, Send, Paperclip, ArrowDown, Headset } from "lucide-react";
import { format, isToday, isYesterday, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

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
}

interface MessageGroup {
  dateLabel: string;
  messages: Array<Message & { isFollowUp: boolean }>;
}

interface MobileSupportPreviewProps {
  conversation: Conversation | null;
  onBack: () => void;
  onStatusChange?: () => void;
}

export function MobileSupportPreview({ conversation, onBack, onStatusChange }: MobileSupportPreviewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages((msgs || []) as Message[]);

        // Mark as read
        await supabase
          .from('chat_conversations')
          .update({ unread_count_admin: 0 })
          .eq('id', conversation.id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`admin-mobile-chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // Handle scroll for scroll button visibility
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollButton(distanceFromBottom > 20);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group messages by date
  const groupedMessages = (): MessageGroup[] => {
    if (messages.length === 0) return [];

    const groups: MessageGroup[] = [];
    let currentDateLabel = '';

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.created_at);
      let dateLabel: string;

      if (isToday(msgDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(msgDate)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(msgDate, 'MMM d, yyyy');
      }

      // Check if this is a follow-up message
      let isFollowUp = false;
      if (index > 0) {
        const prevMsg = messages[index - 1];
        const prevMsgDate = new Date(prevMsg.created_at);
        const sameSender = msg.sender_type === prevMsg.sender_type;
        const sameDay = format(msgDate, 'yyyy-MM-dd') === format(prevMsgDate, 'yyyy-MM-dd');
        const withinFiveMinutes = Math.abs(differenceInMinutes(msgDate, prevMsgDate)) <= 5;
        
        isFollowUp = sameSender && sameDay && withinFiveMinutes;
      }

      if (dateLabel !== currentDateLabel) {
        groups.push({ dateLabel, messages: [] });
        currentDateLabel = dateLabel;
      }

      groups[groups.length - 1].messages.push({ ...msg, isFollowUp });
    });

    return groups;
  };

  const handleSend = async () => {
    if (!messageText.trim() || !conversation || !user) return;
    setSending(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'admin',
          content: messageText.trim(),
        });

      if (error) throw error;
      setMessageText('');
      
      // Send notification
      await supabase.functions.invoke('send-chat-notification', {
        body: {
          conversationId: conversation.id,
          messageContent: messageText.trim(),
          senderType: 'admin',
          senderId: user.id
        }
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a conversation</p>
      </div>
    );
  }

  const userName = conversation.profiles?.full_name || 'User';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-accent rounded-b-3xl shadow-sm">
        <div className="flex items-center gap-3 px-3 py-3">
          <button 
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-background/50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <Avatar className="h-9 w-9">
            <AvatarImage src={conversation.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[17px] truncate">{userName}</h1>
            <p className="text-[13px] text-muted-foreground truncate">
              {conversation.profiles?.email}
            </p>
          </div>

          <Badge variant={conversation.status === 'resolved' ? 'secondary' : 'default'} className="text-xs">
            {conversation.status}
          </Badge>
        </div>
      </header>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {groupedMessages().map((group) => (
              <div key={group.dateLabel}>
                {/* Date separator */}
                <div className="flex justify-center py-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-muted shadow-sm text-xs font-normal"
                  >
                    {group.dateLabel}
                  </Badge>
                </div>

                {/* Messages */}
                {group.messages.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin';
                  
                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex gap-2 mb-2",
                        isAdmin ? "justify-end" : "justify-start",
                        msg.isFollowUp && "mt-0.5"
                      )}
                    >
                      {/* User avatar (left side) */}
                      {!isAdmin && !msg.isFollowUp && (
                        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                          <AvatarImage src={conversation.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isAdmin && msg.isFollowUp && <div className="w-8 shrink-0" />}

                      {/* Message bubble */}
                      <div className={cn(
                        "max-w-[75%] min-w-0",
                        isAdmin && "order-1"
                      )}>
                        {/* Header */}
                        {!msg.isFollowUp && (
                          <div className={cn(
                            "flex items-center gap-2 mb-1",
                            isAdmin && "justify-end"
                          )}>
                            <span className="font-medium text-xs">
                              {isAdmin ? 'You' : userName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                          </div>
                        )}

                        <div className={cn(
                          "px-3.5 py-2.5 rounded-2xl",
                          isAdmin 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted rounded-bl-md"
                        )}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          
                          {/* Attachment */}
                          {msg.attachment_url && (
                            <a 
                              href={msg.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs underline mt-1 block"
                            >
                              📎 {msg.attachment_name || 'Attachment'}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Admin avatar (right side) */}
                      {isAdmin && !msg.isFollowUp && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Headset className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {isAdmin && msg.isFollowUp && <div className="w-8 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 h-10 w-10 rounded-full bg-background border shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-10"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 border-t bg-background p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={!messageText.trim() || sending}
            className="h-11 w-11 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
