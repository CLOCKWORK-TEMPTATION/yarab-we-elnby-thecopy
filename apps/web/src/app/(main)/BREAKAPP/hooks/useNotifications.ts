"use client";

/**
 * @module useNotifications
 * @description هوك إشعارات المتصفح لتطبيق BREAKAPP
 *
 * السبب: إبلاغ طاقم الإنتاج بالمستجدات الفورية
 * مثل: مهمة توصيل جديدة، تغيّر حالة الطلب، رسالة من المخرج
 */

import { useState, useEffect, useCallback } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported = "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * طلب إذن الإشعارات
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    }
  }, [isSupported]);

  /**
   * إرسال إشعار
   */
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions): Notification | null => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const notification = new Notification(title, {
          icon: "/icons/breakapp-icon-192.png",
          badge: "/icons/breakapp-badge-72.png",
          dir: "rtl",
          lang: "ar",
          ...options,
        });

        return notification;
      } catch {
        return null;
      }
    },
    [isSupported, permission]
  );

  /**
   * إشعار مهمة جديدة
   */
  const notifyNewTask = useCallback(
    (vendorName: string, itemCount: number): void => {
      sendNotification("مهمة توصيل جديدة", {
        body: `${itemCount} عنصر من ${vendorName}`,
        tag: "new-task",
      });
    },
    [sendNotification]
  );

  /**
   * إشعار تغيّر حالة الطلب
   */
  const notifyOrderStatus = useCallback(
    (orderId: string, status: string): void => {
      const statusLabels: Record<string, string> = {
        processing: "قيد المعالجة",
        completed: "مكتمل",
        cancelled: "ملغي",
      };

      sendNotification("تحديث الطلب", {
        body: `الطلب #${orderId.substring(0, 8)} — ${statusLabels[status] || status}`,
        tag: `order-${orderId}`,
      });
    },
    [sendNotification]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyNewTask,
    notifyOrderStatus,
  };
}
