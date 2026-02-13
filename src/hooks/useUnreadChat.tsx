import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUnreadChat = (inboxType: 'support' | 'coach' = 'support') => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('unread_count_user')
        .eq('user_id', user.id)
        .eq('inbox_type', inboxType)
        .maybeSingle();
      
      if (!error && data) {
        setUnreadCount(data.unread_count_user || 0);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time changes on user's conversations
    const channel = supabase
      .channel(`unread-chat-count-${inboxType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow && newRow.inbox_type === inboxType && 'unread_count_user' in newRow) {
            setUnreadCount(newRow.unread_count_user || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, inboxType]);

  return { unreadCount };
};
