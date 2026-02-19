import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, User, Mail, Calendar, BookOpen, Tag, Plus, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

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
  };
}

interface UserContext {
  enrollments: Array<{ course_name: string; status: string; enrolled_at: string }>;
  orders: Array<{ product_name: string; amount: number; status: string; created_at: string }>;
}

interface ChatPanelProps {
  conversation: Conversation | null;
  onStatusChange?: () => void;
}

const QUICK_REPLIES = [
  "Hi! How can I help you today?",
  "Thank you for reaching out. Let me look into this for you.",
  "I've resolved this issue. Is there anything else I can help with?",
  "Could you please provide more details about your issue?",
];

export function ChatPanel({ conversation, onStatusChange }: ChatPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setUserContext(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages((msgs || []) as Message[]);

        await supabase
          .from('chat_conversations')
          .update({ unread_count_admin: 0 })
          .eq('id', conversation.id);

        const [enrollmentsRes, ordersRes] = await Promise.all([
          supabase
            .from('course_enrollments')
            .select('course_name, status, enrolled_at')
            .eq('user_id', conversation.user_id)
            .order('enrolled_at', { ascending: false })
            .limit(5),
          supabase
            .from('orders')
            .select('product_name, amount, status, created_at')
            .eq('user_id', conversation.user_id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setUserContext({
          enrollments: enrollmentsRes.data || [],
          orders: ordersRes.data || []
        });
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversation?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`admin-chat-${conversation.id}`)
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user || !conversation) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${conversation.user_id}/${Date.now()}-admin-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
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
      if (!user) return;

      await supabase.functions.invoke('send-chat-notification', {
        body: {
          conversationId,
          messageContent,
          senderType: 'admin',
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
    if (!conversation || !user) return;
    setSending(true);
    setUploading(!!attachment);

    try {
      let attachmentUrl: string | null = null;
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment.file);
      }

      const messageContent = content || (attachment ? `Sent an attachment: ${attachment.name}` : '');

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'admin',
          content: messageContent,
          attachment_url: attachmentUrl,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
          attachment_size: attachment?.size || null
        });

      if (error) throw error;

      // Send push notification to user
      await sendNotification(conversation.id, messageContent);
    } catch (error: any) {
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

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  // Fetch tags for current conversation
  useEffect(() => {
    if (!conversation) { setTags([]); return; }
    const fetchTags = async () => {
      const { data } = await supabase
        .from('chat_conversation_tags')
        .select('tag')
        .eq('conversation_id', conversation.id);
      setTags(data?.map(t => t.tag) || []);
    };
    fetchTags();
  }, [conversation?.id]);

  const addTag = async (tag: string) => {
    if (!conversation || !tag.trim() || tags.includes(tag.trim())) return;
    const trimmed = tag.trim();
    setTags(prev => [...prev, trimmed]);
    setNewTag("");
    setTagPopoverOpen(false);
    const { error } = await supabase.from('chat_conversation_tags').insert({
      conversation_id: conversation.id,
      tag: trimmed,
    });
    if (error) {
      console.error('Failed to add tag:', error);
      setTags(prev => prev.filter(t => t !== trimmed));
      toast({ title: "Error", description: "Failed to add tag", variant: "destructive" });
    }
  };

  const removeTag = async (tag: string) => {
    if (!conversation) return;
    setTags(prev => prev.filter(t => t !== tag));
    const { error } = await supabase.from('chat_conversation_tags')
      .delete()
      .eq('conversation_id', conversation.id)
      .eq('tag', tag);
    if (error) {
      console.error('Failed to remove tag:', error);
      setTags(prev => [...prev, tag]);
    }
  };

  const SUGGESTED_TAGS = ['New', 'VIP', 'Urgent', 'Follow Up', 'Resolved', 'Waiting'];

  const TagsUI = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(tag => (
        <Badge key={tag} variant="secondary" className={cn("gap-1", compact ? "text-[10px] h-5" : "text-xs")}>
          {tag}
          <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("gap-1", compact ? "h-5 px-1.5 text-[10px]" : "h-7 px-2 text-xs")}
            onClick={(e) => { e.stopPropagation(); setTagPopoverOpen(prev => !prev); }}
          >
            <Tag className="h-3 w-3" />
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 z-[9999]" align="start" sideOffset={5}>
          <div className="space-y-2">
            <Input
              placeholder="New tag..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag(newTag)}
              className="h-7 text-xs"
            />
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_TAGS.filter(s => !tags.includes(s)).map(s => (
                <button
                  key={s}
                  type="button"
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold cursor-pointer hover:bg-accent transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); addTag(s); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  // User Info Panel Content
  const UserInfoContent = () => (
    <div className="space-y-4">
      {/* Profile */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{conversation?.profiles?.full_name || 'No name'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate text-xs">{conversation?.profiles?.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">Joined {conversation && format(new Date(conversation.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Enrollments */}
      {userContext?.enrollments && userContext.enrollments.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Enrollments
          </h4>
          <div className="space-y-1">
            {userContext.enrollments.map((e, i) => (
              <div key={i} className="text-xs p-2 bg-background rounded border">
                <p className="font-medium truncate">{e.course_name}</p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {e.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {userContext?.orders && userContext.orders.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Orders</h4>
          <div className="space-y-1">
            {userContext.orders.map((o, i) => (
              <div key={i} className="text-xs p-2 bg-background rounded border">
                <p className="font-medium truncate">{o.product_name}</p>
                <p className="text-muted-foreground">${(o.amount / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - hidden on mobile since parent has header */}
        <div className="hidden lg:flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">{conversation.profiles?.full_name || 'Unknown User'}</h2>
            <p className="text-xs text-muted-foreground">{conversation.profiles?.email}</p>
          </div>
          <TagsUI />
        </div>

        {/* Mobile header with tags */}
        <div className="flex lg:hidden items-center justify-between px-3 py-2 border-b bg-muted/30 gap-2">
          <div className="flex-1 min-w-0 overflow-x-auto">
            <TagsUI compact />
          </div>
          
          {/* User Info Button - Sheet for mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="text-xs">Info</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>User Info</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <UserInfoContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Messages - iOS optimized scrolling */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const msgDate = new Date(msg.created_at);
                const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;
                const showDateSeparator = !prevDate || 
                  msgDate.toDateString() !== prevDate.toDateString();

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-3">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {isToday(msgDate) ? 'Today' : 
                           isYesterday(msgDate) ? 'Yesterday' : 
                           format(msgDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    <ChatMessage
                      content={msg.content}
                      senderType={msg.sender_type}
                      createdAt={msg.created_at}
                      isRead={msg.is_read}
                      isCurrentUser={msg.sender_type === 'admin'}
                      attachmentUrl={msg.attachment_url}
                      attachmentName={msg.attachment_name}
                      attachmentType={msg.attachment_type}
                      isBroadcast={msg.is_broadcast}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick Replies - Horizontal Scroll */}
        <div className="shrink-0 px-3 py-2 border-t overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 min-w-max">
            {QUICK_REPLIES.map((reply, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs whitespace-nowrap shrink-0 h-8"
                onClick={() => handleQuickReply(reply)}
                disabled={sending}
              >
                {reply.substring(0, 25)}...
              </Button>
            ))}
          </div>
        </div>

        {/* Input - with safe area padding */}
        <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={sending}
            uploading={uploading}
            placeholder="Type a reply..."
          />
        </div>
      </div>

      {/* User Context Panel - Desktop Only */}
      <div className="w-64 border-l bg-muted/20 p-3 overflow-y-auto hidden lg:block">
        <h3 className="font-semibold text-sm mb-3">User Info</h3>
        <UserInfoContent />
      </div>
    </div>
  );
}
