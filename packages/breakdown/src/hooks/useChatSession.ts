import { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface UseChatSessionResult {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  sendMessage: (e: React.FormEvent) => Promise<void>;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'model',
  text: 'مرحباً! أنا مساعدك الذكي المتخصص في السينما. كيف يمكنني مساعدتك في تحليل السيناريو اليوم؟'
};

const ERROR_MESSAGES = {
  initFailed: 'عذراً، لم يتمكن التطبيق من الاتصال بخدمة الذكاء الاصطناعي. تأكد من تعيين مفتاح API الصحيح.',
  serviceUnavailable: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
  generic: (msg: string) => `عذراً، حدث خطأ: ${msg}. يرجى المحاولة مرة أخرى.`
};

function createErrorMessage(text: string): Message {
  return {
    id: Date.now().toString(),
    role: 'model',
    text
  };
}

function initializeSession(chatSessionRef: React.MutableRefObject<Chat | null>): boolean {
  if (chatSessionRef.current) return true;

  try {
    chatSessionRef.current = createChatSession();
    return true;
  } catch (error) {
    console.error('Failed to initialize chat session:', error);
    return false;
  }
}

export function useChatSession(): UseChatSessionResult {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Initialize chat session on mount
  useEffect(() => {
    const success = initializeSession(chatSessionRef);
    if (!success) {
      setMessages(prev => [...prev, createErrorMessage(ERROR_MESSAGES.initFailed)]);
    }
  }, []);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Ensure session is initialized
      if (!initializeSession(chatSessionRef)) {
        setMessages(prev => [...prev, createErrorMessage(ERROR_MESSAGES.serviceUnavailable)]);
        return;
      }

      // Add placeholder for streaming response
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMessageId, role: 'model', text: '' }]);

      // Stream the response
      const result = await chatSessionRef.current!.sendMessageStream({ message: userMessage.text });

      let fullText = '';
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullText += text;

        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId ? { ...msg, text: fullText } : msg
        ));
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setMessages(prev => [...prev, createErrorMessage(ERROR_MESSAGES.generic(errorMessage))]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage
  };
}
