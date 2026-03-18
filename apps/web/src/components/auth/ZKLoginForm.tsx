/**
 * نموذج تسجيل الدخول Zero-Knowledge
 * Zero-Knowledge Login Form
 * 
 * المبادئ:
 * 1. جلب kdfSalt من السيرفر أولاً
 * 2. اشتقاق authVerifier محلياً
 * 3. إرسال authVerifier للتحقق
 * 4. اشتقاق KEK وحفظه في الذاكرة
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deriveKEK,
  deriveAuthVerifier,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from '@/lib/crypto';
import { getKeyManager } from '@/lib/crypto';

export function ZKLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // المرحلة 1: جلب kdfSalt من السيرفر
      const initResponse = await fetch('/api/auth/zk-login-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const initData = await initResponse.json();

      if (!initData.success) {
        setError(initData.error || 'فشل في بدء تسجيل الدخول');
        return;
      }

      const kdfSalt = base64ToUint8Array(initData.data.kdfSalt);

      // المرحلة 2: اشتقاق authVerifier محلياً
      const authVerifierBytes = await deriveAuthVerifier(password, kdfSalt);
      const authVerifier = uint8ArrayToBase64(authVerifierBytes);

      // المرحلة 3: التحقق من authVerifier
      const verifyResponse = await fetch('/api/auth/zk-login-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          authVerifier,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError(verifyData.error || 'بيانات اعتماد غير صحيحة');
        return;
      }

      // المرحلة 4: اشتقاق KEK وحفظه في الذاكرة
      const kek = await deriveKEK(password, kdfSalt);
      const keyManager = getKeyManager();
      keyManager.setKEK(kek);

      // حفظ Token
      localStorage.setItem('token', verifyData.data.token);

      // الانتقال إلى لوحة التحكم
      router.push('/dashboard');
    } catch (err) {
      console.error('خطأ في تسجيل الدخول:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md" dir="rtl">
      <h2 className="text-2xl font-bold mb-6">تسجيل الدخول</h2>

      <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-4 text-sm">
        <p className="font-semibold mb-1">🔒 Zero-Knowledge</p>
        <p className="text-xs">
          كلمة المرور تُستخدم فقط على جهازك لفك تشفير بياناتك.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <a href="/forgot-password" className="text-blue-600 hover:underline">
          نسيت كلمة المرور؟
        </a>
      </div>
    </div>
  );
}
