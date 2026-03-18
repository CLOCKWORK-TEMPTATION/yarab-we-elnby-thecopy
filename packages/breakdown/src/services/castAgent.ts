/**
 * @fileoverview خدمة وكيل طاقم التمثيل
 * 
 * هذا الملف يعيد تصدير من وحدة castAgent المُعاد هيكلتها للتوافق مع الإصدارات السابقة.
 * الملف الأصلي الضخم تم تقسيمه إلى وحدات مركزة:
 * 
 * - castAgent/constants.ts: الإعدادات وقوائم NLP
 * - castAgent/types.ts: تعريفات TypeScript
 * - castAgent/parser.ts: دوال تحليل النص و NLP
 * - castAgent/analyzer.ts: دوال تحليل الشخصيات والعواطف
 * - castAgent/scriptAnalyzer.ts: محرك التحليل المحلي الرئيسي
 * - castAgent/aiAgent.ts: تكامل Google GenAI
 * - castAgent/exporter.ts: مولدات تنسيقات التصدير
 */

// إعادة تصدير كل شيء من هيكل الوحدة الجديد
export * from './castAgent/index';
