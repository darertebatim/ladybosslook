import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CoachMode = 'coach' | 'assistant' | 'companion';

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'divider';
  content: string;
  timestamp: number;
  actionResults?: ActionResult[];
  mode?: CoachMode;
  imageUrl?: string; // for displaying attached images
}

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  created?: Record<string, any>;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useAICoachStream() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setFollowUps([]);
  }, []);

  const insertDivider = useCallback((newMode: CoachMode) => {
    setFollowUps([]);
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role === 'divider') return prev;
      return [...prev, {
        id: `divider-${Date.now()}`,
        role: 'divider',
        content: `Switched to ${newMode}`,
        timestamp: Date.now(),
        mode: newMode,
      }];
    });
  }, []);

  const getActiveMessages = useCallback((allMessages: CoachMessage[]) => {
    const lastDividerIdx = allMessages.map(m => m.role).lastIndexOf('divider');
    const active = lastDividerIdx >= 0 ? allMessages.slice(lastDividerIdx + 1) : allMessages;
    return active.filter(m => m.role === 'user' || m.role === 'assistant');
  }, []);

  const sendMessage = useCallback(async (text: string, mode?: string, imageBase64?: string) => {
    if ((!text.trim() && !imageBase64) || isLoading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in first');
      return;
    }

    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      imageUrl: imageBase64 || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setFollowUps([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const allMessages = [...messages, userMsg];
      const activeMessages = getActiveMessages(allMessages);

      // Build messages payload - include image for the latest message if present
      const messagesPayload = activeMessages.map((m, i) => {
        const isLast = i === activeMessages.length - 1;
        if (isLast && m.imageUrl && m.role === 'user') {
          return {
            role: m.role,
            content: m.content,
            image: m.imageUrl,
          };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: messagesPayload,
          mode,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 429) toast.error('Too many requests. Please wait a moment.');
        else if (response.status === 402) toast.error('AI credits exhausted.');
        else toast.error(err.error || 'Failed to get response');
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let actionResults: ActionResult[] = [];
      let buffer = '';
      const assistantId = crypto.randomUUID();

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.action_results) {
            actionResults = parsed.action_results;
            return;
          }

          if (parsed.suggested_followups) {
            setFollowUps(parsed.suggested_followups);
            return;
          }

          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.id === assistantId) {
                return prev.map(m => m.id === assistantId ? { ...m, content: assistantContent, actionResults: actionResults.length > 0 ? actionResults : undefined } : m);
              }
              return [...prev, {
                id: assistantId,
                role: 'assistant' as const,
                content: assistantContent,
                timestamp: Date.now(),
                actionResults: actionResults.length > 0 ? actionResults : undefined,
              }];
            });
          }
        } catch {
          // partial chunk
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) processLine(line);
      }

      if (buffer) {
        for (const line of buffer.split('\n')) processLine(line);
      }

      if (actionResults.length > 0) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, actionResults } : m
        ));
      }

      // Persist to DB (don't persist base64 images - too large)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const finalMessages = [...allMessages, { id: assistantId, role: 'assistant' as const, content: assistantContent, timestamp: Date.now(), actionResults: actionResults.length > 0 ? actionResults : undefined }];
        const msgPayload = finalMessages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          mode: (m as any).mode || undefined,
          actionResults: (m as any).actionResults || undefined,
          // Don't persist imageUrl (base64) - too large for DB
        }));
        await supabase.from('ai_coach_conversations').upsert({
          user_id: user.id,
          messages: msgPayload,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('AI Coach error:', e);
        toast.error('Failed to get response');
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading, getActiveMessages]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const loadHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_coach_conversations')
      .select('messages')
      .eq('user_id', user.id)
      .single();

    if (data?.messages && Array.isArray(data.messages)) {
      setMessages((data.messages as any[]).map((m: any, i: number) => ({
        id: `history-${i}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp || Date.now(),
        mode: m.mode || undefined,
        actionResults: m.actionResults || undefined,
      })));
    }
  }, []);

  return { messages, isLoading, sendMessage, clearMessages, stopGeneration, loadHistory, followUps, insertDivider };
}
