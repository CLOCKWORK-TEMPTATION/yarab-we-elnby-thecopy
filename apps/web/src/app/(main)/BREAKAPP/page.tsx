'use client';

/**
 * الصفحة الرئيسية لـ BREAKAPP - توجيه تلقائي
 *
 * @description
 * تتحقق من حالة المصادقة وتُوجّه المستخدم تلقائياً
 * إلى لوحة التحكم أو صفحة تسجيل الدخول
 *
 * السبب: نقطة الدخول الوحيدة للتطبيق تضمن توجيهاً صحيحاً
 * بناءً على حالة الجلسة الحالية
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './lib/auth';

export default function BREAKAPPHome() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/BREAKAPP/dashboard');
    } else {
      router.replace('/BREAKAPP/login/qr');
    }
  }, [router]);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600 font-cairo">جارٍ التوجيه...</p>
      </div>
    </div>
  );
}
