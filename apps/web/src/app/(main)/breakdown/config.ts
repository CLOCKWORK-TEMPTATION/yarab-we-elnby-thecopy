/**
 * @fileoverview إعدادات التطبيق والتحقق من صحة البيانات
 * 
 * هذا الملف يتولى إعداد البيئة وتهيئة واجهات API.
 * 
 * السبب: نجمع جميع إعدادات التطبيق في مكان واحد لتسهيل
 * الصيانة وضمان اتساق التكوين عبر التطبيق.
 */

/**
 * واجهة إعدادات التطبيق
 */
export interface AppConfig {
  /** مفتاح API للوصول لخدمة Gemini */
  apiKey: string;
  /** هل التطبيق مُعد بشكل صحيح */
  isConfigured: boolean;
  /** البيئة الحالية */
  environment: 'development' | 'production' | 'preview';
}

/**
 * يحصل على قيمة من كائن window بشكل آمن
 * 
 * السبب: نتجنب الأخطاء في بيئة الخادم حيث window غير متاح
 * 
 * @param key - اسم المفتاح
 * @returns القيمة أو undefined
 */
const getWindowValue = (key: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const windowObj = window as unknown as Record<string, unknown>;
  const value = windowObj[key];
  return typeof value === 'string' ? value : undefined;
};

/**
 * يحصل على مفتاح API من مصادر متعددة بترتيب الأولوية
 * 
 * السبب: ندعم مصادر متعددة لمفتاح API لتوفير المرونة
 * في بيئات التطوير والإنتاج المختلفة
 * 
 * @returns مفتاح API أو سلسلة فارغة
 */
export const getAPIKey = (): string => {
  // ترتيب الأولوية:
  // 1. متغير البيئة GEMINI_API_KEY
  // 2. متغير البيئة API_KEY (احتياطي)
  // 3. المتغير العالمي في النافذة (للتطوير)
  // 4. سلسلة فارغة
  
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY || 
    getWindowValue('GEMINI_API_KEY') ||
    '';
  
  return apiKey;
};

/**
 * يتحقق من صحة تنسيق مفتاح API
 * 
 * السبب: نتحقق من المفتاح لمنع طلبات API الفاشلة
 * وتوفير رسائل خطأ واضحة للمطورين
 * 
 * @param key - مفتاح API للتحقق منه
 * @returns صحيح إذا كان المفتاح صالحاً
 */
export const isValidAPIKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;
  
  // مفاتيح Gemini API لها تنسيق معين
  // على الأقل يجب أن تكون غير فارغة وليست نص placeholder
  const isPlaceholder = /placeholder|change|your.*key|xxx|demo/i.test(key);
  
  return key.length > 20 && !isPlaceholder;
};

/**
 * يحصل على إعدادات التطبيق
 * 
 * السبب: نوفر واجهة موحدة للحصول على جميع الإعدادات
 * مع تسجيل التحذيرات عند وجود مشاكل
 * 
 * @returns كائن إعدادات التطبيق
 */
export const getAppConfig = (): AppConfig => {
  const apiKey = getAPIKey();
  const isConfigured = isValidAPIKey(apiKey);
  
  if (!isConfigured) {
    // نستخدم console.warn هنا فقط لأنها رسالة بدء التشغيل
    console.warn('⚠️ تحذير: مفتاح GEMINI_API_KEY غير مُعد بشكل صحيح. ميزات الذكاء الاصطناعي لن تعمل.');
    console.warn('الرجاء تعيين GEMINI_API_KEY في ملف .env.local');
  }
  
  return {
    apiKey,
    isConfigured,
    environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development'
  };
};

/**
 * يُنسق رسالة الخطأ لعرضها للمستخدم
 * 
 * السبب: نوفر رسائل خطأ مفهومة للمستخدم العربي
 * مع دعم أنواع أخطاء مختلفة
 * 
 * @param error - الخطأ للتنسيق
 * @returns رسالة الخطأ المُنسقة
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
};

/**
 * يُسجل خطأ مع السياق للتصحيح
 * 
 * السبب: نوفر تسجيل موحد للأخطاء يشمل الوقت والسياق
 * لتسهيل التصحيح والمراقبة
 * 
 * @param context - سياق الخطأ (مثل اسم الدالة)
 * @param error - الخطأ للتسجيل
 */
export const logError = (context: string, error: unknown): void => {
  const timestamp = new Date().toISOString();
  const message = formatErrorMessage(error);
  
  // نستخدم console.error للتسجيل في بيئة التطوير
  // في الإنتاج، يمكن استبدال هذا بخدمة تسجيل خارجية
  console.error(`[${timestamp}] [${context}]`, {
    message,
    error,
    stack: error instanceof Error ? error.stack : undefined
  });
};

/**
 * يتحقق من صحة هيكل استجابة API
 * 
 * السبب: نتحقق من وجود المفاتيح المطلوبة قبل معالجة البيانات
 * لمنع أخطاء وقت التشغيل
 * 
 * @param response - الاستجابة للتحقق منها
 * @param expectedKeys - المفاتيح المطلوبة
 * @returns صحيح إذا كانت الاستجابة صالحة
 */
export const validateResponse = (response: unknown, expectedKeys: string[]): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  return expectedKeys.every(key => key in (response as Record<string, unknown>));
};
