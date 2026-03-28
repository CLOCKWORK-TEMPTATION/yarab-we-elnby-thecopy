"use client";

/**
 * @module OfflineIndicator
 * @description مؤشر حالة الاتصال — يُظهر تنبيهاً عند فقدان الاتصال
 *
 * السبب: يجب أن يعرف طاقم الإنتاج الميداني
 * أن التطبيق يعمل بدون اتصال وأن الطلبات ستُرسل لاحقاً
 */

import { useOfflineSupport } from "../hooks/useOfflineSupport";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSupport();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      dir="rtl"
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
        isOnline
          ? "bg-yellow-50 border border-yellow-300 text-yellow-800"
          : "bg-red-50 border border-red-300 text-red-800"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* أيقونة الحالة */}
        <div
          className={`shrink-0 w-3 h-3 rounded-full ${
            isOnline ? "bg-yellow-500" : "bg-red-500 animate-pulse"
          }`}
        />

        <div className="flex-1">
          {!isOnline ? (
            <>
              <p className="text-sm font-semibold font-cairo">بدون اتصال</p>
              <p className="text-xs mt-0.5 font-cairo">
                التطبيق يعمل — الطلبات ستُرسل عند عودة الاتصال
              </p>
            </>
          ) : isSyncing ? (
            <>
              <p className="text-sm font-semibold font-cairo">جارٍ المزامنة...</p>
              <p className="text-xs mt-0.5 font-cairo">
                يتم إرسال {pendingCount} طلب معلق
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold font-cairo">طلبات معلقة</p>
              <p className="text-xs mt-0.5 font-cairo">
                {pendingCount} طلب في انتظار الإرسال
              </p>
            </>
          )}
        </div>

        {/* مؤشر المزامنة */}
        {isSyncing && (
          <div className="shrink-0 animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
        )}
      </div>
    </div>
  );
}
