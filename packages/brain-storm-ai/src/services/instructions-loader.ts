/**
 * @module instructions-loader
 * @description خدمة تحميل تعليمات الوكلاء بشكل ديناميكي
 * 
 * توفر هذه الخدمة:
 * - تحميل تعليمات الوكلاء من ملفات التكوين
 * - تخزين مؤقت (Caching) للتعليمات المحملة
 * - تحليل تعليمات JSON المضمنة في النصوص
 * - تعليمات احتياطية عند فشل التحميل
 */

import { INSTRUCTIONS_MAP } from '../agents/instructions';

/**
 * @interface InstructionExample
 * @description مثال على استخدام التعليمات
 */
interface InstructionExample {
  /** المدخل النموذجي */
  input: string;
  /** المخرج المتوقع */
  output: string;
}

/**
 * @interface ParsedJsonData
 * @description البيانات المستخرجة من JSON المضمن
 */
interface ParsedJsonData {
  /** قائمة التعليمات */
  instructions?: string[];
  /** تنسيق المخرجات */
  outputFormat?: Record<string, string>;
  /** أمثلة الاستخدام */
  examples?: InstructionExample[];
  /** حقول إضافية */
  [key: string]: string[] | Record<string, string> | InstructionExample[] | undefined;
}

/**
 * @interface InstructionSet
 * @description مجموعة تعليمات وكيل كاملة
 */
interface InstructionSet {
  /** موجه النظام الأساسي */
  systemPrompt: string;
  /** قائمة التعليمات التفصيلية */
  instructions: string[];
  /** تنسيق المخرجات المتوقع */
  outputFormat?: Record<string, string>;
  /** أمثلة على المدخلات والمخرجات */
  examples?: InstructionExample[];
  /** حقول إضافية من JSON */
  [key: string]: string | string[] | Record<string, string> | InstructionExample[] | undefined;
}

/**
 * @class InstructionsLoader
 * @description محمّل تعليمات الوكلاء مع دعم التخزين المؤقت
 * 
 * يوفر هذا الفصل (Class):
 * - تحميل وتحليل تعليمات الوكلاء
 * - تخزين مؤقت للأداء الأمثل
 * - تعليمات احتياطية عند الفشل
 * 
 * @example
 * ```typescript
 * const loader = new InstructionsLoader();
 * const instructions = await loader.loadInstructions('analysis');
 * ```
 */
class InstructionsLoader {
  /** التخزين المؤقت للتعليمات المحملة */
  private cache = new Map<string, InstructionSet>();

  /**
   * تحميل تعليمات وكيل محدد
   * 
   * يتحقق أولاً من التخزين المؤقت، وإلا يقوم بتحميل وتحليل التعليمات
   * 
   * @param agentId - معرف الوكيل
   * @returns مجموعة التعليمات الكاملة
   */
  async loadInstructions(agentId: string): Promise<InstructionSet> {
    // التحقق من التخزين المؤقت أولاً
    const cached = this.cache.get(agentId);
    if (cached) {
      return cached;
    }

    try {
      const rawInstructions = INSTRUCTIONS_MAP[agentId];
      
      if (!rawInstructions) {
        return this.getFallbackInstructions(agentId);
      }

      const instructions = this.parseInstructions(rawInstructions, agentId);
      this.cache.set(agentId, instructions);
      return instructions;
    } catch {
      return this.getFallbackInstructions(agentId);
    }
  }

  /**
   * تحليل نص التعليمات الخام وتحويله لمجموعة تعليمات
   * 
   * يستخرج كتل JSON المضمنة ويدمجها مع النص السياقي
   * 
   * @param raw - النص الخام للتعليمات
   * @param agentId - معرف الوكيل (للرسائل الافتراضية)
   * @returns مجموعة التعليمات المحللة
   */
  private parseInstructions(raw: string, agentId: string): InstructionSet {
    try {
      // استخراج كتلة JSON المضمنة
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      let parsedJson: ParsedJsonData = {};
      
      if (jsonMatch?.[1]) {
        try {
          parsedJson = JSON.parse(jsonMatch[1]) as ParsedJsonData;
        } catch {
          // تجاهل أخطاء تحليل JSON واستخدام القيم الافتراضية
        }
      }

      // استخراج النص قبل JSON كسياق لموجه النظام
      const textContext = raw.split(/```json/)[0].trim();

      return {
        systemPrompt: textContext || `أنت وكيل ذكي متخصص في ${agentId}`,
        instructions: parsedJson.instructions ?? [textContext],
        outputFormat: parsedJson.outputFormat ?? {},
        examples: parsedJson.examples ?? [],
        ...parsedJson
      };
    } catch {
      return this.getFallbackInstructions(agentId);
    }
  }

  /**
   * الحصول على تعليمات احتياطية عند فشل التحميل
   * 
   * @param agentId - معرف الوكيل
   * @returns تعليمات افتراضية عامة
   */
  private getFallbackInstructions(agentId: string): InstructionSet {
    return {
      systemPrompt: `أنت وكيل ذكي متخصص في ${agentId}. قم بتحليل المحتوى المقدم وقدم رؤى مفيدة.`,
      instructions: [
        'حلل المحتوى المقدم بعناية',
        'قدم رؤى مفيدة وقابلة للتطبيق',
        'حافظ على الجودة والدقة في التحليل'
      ],
      outputFormat: {
        analysis: 'التحليل الأساسي',
        recommendations: 'التوصيات'
      }
    };
  }

  /**
   * تحميل مسبق لتعليمات عدة وكلاء
   * يُستخدم لتحسين الأداء عن طريق ملء التخزين المؤقت مسبقاً
   * 
   * @param agentIds - قائمة معرفات الوكلاء
   */
  async preloadInstructions(agentIds: string[]): Promise<void> {
    await Promise.all(agentIds.map(id => this.loadInstructions(id)));
  }

  /**
   * مسح التخزين المؤقت
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * الحصول على حالة التخزين المؤقت
   * @returns قائمة معرفات الوكلاء المخزنة مؤقتاً
   */
  getCacheStatus(): { cached: string[] } {
    return {
      cached: Array.from(this.cache.keys())
    };
  }
}

/** المثيل الوحيد (Singleton) لمحمّل التعليمات */
export const instructionsLoader = new InstructionsLoader();

export type { InstructionSet };
