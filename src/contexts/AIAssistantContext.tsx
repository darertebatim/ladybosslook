import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => string;
  updateMessage: (id: string, updates: Partial<Omit<Message, 'id'>>) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentPage: string;
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const saveQueue = useRef<Array<{ id: string; role: string; content: string }>>([]);
  const isSaving = useRef(false);

  const currentPage = location.pathname.split('/').pop() || 'overview';

  // Load messages from Supabase on mount / user change
  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      return;
    }

    const load = async () => {
      const { data, error } = await (supabase as any)
        .from('admin_ai_chat_messages')
        .select('id, role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    load();
  }, [user?.id]);

  // Flush save queue sequentially
  const flushQueue = useCallback(async () => {
    if (isSaving.current || saveQueue.current.length === 0 || !user?.id) return;
    isSaving.current = true;

    while (saveQueue.current.length > 0) {
      const item = saveQueue.current[0];
      const { error } = await (supabase as any)
        .from('admin_ai_chat_messages')
        .upsert({ id: item.id, user_id: user.id, role: item.role, content: item.content }, { onConflict: 'id' });

      if (error) {
        console.error('[AIAssistant] save error:', error.message);
      }
      saveQueue.current.shift();
    }

    isSaving.current = false;
  }, [user?.id]);

  const enqueueSave = useCallback((msg: { id: string; role: string; content: string }) => {
    // Replace existing entry for same id (streaming updates)
    const idx = saveQueue.current.findIndex(q => q.id === msg.id);
    if (idx >= 0) {
      saveQueue.current[idx] = msg;
    } else {
      saveQueue.current.push(msg);
    }
    flushQueue();
  }, [flushQueue]);

  // Cmd+J / Ctrl+J keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>): string => {
    const id = crypto.randomUUID();
    const newMsg = { ...message, id };
    setMessages(prev => [...prev, newMsg]);
    enqueueSave({ id, role: message.role, content: message.content });
    return id;
  }, [enqueueSave]);

  const updateMessage = useCallback((id: string, updates: Partial<Omit<Message, 'id'>>) => {
    setMessages(prev => {
      const updated = prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg);
      const msg = updated.find(m => m.id === id);
      if (msg) {
        enqueueSave({ id: msg.id, role: msg.role, content: msg.content });
      }
      return updated;
    });
  }, [enqueueSave]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    saveQueue.current = [];
    if (user?.id) {
      await (supabase as any)
        .from('admin_ai_chat_messages')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user?.id]);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        addMessage,
        updateMessage,
        clearMessages,
        isLoading,
        setIsLoading,
        currentPage,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}
