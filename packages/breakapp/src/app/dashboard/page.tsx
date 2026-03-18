'use client';

/**
 * صفحة لوحة التحكم - Dashboard Page
 * 
 * @description
 * الصفحة الرئيسية للمستخدم المُصادق عليه
 * تعرض معلومات المستخدم وحالة الاتصال
 * 
 * السبب: توفر نظرة عامة سريعة على حالة المستخدم
 * والمشروع المرتبط به بعد المصادقة
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, removeToken } from '../../lib/auth';
import ConnectionTest from '../../components/ConnectionTest';
import type { CurrentUser } from '../../lib/types';

/**
 * صفحة لوحة التحكم الرئيسية
 * 
 * @description
 * تتحقق من المصادقة وتعرض معلومات المستخدم
 * مع إمكانية تسجيل الخروج
 */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // التحقق من المصادقة
    if (!isAuthenticated()) {
      router.push('/login/qr');
      return;
    }

    // جلب بيانات المستخدم
    const userData = getCurrentUser();
    setUser(userData);
  }, [router]);

  /**
   * تسجيل الخروج
   */
  const handleLogout = useCallback((): void => {
    removeToken();
    router.push('/login/qr');
  }, [router]);

  // عرض مؤشر التحميل
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Break Break</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">لوحة التحكم</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">معرف المستخدم</p>
              <p className="text-lg text-gray-900 mt-1 font-mono text-xs">{user.userId}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">معرف المشروع</p>
              <p className="text-lg text-gray-900 mt-1 font-mono text-xs">{user.projectId}</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">الدور</p>
              <p className="text-lg text-gray-900 mt-1 uppercase">{user.role}</p>
            </div>
          </div>
        </div>

        {/* مكون اختبار الاتصال */}
        <div className="mb-6">
          <ConnectionTest />
        </div>

        {/* رسالة الترحيب */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            مرحبًا بك في Break Break!
          </h3>
          <p className="text-gray-600">
            تم المصادقة بنجاح باستخدام رمز QR. هذه هي لوحة التحكم الخاصة بمشروعك.
          </p>
        </div>
      </main>
    </div>
  );
}
