import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SupportChatSummary {
  lastMessage: {
    content: string;
    created_at: string;
    sender_type: 'user' | 'admin';
  } | null;
  unreadCount: number;
}

export function useSupportChatSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['support-chat-summary', user?.id],
    queryFn: async (): Promise<SupportChatSummary> => {
      if (!user?.id) {
        return { lastMessage: null, unreadCount: 0 };
      }

      // Get user's conversation with last message
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('id, unread_count_user')
        .eq('user_id', user.id)
        .single();

      if (convError || !conversation) {
        return { lastMessage: null, unreadCount: 0 };
      }

      // Get the last message
      const { data: lastMsg, error: msgError } = await supabase
        .from('chat_messages')
        .select('content, created_at, sender_type')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          created_at: lastMsg.created_at,
          sender_type: lastMsg.sender_type as 'user' | 'admin',
        } : null,
        unreadCount: conversation.unread_count_user || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
