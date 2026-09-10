import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, User, Mail, Calendar, BookOpen, Phone, CheckCircle2, RotateCcw, Link2, ShoppingBag } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { CannedRepliesManager, CannedRepliesPicker } from "./support/CannedReplies";
import { MessageButtonsEditor } from "./support/MessageButtonsEditor";
import { InternalNotes } from "./support/InternalNotes";
import {
  conversationEmail,
  conversationName,
  expandPlaceholders,
  getProgramLabel,
  type MessageButton,
  type SupportConversation,
} from "./support/supportData";

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
  buttons?: MessageButton[] | null;
}

interface UserContext {
  enrollments: Array<{ course_name: string; status: string; enrolled_at: string }>;
  orders: Array<{ product_name: string; amount: number; status: string; created_at: string }>;
}

interface ChatPanelProps {
  conversation: SupportConversation | null;
  onStatusChange?: () => void;
}

export function ChatPanel({ conversation, onStatusChange }: ChatPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buttons, setButtons] = useState<MessageButton[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [composerSeed, setComposerSeed] = useState("");
  const [seedKey, setSeedKey] = useState(0);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setUserContext(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setButtons([]);
      setShowButtons(false);
      try {
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages((msgs || []) as unknown as Message[]);

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

  const sendMessage = async (
    content: string,
    attachment?: { file: File; name: string; type: string; size: number },
    messageButtons?: MessageButton[]
  ) => {
    if (!conversation) {
      toast({ title: "Open a chat first", description: "Select a conversation, then send.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Not signed in", description: "Refresh the page and sign in again.", variant: "destructive" });
      return;
    }
    setSending(true);
    setUploading(!!attachment);

    try {
      let attachmentUrl: string | null = null;
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment.file);
      }

      const messageContent = content || (attachment ? `Sent an attachment: ${attachment.name}` : '');
      if (!messageContent.trim() && !attachmentUrl) {
        throw new Error("The message is empty.");
      }
      const clean = (messageButtons || [])
        .filter(b => b && b.label && b.url)
        .slice(0, 3)
        .map(b => ({ label: String(b.label), url: String(b.url) }));

      const { data: inserted, error } = await (supabase as any)
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'admin',
          content: messageContent,
          attachment_url: attachmentUrl,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
          attachment_size: attachment?.size || null,
          buttons: clean.length ? clean : null,
        })
        .select()
        .single();

      if (error) throw error;
      if (!inserted) throw new Error("The message was not saved.");

      // Keep the customer's side in sync (inbox ordering + unread badge)
      await (supabase as any)
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count_user: ((conversation as any).unread_count_user || 0) + 1,
        })
        .eq('id', conversation.id);

      setButtons([]);
      setShowButtons(false);
      await sendNotification(conversation.id, messageContent);
    } catch (error: any) {
      console.error('[ChatPanel] send failed', error);
      toast({
        title: "Message not sent",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleSendMessage = (
    content: string,
    attachment?: { file: File; name: string; type: string; size: number }
  ) => sendMessage(content, attachment, buttons);

  const insertCanned = (body: string, replyButtons?: MessageButton[]) => {
    setComposerSeed(expandPlaceholders(body, conversation));
    setSeedKey(k => k + 1);
    if (replyButtons?.length) {
      setButtons(replyButtons.slice(0, 3));
      setShowButtons(true);
    }
  };

  const toggleResolved = async () => {
    if (!conversation) return;
    const resolving = !conversation.resolved_at;
    await supabase
      .from('chat_conversations')
      .update({
        resolved_at: resolving ? new Date().toISOString() : null,
        status: resolving ? 'resolved' : 'open',
      })
      .eq('id', conversation.id);
    toast({ title: resolving ? "Marked as resolved" : "Reopened" });
    onStatusChange?.();
  };

  const assignToMe = async () => {
    if (!conversation || !user) return;
    const mine = conversation.assigned_to === user.id;
    await supabase
      .from('chat_conversations')
      .update({ assigned_to: mine ? null : user.id })
      .eq('id', conversation.id);
    toast({ title: mine ? "Unassigned" : "Assigned to you" });
    onStatusChange?.();
  };

  // User Info Panel Content
  const UserInfoContent = () => (
    <div className="space-y-4">
      {/* Profile */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{conversation ? conversationName(conversation) : 'No name'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate text-xs">{conversation ? conversationEmail(conversation) : ''}</span>
        </div>
        {conversation?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="truncate text-xs">{conversation.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">Joined {conversation && format(new Date(conversation.created_at), 'MMM d, yyyy')}</span>
        </div>
        {!!conversation?.orders_count && (
          <div className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">
              {conversation.orders_count} purchase{conversation.orders_count === 1 ? '' : 's'}
              {conversation.total_spent ? ` · $${(conversation.total_spent / 100).toFixed(0)}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Programs */}
      {conversation?.programs && conversation.programs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conversation.programs.map(p => (
            <Badge key={p} variant="outline" className="text-[10px]">{getProgramLabel(p)}</Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-1.5">
        <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5" onClick={toggleResolved}>
          {conversation?.resolved_at
            ? (<><RotateCcw className="h-3.5 w-3.5" /> Reopen</>)
            : (<><CheckCircle2 className="h-3.5 w-3.5" /> Mark resolved</>)}
        </Button>
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={assignToMe}>
          {conversation?.assigned_to === user?.id ? "Unassign me" : "Assign to me"}
        </Button>
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
                <Badge variant="outline" className="text-[10px] mt-1">{e.status}</Badge>
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

      {/* Internal notes */}
      {conversation && <InternalNotes conversationId={conversation.id} />}
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
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{conversationName(conversation)}</h2>
            <p className="text-xs text-muted-foreground truncate">{conversationEmail(conversation)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conversation.resolved_at && <Badge variant="secondary">Resolved</Badge>}
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={toggleResolved}>
              {conversation.resolved_at
                ? (<><RotateCcw className="h-3.5 w-3.5" /> Reopen</>)
                : (<><CheckCircle2 className="h-3.5 w-3.5" /> Resolve</>)}
            </Button>
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex lg:hidden items-center justify-end px-3 py-2 border-b bg-muted/30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="text-xs">Info</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>User Info</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <UserInfoContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Messages */}
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
                      buttons={msg.buttons}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Composer tools */}
        <div className="shrink-0 px-3 py-2 border-t space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <CannedRepliesPicker
              onInsert={(r) => insertCanned(r.body, r.buttons)}
              onSend={(r) => sendMessage(expandPlaceholders(r.body, conversation), undefined, r.buttons)}
            />
            <CannedRepliesManager />
            <Button
              variant={showButtons ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              onClick={() => setShowButtons(v => !v)}
            >
              <Link2 className="h-3.5 w-3.5" />
              Buttons{buttons.length ? ` (${buttons.length})` : ''}
            </Button>
          </div>
          {showButtons && (
            <MessageButtonsEditor buttons={buttons} onChange={setButtons} compact />
          )}
        </div>

        {/* Input */}
        <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ChatInput
            key={seedKey}
            initialMessage={composerSeed}
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
