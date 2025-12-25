import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useChatNotifications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const conversationIdRef = useRef<string | null>(null);
  const hasShownInitialNotification = useRef(false);
  const [showUnreadPopup, setShowUnreadPopup] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const dismissPopup = () => {
    setShowUnreadPopup(false);
  };

  const goToChat = () => {
    setShowUnreadPopup(false);
    navigate('/app/support-chat');
  };

  useEffect(() => {
    if (!user?.id) return;

    // Fetch conversation and check for unread messages on app open
    const fetchConversation = async () => {
      const { data } = await supabase
        .from('chat_conversations')
        .select('id, unread_count_user')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        conversationIdRef.current = data.id;
        
        // Show welcome-back popup if there are unread messages
        if (
          data.unread_count_user > 0 &&
          !hasShownInitialNotification.current &&
          location.pathname !== '/app/support-chat'
        ) {
          hasShownInitialNotification.current = true;
          setUnreadMessageCount(data.unread_count_user);
          setShowUnreadPopup(true);
        }
      }
    };

    fetchConversation();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Only show notification for admin messages to the user's conversation
          if (
            newMessage.sender_type === 'admin' &&
            newMessage.conversation_id === conversationIdRef.current &&
            location.pathname !== '/app/support-chat'
          ) {
            const preview = newMessage.content.length > 60
              ? newMessage.content.substring(0, 60) + '...'
              : newMessage.content;

            toast('New message from Support', {
              description: preview,
              duration: 6000,
              action: {
                label: 'View',
                onClick: () => navigate('/app/support-chat')
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, location.pathname, navigate]);

  return {
    showUnreadPopup,
    unreadMessageCount,
    dismissPopup,
    goToChat
  };
};
