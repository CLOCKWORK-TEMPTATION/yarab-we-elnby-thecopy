"use client";

/**
 * @module useSessionPersistence
 * @description هوك حفظ واسترجاع جلسات العصف الذهني من التخزين المحلي
 *
 * السبب: يمنع فقدان الجلسات عند إعادة تحميل الصفحة
 * ويتيح للمستخدم الرجوع لجلسات سابقة
 */

import { useState, useCallback, useEffect } from "react";
import type { Session, DebateMessage } from "../types";

/** مفتاح التخزين */
const STORAGE_KEY = "brainstorm_sessions";
const CURRENT_SESSION_KEY = "brainstorm_current_session";

/** جلسة محفوظة مع بيانات النقاش */
export interface SavedSession {
  session: Session;
  messages: DebateMessage[];
  savedAt: string;
}

/** قائمة الجلسات المحفوظة */
interface SessionStore {
  sessions: SavedSession[];
  version: number;
}

/**
 * قراءة المخزن من localStorage
 */
function readStore(): SessionStore {
  if (typeof window === "undefined") {
    return { sessions: [], version: 1 };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [], version: 1 };

    const parsed = JSON.parse(raw) as SessionStore;
    return parsed;
  } catch {
    return { sessions: [], version: 1 };
  }
}

/**
 * كتابة المخزن إلى localStorage
 */
function writeStore(store: SessionStore): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // تجاهل أخطاء الكتابة (مساحة ممتلئة)
  }
}

export function useSessionPersistence() {
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /** تحميل الجلسات المحفوظة عند التهيئة */
  useEffect(() => {
    const store = readStore();
    setSavedSessions(store.sessions);
    setIsLoaded(true);
  }, []);

  /**
   * حفظ جلسة حالية
   */
  const saveSession = useCallback(
    (session: Session, messages: DebateMessage[]): void => {
      const savedSession: SavedSession = {
        session: {
          ...session,
          startTime: session.startTime,
        },
        messages: messages.map((m) => ({
          ...m,
          timestamp: m.timestamp,
        })),
        savedAt: new Date().toISOString(),
      };

      const store = readStore();

      // تحديث الجلسة إذا كانت موجودة أو إضافتها
      const existingIndex = store.sessions.findIndex(
        (s) => s.session.id === session.id
      );
      if (existingIndex >= 0) {
        store.sessions[existingIndex] = savedSession;
      } else {
        store.sessions.unshift(savedSession);
      }

      // الاحتفاظ بآخر 20 جلسة فقط
      if (store.sessions.length > 20) {
        store.sessions = store.sessions.slice(0, 20);
      }

      writeStore(store);
      setSavedSessions([...store.sessions]);
    },
    []
  );

  /**
   * حذف جلسة محفوظة
   */
  const deleteSession = useCallback((sessionId: string): void => {
    const store = readStore();
    store.sessions = store.sessions.filter(
      (s) => s.session.id !== sessionId
    );
    writeStore(store);
    setSavedSessions([...store.sessions]);
  }, []);

  /**
   * تحميل جلسة محفوظة
   */
  const loadSession = useCallback(
    (sessionId: string): SavedSession | null => {
      const store = readStore();
      return (
        store.sessions.find((s) => s.session.id === sessionId) || null
      );
    },
    []
  );

  /**
   * مسح جميع الجلسات
   */
  const clearAllSessions = useCallback((): void => {
    writeStore({ sessions: [], version: 1 });
    setSavedSessions([]);
  }, []);

  /**
   * حفظ معرّف الجلسة الحالية
   */
  const setCurrentSessionId = useCallback((id: string | null): void => {
    if (typeof window === "undefined") return;
    if (id) {
      localStorage.setItem(CURRENT_SESSION_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }, []);

  /**
   * استرجاع معرّف الجلسة الحالية
   */
  const getCurrentSessionId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CURRENT_SESSION_KEY);
  }, []);

  return {
    savedSessions,
    isLoaded,
    saveSession,
    deleteSession,
    loadSession,
    clearAllSessions,
    setCurrentSessionId,
    getCurrentSessionId,
  };
}
