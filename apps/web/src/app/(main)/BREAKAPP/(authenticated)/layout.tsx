'use client';

/**
 * تخطيط الصفحات المحمية — Auth Guard
 *
 * @description
 * يتحقق من مصادقة المستخدم قبل عرض أي صفحة محمية
 * ويُوجّه غير المصادقين لصفحة تسجيل الدخول تلقائياً
 *
 * السبب: حماية مركزية لجميع الصفحات التي تتطلب مصادقة
 * بدلاً من تكرار التحقق في كل صفحة على حدة
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import type { CurrentUser } from '../lib/types';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/BREAKAPP/login/qr');
      return;
    }

    const userData = getCurrentUser();
    setUser(userData);
    setChecking(false);
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600 font-cairo">جارٍ التحقق من المصادقة...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
