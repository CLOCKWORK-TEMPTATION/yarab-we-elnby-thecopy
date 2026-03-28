"use client";

/**
 * @module useOfflineSupport
 * @description هوك دعم العمل بدون اتصال لتطبيق BREAKAPP
 *
 * السبب: مواقع التصوير الميدانية غالباً ما تكون في مناطق
 * ضعيفة التغطية — التطبيق يجب أن يعمل حتى بدون إنترنت
 *
 * الآلية:
 * 1. يراقب حالة الاتصال (online/offline)
 * 2. يُخزّن الطلبات الفاشلة في قائمة انتظار محلية
 * 3. يعيد إرسال الطلبات المعلقة عند عودة الاتصال
 */

import { useState, useEffect, useCallback } from "react";

/** طلب API معلق */
interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  createdAt: string;
}

const QUEUE_KEY = "breakapp_offline_queue";

/**
 * قراءة قائمة الانتظار
 */
function readQueue(): PendingRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingRequest[]) : [];
  } catch {
    return [];
  }
}

/**
 * كتابة قائمة الانتظار
 */
function writeQueue(queue: PendingRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // مساحة ممتلئة
  }
}

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  /** مراقبة حالة الاتصال */
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    setPendingCount(readQueue().length);

    const handleOnline = (): void => {
      setIsOnline(true);
      syncPendingRequests();
    };

    const handleOffline = (): void => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * إضافة طلب للقائمة عند فشل الإرسال
   */
  const enqueueRequest = useCallback(
    (url: string, method: string, body?: unknown, headers?: Record<string, string>): void => {
      const queue = readQueue();
      queue.push({
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url,
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers,
        createdAt: new Date().toISOString(),
      });
      writeQueue(queue);
      setPendingCount(queue.length);
    },
    []
  );

  /**
   * مزامنة الطلبات المعلقة عند عودة الاتصال
   */
  const syncPendingRequests = useCallback(async (): Promise<number> => {
    const queue = readQueue();
    if (queue.length === 0) return 0;

    setIsSyncing(true);
    let synced = 0;
    const remaining: PendingRequest[] = [];

    for (const req of queue) {
      try {
        await fetch(req.url, {
          method: req.method,
          body: req.body,
          headers: {
            "Content-Type": "application/json",
            ...(req.headers || {}),
          },
        });
        synced++;
      } catch {
        // إعادة الطلب للقائمة إذا فشل
        remaining.push(req);
      }
    }

    writeQueue(remaining);
    setPendingCount(remaining.length);
    setIsSyncing(false);

    return synced;
  }, []);

  /**
   * مسح قائمة الانتظار
   */
  const clearQueue = useCallback((): void => {
    writeQueue([]);
    setPendingCount(0);
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    enqueueRequest,
    syncPendingRequests,
    clearQueue,
  };
}
