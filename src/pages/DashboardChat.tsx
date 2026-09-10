import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SEOHead } from "@/components/SEOHead";
import Navigation from "@/components/ui/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { DownloadRiloDialog } from "@/components/chat/DownloadRiloDialog";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: "user" | "admin";
  is_read: boolean;
  created_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  is_broadcast?: boolean;
  buttons?: Array<{ label: string; url: string }> | null;
}

interface Conversation {
  id: string;
  status: string;
  unread_count_user: number;
}

/**
 * Web (out-of-app) support chat living at /dashboard/chat.
 * Same conversation thread as the mobile app support chat.
 */
export default function DashboardChat() {
  const [searchParams] = useSearchParams();
  const draftMessage = searchParams.get("draft") || "";
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [showAppPromo, setShowAppPromo] = useState(false);


  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setMessages((data || []) as unknown as Message[]);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: existing, error } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("user_id", user.id)
          .eq("inbox_type", "support")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (existing) {
          setConversation(existing as Conversation);
          await fetchMessages(existing.id);
          await supabase
            .from("chat_conversations")
            .update({ unread_count_user: 0 })
            .eq("id", existing.id);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Could not load your messages.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!conversation?.id) return;
    const channel = supabase
      .channel(`web-chat-${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          if (newMessage.sender_type === "admin") {
            supabase.from("chat_conversations").update({ unread_count_user: 0 }).eq("id", conversation.id);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
    return data.publicUrl;
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
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, status: "open" })
          .select()
          .single();
        if (convError) throw convError;
        setConversation(newConv as Conversation);
        conversationId = newConv.id;
      }

      let attachmentUrl: string | null = null;
      if (attachment) attachmentUrl = await uploadAttachment(attachment.file);

      const messageContent = content || (attachment ? `Sent an attachment: ${attachment.name}` : "");
      const { error: msgError } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: "user",
        content: messageContent,
        attachment_url: attachmentUrl,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
        attachment_size: attachment?.size || null,
      });
      if (msgError) throw msgError;

      try {
        if (!localStorage.getItem("rilo_chat_app_promo_seen")) {
          localStorage.setItem("rilo_chat_app_promo_seen", "1");
          setShowAppPromo(true);
        }
      } catch {
        setShowAppPromo(true);
      }

      try {
        await supabase.functions.invoke("send-chat-notification", {
          body: { conversationId, messageContent, senderType: "user", senderId: user.id },
        });
      } catch (e) {
        console.error("notify failed", e);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Message could not be sent.", variant: "destructive" });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Support Chat - Rilo Academy"
        description="Message the Rilo Academy support team directly from your browser."
      />
      <Navigation />

      <main className="container max-w-3xl py-8 px-4">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/dashboard">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <Card className="flex flex-col overflow-hidden" style={{ height: "70vh" }}>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Support Chat</h1>
              <p className="text-xs text-muted-foreground">We usually reply within 24 hours</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <MessageCircle className="h-10 w-10 text-muted-foreground opacity-50" />
                <p className="font-medium">Start the conversation</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Send us a message and our team will get back to you here.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  content={msg.content}
                  senderType={msg.sender_type}
                  createdAt={msg.created_at}
                  isRead={msg.is_read}
                  isCurrentUser={msg.sender_type === "user"}
                  attachmentUrl={msg.attachment_url}
                  attachmentName={msg.attachment_name}
                  attachmentType={msg.attachment_type}
                  isBroadcast={msg.is_broadcast}
                  buttons={msg.buttons ?? null}
                  showAvatar
                  isFirstInGroup
                  isLastInGroup
                  showTimestamp
                />
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border">
            <ChatInput onSend={handleSendMessage} disabled={sending} uploading={uploading} initialMessage={draftMessage} />
          </div>
        </Card>
      </main>
    </div>
  );
}
