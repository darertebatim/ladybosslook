import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useShareJournalEntry = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      entryId, 
      title, 
      content, 
      mood 
    }: { 
      entryId: string; 
      title: string | null; 
      content: string; 
      mood: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get or create conversation
      let { data: conversation } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!conversation) {
        const { data: newConvo, error: convoError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            subject: 'Support Chat',
            status: 'open',
          })
          .select()
          .single();

        if (convoError) throw convoError;
        conversation = newConvo;
      }

      // Format the journal entry message
      const moodEmojis: Record<string, string> = {
        happy: '😊',
        peaceful: '😌',
        grateful: '🙏',
        motivated: '💪',
        reflective: '💭',
        challenged: '😔',
      };

      const moodText = mood ? `Mood: ${moodEmojis[mood] || mood}` : '';
      const titleText = title ? `**${title}**\n\n` : '';
      
      const messageContent = `📔 **Journal Entry Shared**\n\n${titleText}${moodText ? moodText + '\n\n' : ''}${content}`;

      // Send the message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'user',
          content: messageContent,
        });

      if (messageError) throw messageError;

      // Mark the journal entry as shared
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({
          shared_with_admin: true,
          shared_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      toast.success('Entry shared with Razie!');
    },
    onError: (error) => {
      console.error('Failed to share journal entry:', error);
      toast.error('Failed to share entry');
    },
  });
};
