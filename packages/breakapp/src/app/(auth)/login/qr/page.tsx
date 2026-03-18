'use client';

/**
 * صفحة تسجيل الدخول بـ QR - QR Login Page
 * 
 * @description
 * تتيح للمستخدمين الانضمام للمشروع بمسح رمز QR
 * بدلاً من إنشاء حساب تقليدي
 * 
 * السبب: تسريع عملية إضافة أعضاء الفريق للمشروع
 * خاصة في بيئات التصوير الميدانية السريعة
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '../../../../components/scanner/QRScanner';
import { scanQRAndLogin, storeToken, generateDeviceHash } from '../../../../lib/auth';
import { QRTokenSchema, type AuthResponse } from '../../../../lib/types';

/**
 * استجابة خطأ API
 * 
 * @description
 * يمثل بنية الخطأ المُرجعة من Axios عند فشل طلبات API
 * يُستخدم لاستخراج رسالة الخطأ من الخادم لعرضها للمستخدم
 */
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/**
 * صفحة تسجيل الدخول بمسح QR
 * 
 * @description
 * تعرض ماسح QR وتعالج عملية المصادقة
 * مع عرض حالات النجاح والفشل للمستخدم
 */
export default function QRLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * معالجة مسح رمز QR
   */
  const handleQRScan = useCallback(async (qrToken: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // التحقق من صيغة الرمز
      const validation = QRTokenSchema.safeParse(qrToken);
      if (!validation.success) {
        setError('صيغة رمز QR غير صالحة');
        setLoading(false);
        return;
      }

      // توليد بصمة الجهاز
      const deviceHash = generateDeviceHash();

      // المصادقة مع الخادم
      const result: AuthResponse = await scanQRAndLogin(qrToken, deviceHash);

      // تخزين الرمز
      storeToken(result.access_token);

      // إظهار النجاح
      setSuccess(true);

      // التوجيه للوحة التحكم
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const apiError = err as ApiErrorResponse;
      const errorMsg = apiError?.response?.data?.message || 
                       apiError?.message || 
                       'فشلت عملية المصادقة';
      setError(errorMsg);
      setLoading(false);
    }
  }, [router]);

  /**
   * معالجة خطأ المسح
   */
  const handleScanError = useCallback((errorMessage: string): void => {
    setError(errorMessage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Break Break
          </h1>
          <p className="text-gray-600">
            امسح رمز QR للانضمام لمشروعك
          </p>
        </div>

        {success ? (
          /* حالة النجاح */
          <div className="text-center p-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              نجاح!
            </h2>
            <p className="text-gray-600">
              جارٍ التوجيه للوحة التحكم...
            </p>
          </div>
        ) : (
          <>
            {/* ماسح QR */}
            <QRScanner onScan={handleQRScan} onError={handleScanError} />

            {/* مؤشر التحميل */}
            {loading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">جارٍ المصادقة...</p>
              </div>
            )}

            {/* رسالة الخطأ */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="text-sm font-medium">فشلت المصادقة</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* تعليمات */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>تأكد من منح إذن الوصول للكاميرا</p>
      </div>
    </div>
  );
}
