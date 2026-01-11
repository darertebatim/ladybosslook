import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionToComplete {
  id: string;
  title: string;
  roundId: string;
  programSlug?: string;
}

export function useSessionComplete(invalidateKeys?: string[][]) {
  const queryClient = useQueryClient();
  const [sessionToComplete, setSessionToComplete] = useState<SessionToComplete | null>(null);
  const [recordingLink, setRecordingLink] = useState('');

  const markCompleteMutation = useMutation({
    mutationFn: async ({ sessionId, recordingUrl }: { sessionId: string; recordingUrl?: string }) => {
      // 1. Update session status
      const { error: updateError } = await supabase
        .from('program_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);
      if (updateError) throw updateError;

      // 2. Find the round's feed channel
      const session = sessionToComplete;
      if (!session) return;

      const { data: channel } = await supabase
        .from('feed_channels')
        .select('id')
        .eq('round_id', session.roundId)
        .single();

      if (!channel) {
        console.log('No feed channel found for round, skipping post');
        return;
      }

      // 3. Create feed post announcing completion
      const content = recordingUrl 
        ? `✅ **${session.title}** has been completed!\n\nWatch the recording below.`
        : `✅ **${session.title}** has been completed!`;

      const actionData = recordingUrl ? {
        type: 'link',
        label: '🎬 Watch Recording',
        url: recordingUrl,
      } : null;

      const { error: postError } = await supabase
        .from('feed_posts')
        .insert({
          channel_id: channel.id,
          content,
          post_type: 'update',
          is_system: true,
          display_name: 'Session Update',
          action_type: actionData ? 'link' : null,
          action_data: actionData,
          send_push: true,
        });

      if (postError) {
        console.error('Failed to create feed post:', postError);
      }
    },
    onSuccess: () => {
      // Invalidate all provided query keys
      invalidateKeys?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      toast.success('Session marked as completed & announced');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openDialog = (session: SessionToComplete) => {
    setSessionToComplete(session);
    setRecordingLink('');
  };

  const closeDialog = () => {
    setSessionToComplete(null);
    setRecordingLink('');
  };

  const confirmComplete = () => {
    if (!sessionToComplete) return;
    markCompleteMutation.mutate({
      sessionId: sessionToComplete.id,
      recordingUrl: recordingLink.trim() || undefined,
    });
  };

  return {
    sessionToComplete,
    recordingLink,
    setRecordingLink,
    openDialog,
    closeDialog,
    confirmComplete,
    isPending: markCompleteMutation.isPending,
  };
}
