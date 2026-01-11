import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeedChannel {
  id: string;
  name: string;
  slug: string;
  type: 'general' | 'program' | 'round';
  program_slug: string | null;
  round_id: string | null;
  cover_image_url: string | null;
  allow_reactions: boolean;
  allow_comments: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
}

export interface FeedPost {
  id: string;
  channel_id: string;
  author_id: string | null;
  post_type: 'announcement' | 'drip_unlock' | 'session_reminder' | 'media' | 'discussion' | 'voice_message';
  title: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  action_type: 'none' | 'play_audio' | 'join_session' | 'view_materials' | 'external_link';
  action_data: Record<string, any>;
  is_pinned: boolean;
  is_system: boolean;
  send_push: boolean;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  channel?: FeedChannel;
  reactions_count?: Record<string, number>;
  user_reactions?: string[];
  comments_count?: number;
}

export interface FeedReaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const EMOJI_OPTIONS = [
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Clap' },
  { key: 'lightbulb', emoji: '💡', label: 'Idea' },
  { key: 'pray', emoji: '🙏', label: 'Thanks' },
];

export function useChannels() {
  return useQuery({
    queryKey: ['feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FeedChannel[];
    },
  });
}

export function useFeedPosts(channelId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-posts', channelId],
    queryFn: async () => {
      let query = supabase
        .from('feed_posts')
        .select(`
          *,
          author:profiles!feed_posts_author_id_fkey(full_name, avatar_url),
          channel:feed_channels!feed_posts_channel_id_fkey(*)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (channelId) {
        query = query.eq('channel_id', channelId);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Get reactions for all posts
      const postIds = posts.map(p => p.id);
      const { data: reactions } = await supabase
        .from('feed_reactions')
        .select('*')
        .in('post_id', postIds);

      // Get comments count
      const { data: commentsCounts } = await supabase
        .from('feed_comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_hidden', false);

      // Process posts with reaction counts and user reactions
      const postsWithEngagement = posts.map(post => {
        const postReactions = reactions?.filter(r => r.post_id === post.id) || [];
        const reactionsCounts: Record<string, number> = {};
        const userReactions: string[] = [];

        postReactions.forEach(r => {
          reactionsCounts[r.emoji] = (reactionsCounts[r.emoji] || 0) + 1;
          if (r.user_id === user?.id) {
            userReactions.push(r.emoji);
          }
        });

        const commentsCount = commentsCounts?.filter(c => c.post_id === post.id).length || 0;

        return {
          ...post,
          reactions_count: reactionsCounts,
          user_reactions: userReactions,
          comments_count: commentsCount,
        };
      });

      return postsWithEngagement as FeedPost[];
    },
    enabled: !!user,
  });
}

export function useFeedPost(postId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-post', postId],
    queryFn: async () => {
      const { data: post, error } = await supabase
        .from('feed_posts')
        .select(`
          *,
          author:profiles!feed_posts_author_id_fkey(full_name, avatar_url),
          channel:feed_channels!feed_posts_channel_id_fkey(*)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Get reactions
      const { data: reactions } = await supabase
        .from('feed_reactions')
        .select('*')
        .eq('post_id', postId);

      const reactionsCounts: Record<string, number> = {};
      const userReactions: string[] = [];

      reactions?.forEach(r => {
        reactionsCounts[r.emoji] = (reactionsCounts[r.emoji] || 0) + 1;
        if (r.user_id === user?.id) {
          userReactions.push(r.emoji);
        }
      });

      // Get comments count
      const { count } = await supabase
        .from('feed_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('is_hidden', false);

      return {
        ...post,
        reactions_count: reactionsCounts,
        user_reactions: userReactions,
        comments_count: count || 0,
      } as FeedPost;
    },
    enabled: !!postId && !!user,
  });
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['feed-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_comments')
        .select(`
          *,
          user:profiles!feed_comments_user_id_fkey(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FeedComment[];
    },
    enabled: !!postId,
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if reaction exists
      const { data: existing } = await supabase
        .from('feed_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('feed_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('feed_reactions')
          .insert({ post_id: postId, user_id: user.id, emoji });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('feed_comments')
        .insert({ post_id: postId, user_id: user.id, content });

      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('feed_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-comments'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}

export function useUnreadFeedCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-unread-count'],
    queryFn: async () => {
      if (!user) return 0;

      // Get all accessible posts
      const { data: posts } = await supabase
        .from('feed_posts')
        .select('id, created_at');

      if (!posts || posts.length === 0) return 0;

      // Get user's read posts
      const { data: reads } = await supabase
        .from('feed_post_reads')
        .select('post_id')
        .eq('user_id', user.id);

      const readPostIds = new Set(reads?.map(r => r.post_id) || []);
      const unreadCount = posts.filter(p => !readPostIds.has(p.id)).length;

      return unreadCount;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useMarkPostRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('feed_post_reads')
        .upsert({ post_id: postId, user_id: user.id }, { onConflict: 'post_id,user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-unread-count'] });
    },
  });
}
