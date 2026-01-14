import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time feed updates
 * - New posts in channels
 * - New comments on posts
 * - Reaction changes
 */
export function useFeedRealtime(channelId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Single consolidated channel for all feed-related changes (better performance)
    const feedChannel = supabase
      .channel('feed-combined-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_posts',
          ...(channelId && { filter: `channel_id=eq.${channelId}` }),
        },
        (payload) => {
          console.log('New feed post received:', payload);
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
          queryClient.invalidateQueries({ queryKey: ['feed-unread-count'] });
          
          const newPost = payload.new as { author_id: string; title: string | null };
          if (newPost.author_id !== user.id) {
            toast('New post in Community', {
              description: newPost.title || 'New content available',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feed_posts',
        },
        (payload) => {
          const updatedPost = payload.new as { id: string };
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
          queryClient.invalidateQueries({ queryKey: ['feed-post', updatedPost.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'feed_posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_reactions',
        },
        (payload) => {
          const reaction = (payload.new || payload.old) as { post_id: string };
          if (reaction?.post_id) {
            queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
            queryClient.invalidateQueries({ queryKey: ['feed-post', reaction.post_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedChannel);
    };
  }, [user, channelId, queryClient]);
}

/**
 * Hook to subscribe to real-time comments on a specific post
 */
export function usePostCommentsRealtime(postId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !postId) return;

    const commentsChannel = supabase
      .channel(`feed-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('New comment received:', payload);
          queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
          queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
          
          // Show toast for new comments (only if not from current user)
          const newComment = payload.new as { user_id: string };
          if (newComment.user_id !== user.id) {
            toast('New comment', {
              description: 'Someone commented on a post',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feed_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // Handle hidden comments
          queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
          queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'feed_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
          queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [user, postId, queryClient]);
}
