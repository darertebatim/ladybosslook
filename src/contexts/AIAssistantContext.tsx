import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface FormFillHandler {
  formType: string;
  handler: (data: Record<string, any>) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCall?: {
    name: string;
    data: Record<string, any>;
  };
}

interface AIAssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => string; // Returns the message ID
  updateMessage: (id: string, updates: Partial<Omit<Message, 'id'>>) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentPage: string;
  registerFormHandler: (formType: string, handler: (data: Record<string, any>) => void) => void;
  unregisterFormHandler: (formType: string) => void;
  applyToForm: (formType: string, data: Record<string, any>) => boolean;
  hasFormHandler: (formType: string) => boolean;
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formHandlers, setFormHandlers] = useState<Map<string, FormFillHandler['handler']>>(new Map());
  const location = useLocation();

  // Extract current page from route
  const currentPage = location.pathname.split('/').pop() || 'overview';

  const addMessage = useCallback((message: Omit<Message, 'id'>): string => {
    const id = crypto.randomUUID();
    setMessages(prev => [...prev, { ...message, id }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Omit<Message, 'id'>>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const registerFormHandler = useCallback((formType: string, handler: (data: Record<string, any>) => void) => {
    setFormHandlers(prev => {
      const next = new Map(prev);
      next.set(formType, handler);
      return next;
    });
  }, []);

  const unregisterFormHandler = useCallback((formType: string) => {
    setFormHandlers(prev => {
      const next = new Map(prev);
      next.delete(formType);
      return next;
    });
  }, []);

  const applyToForm = useCallback((formType: string, data: Record<string, any>): boolean => {
    const handler = formHandlers.get(formType);
    if (handler) {
      handler(data);
      return true;
    }
    return false;
  }, [formHandlers]);

  const hasFormHandler = useCallback((formType: string): boolean => {
    return formHandlers.has(formType);
  }, [formHandlers]);

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
        registerFormHandler,
        unregisterFormHandler,
        applyToForm,
        hasFormHandler,
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
