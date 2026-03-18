/**
 * خدمة المصادقة - Authentication Service
 * 
 * @description
 * توفر وظائف إدارة جلسات المستخدم والتحقق من الهوية
 * عبر رموز JWT ومسح QR للانضمام للمشاريع
 * 
 * السبب: نظام المصادقة القائم على QR يسمح لأعضاء الفريق
 * بالانضمام للمشروع بسرعة دون الحاجة لإنشاء حسابات
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import {
  type CurrentUser,
  type AuthResponse,
  JWTPayloadSchema,
  QRTokenSchema,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * مثيل Axios مُهيأ للتواصل مع الخادم
 * 
 * @description
 * يتضمن interceptors لإضافة رمز المصادقة تلقائياً لكل طلب
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة interceptor لتضمين رمز المصادقة في كل طلب
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * تخزين رمز JWT في التخزين المحلي
 * 
 * @description
 * يحفظ الرمز بشكل آمن في localStorage للاستخدام
 * في الطلبات اللاحقة - يعمل فقط على جانب العميل
 * 
 * @param token - رمز JWT المراد تخزينه
 */
export function storeToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

/**
 * استرجاع رمز JWT من التخزين المحلي
 * 
 * @description
 * يجلب الرمز المخزن للتحقق من المصادقة
 * أو لإرفاقه مع الطلبات
 * 
 * @returns رمز JWT أو null إذا لم يكن موجوداً
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

/**
 * حذف رمز JWT من التخزين المحلي
 * 
 * @description
 * يُستخدم عند تسجيل الخروج أو انتهاء صلاحية الجلسة
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

/**
 * التحقق من حالة المصادقة
 * 
 * @description
 * يفحص وجود رمز JWT صالح وغير منتهي الصلاحية
 * للتأكد من أن المستخدم لا يزال مُصادقاً عليه
 * 
 * @returns true إذا كان المستخدم مُصادقاً عليه
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payloadBase64 = parts[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    
    // التحقق من صحة البيانات باستخدام Zod
    const result = JWTPayloadSchema.safeParse(decodedPayload);
    if (!result.success) return false;

    const expirationTime = result.data.exp * 1000;
    return Date.now() < expirationTime;
  } catch {
    return false;
  }
}

/**
 * استخراج بيانات المستخدم الحالي من الرمز
 * 
 * @description
 * يفك تشفير JWT ويستخرج معلومات المستخدم الأساسية
 * دون الحاجة للتواصل مع الخادم
 * 
 * @returns بيانات المستخدم أو null إذا لم يكن مُصادقاً
 */
export function getCurrentUser(): CurrentUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    
    const result = JWTPayloadSchema.safeParse(decodedPayload);
    if (!result.success) return null;

    return {
      userId: result.data.sub,
      projectId: result.data.projectId,
      role: result.data.role,
    };
  } catch {
    return null;
  }
}

/**
 * مسح رمز QR والمصادقة
 * 
 * @description
 * يرسل رمز QR المُمسوح وبصمة الجهاز للخادم
 * للحصول على رمز JWT للوصول
 * 
 * السبب: يتيح للمستخدمين الانضمام للمشروع بمسح رمز QR
 * مما يُسهل إدارة أذونات الفريق
 * 
 * @param qrToken - رمز QR المُمسوح
 * @param deviceHash - بصمة الجهاز للتعرف عليه
 * @returns بيانات المصادقة بما فيها رمز الوصول
 * @throws خطأ إذا فشلت المصادقة
 */
export async function scanQRAndLogin(
  qrToken: string,
  deviceHash: string
): Promise<AuthResponse> {
  // التحقق من صيغة رمز QR
  const tokenValidation = QRTokenSchema.safeParse(qrToken);
  if (!tokenValidation.success) {
    throw new Error(tokenValidation.error.errors[0]?.message || 'رمز QR غير صالح');
  }

  const response = await api.post<AuthResponse>('/auth/scan-qr', {
    qr_token: qrToken,
    device_hash: deviceHash,
  });
  
  return response.data;
}

/**
 * التحقق من صلاحية رمز JWT
 * 
 * @description
 * يُرسل الرمز للخادم للتحقق من صلاحيته
 * ويُرجع بيانات الحمولة إذا كان صالحاً
 * 
 * @param token - رمز JWT للتحقق منه
 * @returns نتيجة التحقق وبيانات الحمولة
 */
export async function verifyToken(
  token: string
): Promise<{ valid: boolean; payload: CurrentUser | null }> {
  const response = await api.post<{ valid: boolean; payload: CurrentUser | null }>(
    '/auth/verify',
    { token }
  );
  return response.data;
}

/**
 * توليد بصمة الجهاز
 * 
 * @description
 * يُنشئ معرّف فريد للجهاز بناءً على خصائص المتصفح
 * لتتبع الأجهزة المصرح لها بالوصول
 * 
 * السبب: يمنع استخدام نفس رمز QR من أجهزة متعددة
 * غير مصرح لها
 * 
 * @returns سلسلة نصية تمثل بصمة الجهاز
 * @throws خطأ إذا تم استدعاؤها على جانب الخادم
 */
export function generateDeviceHash(): string {
  if (typeof window === 'undefined') {
    throw new Error('توليد بصمة الجهاز متاح فقط على جانب العميل');
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
  ];

  const fingerprint = components.join('|');
  
  // إنشاء hash بسيط
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

export { api };

