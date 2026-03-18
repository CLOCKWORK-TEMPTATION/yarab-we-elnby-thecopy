/**
 * @module AnalysisService
 * @description خدمة تحليل السيناريو الأساسية
 * 
 * توفر هذه الخدمة التحليلات الأساسية للوحة تحكم نقيد (Naqid MVP)
 * من خلال تجميع مقاييس بنية السيناريو وتنسيق الرؤى النوعية
 * المدعومة بالذكاء الاصطناعي مثل الملخصات والعناوين الجذابة
 */

import type { Script, Character, Scene } from '../types/types';

/**
 * @interface CharacterDialogueStat
 * @description إحصائيات حوار شخصية واحدة
 */
export interface CharacterDialogueStat {
  /** اسم الشخصية */
  name: string;
  /** عدد سطور الحوار */
  dialogueLines: number;
}

/**
 * @interface AnalysisResult
 * @description نتيجة تحليل السيناريو الكاملة
 */
export interface AnalysisResult {
  /** إجمالي عدد المشاهد */
  totalScenes: number;
  /** إحصائيات حوار الشخصيات مرتبة تنازلياً */
  characterDialogueCounts: CharacterDialogueStat[];
  /** نسبة الحوار إلى الأفعال */
  dialogueToActionRatio: number;
  /** ملخص السيناريو (فقرة واحدة) */
  synopsis: string;
  /** العنوان الجذاب */
  logline: string;
}

/**
 * @interface AIWritingAssistantLike
 * @description واجهة مساعد الكتابة بالذكاء الاصطناعي
 * تُستخدم للحقن التبعي (Dependency Injection) لتسهيل الاختبار
 */
export interface AIWritingAssistantLike {
  /** توليد نص بناءً على موجه وسياق */
  generateText: (
    prompt: string,
    context: string,
    options?: Record<string, unknown>
  ) => Promise<{ text?: string }>;
}

/**
 * رسائل الخطأ الافتراضية باللغة العربية
 */
const ERROR_MESSAGES = {
  noContext: 'لم يتم توفير نص كافٍ لتحليل الذكاء الاصطناعي.',
  generationFailed: 'تعذر توليد الاستجابة بواسطة الذكاء الاصطناعي.',
  unexpectedError: 'حدث خطأ أثناء توليد الاستجابة من الذكاء الاصطناعي.',
} as const;

/**
 * @class AnalysisService
 * @description خدمة تحليل السيناريو
 * 
 * توفر هذه الخدمة التحليلات الأساسية للوحة تحكم نقيد من خلال:
 * - حساب المقاييس الكمية (عدد المشاهد، نسبة الحوار/الأفعال)
 * - إحصائيات الشخصيات وتوزيع الحوار
 * - توليد الملخصات والعناوين باستخدام AI
 * 
 * @example
 * ```typescript
 * const service = new AnalysisService(aiAssistant);
 * const result = await service.analyze(script);
 * ```
 */
export default class AnalysisService {
  private readonly aiAssistant: AIWritingAssistantLike;

  /**
   * إنشاء مثيل جديد من خدمة التحليل
   * @param aiAssistant - مساعد الكتابة بالذكاء الاصطناعي
   */
  constructor(aiAssistant: AIWritingAssistantLike) {
    this.aiAssistant = aiAssistant;
  }

  /**
   * تحليل السيناريو وحساب المقاييس الأساسية
   * 
   * يقوم هذا الأسلوب بـ:
   * 1. حساب إجمالي المشاهد
   * 2. تجميع إحصائيات حوار الشخصيات
   * 3. حساب نسبة الحوار إلى الأفعال
   * 4. توليد الملخص والعنوان الجذاب (بالتوازي)
   *
   * @param script - بيانات السيناريو المهيكلة
   * @param rawTextOverride - نص خام بديل لاستخدامه في سياق AI (اختياري)
   * @returns نتيجة التحليل الكاملة
   */
  async analyze(script: Script, rawTextOverride?: string): Promise<AnalysisResult> {
    // حساب المقاييس الكمية
    const totalScenes = script.scenes.length;
    
    // تجميع إحصائيات الحوار للشخصيات وترتيبها تنازلياً
    const characterDialogueCounts = Object.values(script.characters)
      .map<CharacterDialogueStat>((character: Character) => ({
        name: character.name,
        dialogueLines: character.dialogueCount,
      }))
      .sort((a, b) => b.dialogueLines - a.dialogueLines);

    // حساب نسبة الحوار إلى الأفعال
    const totalDialogueLines = script.dialogueLines.length;
    const totalActionLines = script.scenes.reduce(
      (sum: number, scene: Scene) => sum + scene.actionLines.length,
      0
    );
    const dialogueToActionRatio = totalActionLines === 0
      ? totalDialogueLines
      : totalDialogueLines / totalActionLines;

    // تحديد مصدر النص للتحليل
    const narrativeSource = (rawTextOverride ?? script.rawText ?? '').trim();

    // توليد الملخص والعنوان بالتوازي لتحسين الأداء
    const [synopsis, logline] = await Promise.all([
      this.generateAiInsight(
        'استنادًا إلى هذا السيناريو، قم بتوليد ملخص من فقرة واحدة (Synopsis).',
        narrativeSource
      ),
      this.generateAiInsight(
        'استنادًا إلى هذا السيناريو، اقترح عنوانًا جذابًا (Logline).',
        narrativeSource
      ),
    ]);

    return {
      totalScenes,
      characterDialogueCounts,
      dialogueToActionRatio,
      synopsis,
      logline,
    };
  }

  /**
   * توليد رؤية/نص باستخدام الذكاء الاصطناعي
   * 
   * @param prompt - الموجه/السؤال المراد طرحه
   * @param context - السياق النصي للتحليل
   * @returns النص المُولد أو رسالة خطأ مناسبة
   */
  private async generateAiInsight(prompt: string, context: string): Promise<string> {
    if (!context) {
      return ERROR_MESSAGES.noContext;
    }

    try {
      const response = await this.aiAssistant.generateText(prompt, context, { mode: 'analysis' });
      return response.text ?? ERROR_MESSAGES.generationFailed;
    } catch {
      return ERROR_MESSAGES.unexpectedError;
    }
  }
}
