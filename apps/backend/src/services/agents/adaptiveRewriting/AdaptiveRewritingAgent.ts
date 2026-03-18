import { TaskType } from "@core/types";
import { BaseAgent } from "../shared/BaseAgent";
import {
  StandardAgentInput,
  StandardAgentOutput,
} from "../shared/standardAgentPattern";
import { ADAPTIVE_REWRITING_AGENT_CONFIG } from "./agent";
// نفترض وجود هذه الأداة المساعدة أو يمكن استبدالها بـ RegExp عادي مع الحذر
import { safeCountMultipleTerms, sumCounts } from "../shared/safe-regexp";

/**
 * واجهة السياق الخاصة بإعادة الكتابة
 */
interface AdaptiveRewritingContext {
  originalText?: string;
  analysisReport?: Record<string, any>; // تحسين النوع بدلاً من any
  rewritingGoals?: string[];
  targetAudience?: string;
  targetTone?: string;
  targetLength?: "shorter" | "same" | "longer" | "double" | "half" | string;
  preserveElements?: string[];
  improvementFocus?: string[]; // e.g., ['pacing', 'dialogue', 'clarity']
  styleGuide?: string;
  constraints?: string[];
}

/**
 * Adaptive Rewriting Agent - وكيل إعادة الكتابة التكيفية
 * يقوم بإعادة صياغة النصوص بناءً على أهداف محددة، جمهور مستهدف، ونبرة معينة.
 * يعتمد على تحليل النص الأصلي وتطبيق تحسينات لغوية وهيكلية.
 */
export class AdaptiveRewritingAgent extends BaseAgent {
  constructor() {
    super(
      "RewriteMaster AI",
      TaskType.ADAPTIVE_REWRITING,
      ADAPTIVE_REWRITING_AGENT_CONFIG?.systemPrompt ||
        "أنت خبير تحرير نصوص ومطور محتوى محترف."
    );

    // رفع الحد الأدنى للثقة لضمان جودة المخرجات
    this.confidenceFloor = 0.75;
  }

  /**
   * بناء الأمر (Prompt) باستخدام هيكلية XML لضمان فهم النموذج للسياق
   */
  protected buildPrompt(input: StandardAgentInput): string {
    const { input: taskInput, context } = input;
    const ctx = context as AdaptiveRewritingContext;

    const originalText = ctx?.originalText || "";
    const rewritingGoals = ctx?.rewritingGoals || [];
    const targetAudience = ctx?.targetAudience || "جمهور عام";
    const targetTone = ctx?.targetTone || "محايدة/احترافية";
    const targetLength = ctx?.targetLength || "same";
    const preserveElements = ctx?.preserveElements || [];
    const improvementFocus = ctx?.improvementFocus || ["clarity", "flow"];
    const styleGuide = ctx?.styleGuide || "";
    const constraints = ctx?.constraints || [];

    // استخدام وسوم XML لتنظيم المدخلات للنموذج اللغوي
    let prompt = `مهمة: إعادة كتابة تكيفية وتحسين للنص.\n\n`;

    prompt += `<instructions>\n`;
    prompt += `قم بتحليل النص الأصلي وإعادة كتابته بالكامل لتحقيق الأهداف المحددة أدناه.\n`;
    prompt += `يجب أن يكون الناتج نصاً مصاغاً ببراعة وجاهزاً للنشر.\n`;
    prompt += `</instructions>\n\n`;

    if (originalText) {
      prompt += `<original_text>\n${originalText.substring(0, 4000)}\n</original_text>\n\n`;
    }

    prompt += `<parameters>\n`;
    prompt += `- الجمهور المستهدف: ${targetAudience}\n`;
    prompt += `- النبرة (Tone): ${targetTone}\n`;
    prompt += `- الطول المستهدف: ${this.translateLength(targetLength)}\n`;

    if (improvementFocus.length > 0) {
      prompt += `- مجالات التركيز للتحسين: ${improvementFocus.map((f) => this.translateFocus(f)).join("، ")}\n`;
    }
    prompt += `</parameters>\n\n`;

    if (rewritingGoals.length > 0) {
      prompt += `<goals>\n`;
      rewritingGoals.forEach(
        (goal, idx) => (prompt += `${idx + 1}. ${goal}\n`)
      );
      prompt += `</goals>\n\n`;
    }

    if (preserveElements.length > 0) {
      prompt += `<preserve>\n`;
      // عناصر يجب عدم تغييرها (مثل أسماء، تواريخ، مصطلحات محددة)
      preserveElements.forEach(
        (elem, idx) => (prompt += `${idx + 1}. ${elem}\n`)
      );
      prompt += `</preserve>\n\n`;
    }

    if (styleGuide) {
      prompt += `<style_guide>\n${styleGuide}\n</style_guide>\n\n`;
    }

    if (constraints.length > 0) {
      prompt += `<constraints>\n`;
      constraints.forEach((c, idx) => (prompt += `${idx + 1}. ${c}\n`));
      prompt += `</constraints>\n\n`;
    }

    prompt += `<user_request>\n${taskInput}\n</user_request>\n\n`;

    prompt += `
<output_format>
المطلوب منك تقديم الاستجابة بالتنسيق التالي تماماً (بدون استخدام كتل JSON):

1. **التحليل الاستراتيجي**:
   - نقاط القوة في الأصل.
   - نقاط الضعف التي سيتم معالجتها.
   - الخطة المتبعة.

2. **النص المعاد كتابته**:
   [اكتب النص الكامل هنا بدقة عالية]

3. **تقرير التحسينات**:
   - شرح التغييرات الجوهرية ولماذا تخدم الهدف.
   - مقارنة سريعة (قبل/بعد) لجملة محورية.
</output_format>
`;

    return prompt;
  }

  /**
   * معالجة المخرجات وتقييم الجودة (Self-Critique)
   */
  protected override async postProcess(
    output: StandardAgentOutput
  ): Promise<StandardAgentOutput> {
    // تنظيف النص من أي بقايا كود أو علامات غير مرغوبة
    let processedText = this.cleanupRewrittenText(output.text);

    // حساب مقاييس الجودة المتعددة
    const goalAchievement = await this.assessGoalAchievement(processedText);
    const qualityImprovement =
      await this.assessQualityImprovement(processedText);
    const coherence = await this.assessCoherence(processedText);
    const creativity = await this.assessCreativity(processedText);

    // حساب درجة الجودة الكلية (Weighted Score)
    const qualityScore =
      goalAchievement * 0.35 +
      qualityImprovement * 0.3 +
      coherence * 0.2 +
      creativity * 0.15;

    // تعديل الثقة بناءً على تقييم المحتوى الفعلي
    // نأخذ متوسط ثقة النموذج الخام مع جودة المحتوى المحسوبة
    const adjustedConfidence = output.confidence * 0.4 + qualityScore * 0.6;

    return {
      ...output,
      text: processedText,
      confidence: Number(adjustedConfidence.toFixed(2)), // تقريب لرقمين عشريين
      notes: this.generateRewritingNotes(
        output,
        goalAchievement,
        qualityImprovement,
        coherence,
        creativity
      ),
      metadata: {
        ...output.metadata,
        rewritingMetrics: {
          overallQuality: Number(qualityScore.toFixed(2)),
          goalAchievement,
          qualityImprovement,
          coherence,
          creativity,
        },
        stats: {
          charCount: processedText.length,
          improvementCount: this.countImprovements(processedText),
        },
      } as any,
    };
  }

  private cleanupRewrittenText(text: string): string {
    // إزالة كتل الكود (Markdown) إذا ظهرت عن طريق الخطأ
    text = text.replace(/```[a-z]*\n[\s\S]*?\n```/gi, (match) => {
      // إذا كان الكود بداخل النص هو النص المعاد كتابته، نحاول استخراجه
      // ولكن هنا نفترض أننا نريد إزالة التنسيق البرمجي فقط
      return match.replace(/```[a-z]*/gi, "").trim();
    });

    // إزالة JSON blocks
    text = text.replace(/```json[\s\S]*?```/g, "");

    // تنظيف الأقواس الزائدة الناتجة عن هلوسة القوالب
    text = text.replace(/^\{[\s\S]*?\}$/gm, "");

    return text.replace(/\n{3,}/g, "\n\n").trim();
  }

  // --- دوال التقييم (Heuristics Evaluation) ---

  private async assessGoalAchievement(text: string): Promise<number> {
    let score = 0.5; // درجة أساسية

    const achievementTerms = [
      "تم تحسين",
      "بنجاح",
      "أفضل",
      "أكثر دقة",
      "تحقيق الهدف",
      "صياغة أقوى",
      "معالجة",
      "تم تطوير",
      "النسخة المعدلة",
    ];

    const termCount = safeCountMultipleTerms(text, achievementTerms);
    score += Math.min(0.3, sumCounts(termCount) * 0.05);

    // مكافأة للطول المناسب (افتراض أن النص القصير جداً لم يحقق الهدف)
    if (text.length > 200) score += 0.2;

    return Math.min(1, score);
  }

  private async assessQualityImprovement(text: string): Promise<number> {
    let score = 0.5;

    const qualityIndicators = [
      "دقة",
      "وضوح",
      "إيجاز",
      "سلاسة",
      "احترافية",
      "خالٍ من الأخطاء",
      "محكم",
      "بليغ",
      "منقح",
    ];

    const qualityCount = safeCountMultipleTerms(text, qualityIndicators);
    score += Math.min(0.3, sumCounts(qualityCount) * 0.04);

    // التحقق من وجود قسم "ملاحظات التحسين" أو ما يشابهه
    const hasMetaAnalysis = /ملاحظات|التحسينات|التغييرات/i.test(text);
    if (hasMetaAnalysis) score += 0.2;

    return Math.min(1, score);
  }

  private async assessCoherence(text: string): Promise<number> {
    let score = 0.6;

    // أدوات الربط العربية التي تدل على تماسك النص
    const connectiveWords = [
      "لذلك",
      "بالتالي",
      "علاوة على",
      "في حين",
      "بينما",
      "نتيجة لـ",
      "من ناحية أخرى",
      "كما أن",
      "فضلاً عن",
    ];

    const connectiveCount = safeCountMultipleTerms(text, connectiveWords);
    score += Math.min(0.25, sumCounts(connectiveCount) * 0.03);

    // التحقق من التنسيق (وجود فقرات)
    const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 30);
    if (paragraphs.length >= 2) score += 0.15;

    return Math.min(1, score);
  }

  private async assessCreativity(text: string): Promise<number> {
    let score = 0.4;

    const creativeWords = [
      "مبتكر",
      "جذاب",
      "فريد",
      "إلهام",
      "حيوي",
      "تشبيه",
      "استعارة",
      "أسلوب",
      "بصمة",
    ];

    const creativeCount = safeCountMultipleTerms(text, creativeWords);
    score += Math.min(0.4, sumCounts(creativeCount) * 0.08);

    // تنوع علامات الترقيم قد يدل على تنوع هيكلي (علامات تعجب، استفهام)
    if (text.includes("!") || text.includes("؟")) score += 0.1;

    return Math.min(1, score);
  }

  private countImprovements(text: string): number {
    const regex = /تحسين|تغيير|إضافة|حذف|تعديل|صياغة|تقوية/gi;
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private generateRewritingNotes(
    output: StandardAgentOutput,
    goalScore: number,
    qualityScore: number,
    coherenceScore: number,
    creativityScore: number
  ): string[] {
    const notesList: string[] = [];
    const avg =
      (goalScore + qualityScore + coherenceScore + creativityScore) / 4;

    // تصنيف الجودة العامة
    if (avg > 0.85) notesList.push("🟢 جودة إعادة الكتابة: ممتازة");
    else if (avg > 0.7) notesList.push("🟡 جودة إعادة الكتابة: جيدة جداً");
    else notesList.push("🟠 جودة إعادة الكتابة: مقبولة (تحتاج مراجعة)");

    // ملاحظات تفصيلية
    if (goalScore > 0.8) notesList.push("✅ تم تحقيق الأهداف المحددة بدقة.");
    if (coherenceScore > 0.8)
      notesList.push("✅ النص يتمتع بتماسك وترابط قوي.");
    if (creativityScore < 0.5)
      notesList.push("ℹ️ الأسلوب مباشر وتقليدي (يمكن زيادة الإبداع).");

    // دمج أي ملاحظات سابقة من الـ LLM نفسه
    if (output.notes && Array.isArray(output.notes)) {
      notesList.push(...output.notes);
    }

    return notesList;
  }

  // --- أدوات مساعدة للترجمة والعرض ---

  private translateLength(length: string): string {
    const mapping: Record<string, string> = {
      shorter: "مختصر (أقصر من النص الأصلي)",
      same: "نفس الطول تقريباً",
      longer: "مفصل (أطول من النص الأصلي)",
      double: "موسع جداً (ضعف الطول)",
      half: "ملخص مركز (نصف الطول)",
    };
    return mapping[length] || length;
  }

  private translateFocus(focus: string): string {
    const mapping: Record<string, string> = {
      pacing: "ضبط الإيقاع والسرعة",
      dialogue: "تحسين الحوارات",
      description: "إغناء الوصف",
      clarity: "الوضوح والمباشرة",
      impact: "قوة التأثير العاطفي/الإقناعي",
      characterization: "عمق الشخصيات",
      atmosphere: "بناء الأجواء العامة",
      structure: "الهيكلية والتنظيم",
      seo: "تحسين محركات البحث",
    };
    return mapping[focus] || focus;
  }

  protected override async getFallbackResponse(
    input: StandardAgentInput
  ): Promise<string> {
    return `عذراً، واجه الوكيل صعوبة في إتمام عملية إعادة الكتابة بشكل كامل.
    
التحليل الأولي:
النص الأصلي محفوظ، ولكن عملية التوليد توقفت.

إجراءات مقترحة:
1. حاول تقليل طول النص المدخل.
2. بسّط أهداف إعادة الكتابة.
3. تأكد من وضوح التعليمات.

يرجى المحاولة مرة أخرى مع تعديل المدخلات.`;
  }
}

// تصدير نسخة وحيدة (Singleton) للاستخدام العام
export const adaptiveRewritingAgent = new AdaptiveRewritingAgent();
