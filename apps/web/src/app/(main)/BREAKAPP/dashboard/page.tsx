'use client';

/**
 * صفحة لوحة التحكم - Dashboard Page
 *
 * @description
 * الصفحة الرئيسية للمستخدم المُصادق عليه
 * تعرض معلومات المستخدم وروابط سريعة حسب الدور
 *
 * السبب: توفر نظرة عامة على حالة المستخدم والمشروع
 * مع توجيه سريع للأقسام المناسبة حسب دور المستخدم
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, removeToken } from '../lib/auth';
import { ConnectionTest } from '@the-copy/breakapp';
import type { CurrentUser } from '../lib/types';
import { toast } from '@/hooks/use-toast';

/**
 * تعريف الروابط السريعة حسب الدور
 */
const ROLE_QUICK_LINKS: Record<string, Array<{ label: string; href: string; description: string; color: string }>> = {
  director: [
    { label: 'لوحة المخرج', href: '/BREAKAPP/director', description: 'إدارة مواقع التصوير والموردين', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'قائمة الطعام', href: '/BREAKAPP/crew/menu', description: 'عرض قائمة الطلبات', color: 'bg-green-50 text-green-700 border-green-200' },
  ],
  crew: [
    { label: 'قائمة الطعام', href: '/BREAKAPP/crew/menu', description: 'طلب الطعام من الموردين', color: 'bg-green-50 text-green-700 border-green-200' },
  ],
  runner: [
    { label: 'تتبع التوصيل', href: '/BREAKAPP/runner/track', description: 'إدارة مهام التوصيل', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/BREAKAPP/login/qr');
      return;
    }

    const userData = getCurrentUser();
    setUser(userData);
  }, [router]);

  /**
   * تسجيل الخروج
   */
  const handleLogout = useCallback((): void => {
    removeToken();
    toast({
      title: 'تم تسجيل الخروج',
      description: 'تم إنهاء الجلسة بنجاح',
    });
    router.replace('/BREAKAPP/login/qr');
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const quickLinks = ROLE_QUICK_LINKS[user.role] || [];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* شريط التنقل */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 font-cairo">Break Break</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium font-cairo"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* بطاقة معلومات المستخدم */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-cairo">لوحة التحكم</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium font-cairo">معرف المستخدم</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{user.userId}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium font-cairo">معرف المشروع</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{user.projectId}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium font-cairo">الدور</p>
              <p className="text-lg text-gray-900 mt-1 uppercase">{user.role}</p>
            </div>
          </div>
        </div>

        {/* روابط سريعة حسب الدور */}
        {quickLinks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-cairo">وصول سريع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`p-4 border rounded-lg text-right hover:shadow-md transition-shadow ${link.color}`}
                >
                  <h4 className="font-semibold font-cairo">{link.label}</h4>
                  <p className="text-sm mt-1 opacity-80 font-cairo">{link.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* مكون اختبار الاتصال */}
        <div className="mb-6">
          <ConnectionTest />
        </div>

        {/* رسالة الترحيب */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-cairo">
            مرحبًا بك في Break Break!
          </h3>
          <p className="text-gray-600 font-cairo">
            تم المصادقة بنجاح باستخدام رمز QR. هذه هي لوحة التحكم الخاصة بمشروعك.
          </p>
        </div>
      </main>
    </div>
  );
}
