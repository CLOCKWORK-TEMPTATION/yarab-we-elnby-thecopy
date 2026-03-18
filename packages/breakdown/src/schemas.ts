/**
 * @fileoverview مخططات التحقق من البيانات باستخدام Zod
 * 
 * هذا الملف يحتوي على جميع مخططات التحقق (Validation Schemas) المستخدمة
 * في وحدة تفريغ السيناريو. الهدف من هذه المخططات هو ضمان صحة البيانات
 * الواردة من واجهات API والمدخلات المستخدم قبل معالجتها.
 * 
 * السبب: نحتاج للتحقق من صحة البيانات لمنع الأخطاء غير المتوقعة
 * وضمان تجربة مستخدم سلسة حتى في حالة وجود بيانات غير صالحة.
 */

import { z } from 'zod';

// ============================================
// مخططات أعضاء فريق التمثيل
// ============================================

/**
 * مخطط عضو فريق التمثيل الأساسي
 * يستخدم للتحقق من بيانات الشخصيات المستخرجة من المشاهد
 */
export const CastMemberSchema = z.object({
  name: z.string().min(1, 'اسم الشخصية مطلوب'),
  role: z.string().default('Bit Part'),
  age: z.string().default('Unknown'),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Unknown']).default('Unknown'),
  description: z.string().default(''),
  motivation: z.string().default('')
});

/**
 * مخطط عضو فريق التمثيل الموسع
 * يحتوي على معلومات إضافية للتحليل المتقدم
 */
export const ExtendedCastMemberSchema = CastMemberSchema.extend({
  id: z.string().optional(),
  nameArabic: z.string().optional(),
  roleCategory: z.enum(['Lead', 'Supporting', 'Bit Part', 'Silent', 'Group', 'Mystery']).default('Bit Part'),
  ageRange: z.string().default('Unknown'),
  visualDescription: z.string().default(''),
  personalityTraits: z.array(z.string()).optional(),
  relationships: z.array(z.object({
    character: z.string(),
    type: z.string()
  })).optional(),
  scenePresence: z.object({
    sceneNumbers: z.array(z.number()),
    dialogueLines: z.number(),
    silentAppearances: z.number()
  }).optional()
});

// ============================================
// مخططات تحليل المشهد
// ============================================

/**
 * مخطط تفريغ المشهد
 * يحتوي على جميع العناصر المستخرجة من المشهد
 */
export const SceneBreakdownSchema = z.object({
  cast: z.array(CastMemberSchema).default([]),
  costumes: z.array(z.string()).default([]),
  makeup: z.array(z.string()).default([]),
  graphics: z.array(z.string()).default([]),
  vehicles: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  extras: z.array(z.string()).default([]),
  props: z.array(z.string()).default([]),
  stunts: z.array(z.string()).default([]),
  animals: z.array(z.string()).default([]),
  spfx: z.array(z.string()).default([]),
  vfx: z.array(z.string()).default([])
});

/**
 * مخطط المشهد الكامل
 * يمثل مشهداً واحداً مع جميع تحليلاته
 */
export const SceneSchema = z.object({
  id: z.number(),
  header: z.string().min(1, 'عنوان المشهد مطلوب'),
  content: z.string().min(1, 'محتوى المشهد مطلوب'),
  isAnalyzed: z.boolean().default(false),
  analysis: SceneBreakdownSchema.optional(),
  scenarios: z.any().optional(),
  versions: z.array(z.object({
    id: z.string(),
    timestamp: z.number(),
    label: z.string(),
    analysis: SceneBreakdownSchema.optional(),
    scenarios: z.any().optional()
  })).optional()
});

// ============================================
// مخططات السيناريوهات الاستراتيجية
// ============================================

/**
 * مخطط مقاييس التأثير
 * يقيس تأثير كل سيناريو على مختلف جوانب الإنتاج
 */
export const ImpactMetricsSchema = z.object({
  budget: z.number().min(0).max(100),
  schedule: z.number().min(0).max(100),
  risk: z.number().min(0).max(100),
  creative: z.number().min(0).max(100)
});

/**
 * مخطط خيار السيناريو
 * يمثل سيناريو إنتاج واحد مع جميع تفاصيله
 */
export const ScenarioOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  metrics: ImpactMetricsSchema,
  agentInsights: z.object({
    logistics: z.string(),
    budget: z.string(),
    schedule: z.string(),
    creative: z.string(),
    risk: z.string()
  }),
  recommended: z.boolean().default(false)
});

/**
 * مخطط تحليل السيناريوهات
 * يحتوي على جميع السيناريوهات المقترحة للمشهد
 */
export const ScenarioAnalysisSchema = z.object({
  scenarios: z.array(ScenarioOptionSchema)
});

// ============================================
// مخططات استجابات API
// ============================================

/**
 * مخطط استجابة تقسيم السيناريو
 * يتحقق من صحة البيانات المرتجعة من خدمة التقسيم
 */
export const ScriptSegmentResponseSchema = z.object({
  scenes: z.array(z.object({
    header: z.string(),
    content: z.string()
  }))
});

/**
 * مخطط تقرير التحليل
 * يستخدم في صفحة عرض التقرير النهائي
 */
export const AnalysisReportSchema = z.object({
  executiveSummary: z.string().default(''),
  strengthsAnalysis: z.array(z.string()).default([]),
  weaknessesIdentified: z.array(z.string()).default([]),
  opportunitiesForImprovement: z.array(z.string()).default([]),
  threatsToCohesion: z.array(z.string()).default([]),
  overallAssessment: z.object({
    narrativeQualityScore: z.number().default(0),
    structuralIntegrityScore: z.number().default(0),
    characterDevelopmentScore: z.number().default(0),
    conflictEffectivenessScore: z.number().default(0),
    overallScore: z.number().default(0),
    rating: z.string().default('غير متاح')
  }),
  detailedFindings: z.record(z.unknown()).default({})
});

// ============================================
// أنواع TypeScript المشتقة من المخططات
// ============================================

export type CastMemberInput = z.input<typeof CastMemberSchema>;
export type CastMemberOutput = z.output<typeof CastMemberSchema>;

export type ExtendedCastMemberInput = z.input<typeof ExtendedCastMemberSchema>;
export type ExtendedCastMemberOutput = z.output<typeof ExtendedCastMemberSchema>;

export type SceneBreakdownInput = z.input<typeof SceneBreakdownSchema>;
export type SceneBreakdownOutput = z.output<typeof SceneBreakdownSchema>;

export type SceneInput = z.input<typeof SceneSchema>;
export type SceneOutput = z.output<typeof SceneSchema>;

export type ScenarioAnalysisInput = z.input<typeof ScenarioAnalysisSchema>;
export type ScenarioAnalysisOutput = z.output<typeof ScenarioAnalysisSchema>;

export type AnalysisReportInput = z.input<typeof AnalysisReportSchema>;
export type AnalysisReportOutput = z.output<typeof AnalysisReportSchema>;

// ============================================
// دوال التحقق المساعدة
// ============================================

/**
 * يتحقق من صحة بيانات المشهد ويعيد النتيجة الآمنة
 * 
 * السبب: نستخدم safeParse لتجنب إلقاء الأخطاء ومعالجتها بشكل graceful
 */
export function validateScene(data: unknown): { success: true; data: SceneOutput } | { success: false; error: string } {
  const result = SceneSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(', ') 
  };
}

/**
 * يتحقق من صحة بيانات تفريغ المشهد
 */
export function validateSceneBreakdown(data: unknown): { success: true; data: SceneBreakdownOutput } | { success: false; error: string } {
  const result = SceneBreakdownSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(', ') 
  };
}

/**
 * يتحقق من صحة استجابة تقسيم السيناريو
 */
export function validateScriptSegmentResponse(data: unknown): { success: true; data: z.output<typeof ScriptSegmentResponseSchema> } | { success: false; error: string } {
  const result = ScriptSegmentResponseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(', ') 
  };
}

/**
 * يتحقق من صحة تقرير التحليل
 */
export function validateAnalysisReport(data: unknown): { success: true; data: AnalysisReportOutput } | { success: false; error: string } {
  const result = AnalysisReportSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(', ') 
  };
}
