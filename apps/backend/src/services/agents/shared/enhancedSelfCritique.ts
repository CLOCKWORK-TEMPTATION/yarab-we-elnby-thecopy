/**
 * Enhanced Self-Critique Module
 * وحدة النقد الذاتي المحسّن بمعايير متخصصة
 *
 * This module provides specialized, dimension-based critique for each agent type
 * معايير نقد متخصصة لكل نوع وكيل
 */

import {
  CritiqueConfiguration,
  CritiqueRequest,
  EnhancedCritiqueResult,
  DimensionScore,
  CritiqueContext,
  getCritiqueConfiguration
} from "./critiqueConfigurations";
import type { CritiqueDimension } from "./critiqueTypes";
import { geminiService } from "@/services/gemini.service";
import { logger } from "@/utils/logger";

export class EnhancedSelfCritiqueModule {
  /**
   * تطبيق النقد الذاتي المحسّن
   */
  async applyEnhancedCritique(
    request: CritiqueRequest
  ): Promise<EnhancedCritiqueResult> {
    const {
      output: originalOutput,
      task,
      context,
      customConfig
    } = request;

    // الحصول على تكوين النقد
    let config: CritiqueConfiguration;
    if (customConfig && customConfig.agentType && customConfig.dimensions && customConfig.thresholds) {
      config = customConfig as CritiqueConfiguration;
    } else {
      const retrievedConfig = getCritiqueConfiguration(context.taskType);
      if (!retrievedConfig) {
        throw new Error(`No critique configuration found for ${context.taskType}`);
      }
      config = retrievedConfig;
    }

    logger.info(
      `[Enhanced Critique] Starting critique for ${config.agentName}`,
      {
        dimensions: config.dimensions?.length || 0,
        maxIterations: config.maxIterations || 3
      }
    );

    // التقييم الأولي لكل بُعد
    const dimensionScores = await this.evaluateAllDimensions(
      originalOutput,
      task,
      context,
      config
    );

    // حساب النتيجة الإجمالية
    const overallScore = this.calculateOverallScore(
      dimensionScores,
      config.dimensions || []
    );

    // تحديد المستوى الإجمالي
    const overallLevel = this.determineLevel(overallScore, config.thresholds || {
      excellent: 0.85,
      good: 0.7,
      satisfactory: 0.55,
      needsImprovement: 0.4
    });

    // توليد الملاحظات
    const critiqueNotes = await this.generateCritiqueNotes(
      dimensionScores,
      overallScore,
      config
    );

    // فحص ما إذا كان يحتاج تحسين
    const needsImprovement = overallScore < config.thresholds.good;

    let refinedOutput = originalOutput;
    let improved = false;
    let iterations = 0;

    if (needsImprovement && config.enableAutoCorrection) {
      // تنفيذ دورات التحسين
      const improvementResult = await this.performImprovementCycles(
        originalOutput,
        task,
        context,
        dimensionScores,
        critiqueNotes,
        config
      );

      refinedOutput = improvementResult.refinedOutput;
      improved = improvementResult.improved;
      iterations = improvementResult.iterations;

      // إعادة التقييم بعد التحسين
      if (improved) {
        const newScores = await this.evaluateAllDimensions(
          refinedOutput,
          task,
          context,
          config
        );
        dimensionScores.splice(0, dimensionScores.length, ...newScores);
      }
    }

    // حساب درجة التحسين
    const improvementScore = improved
      ? await this.calculateImprovementScore(originalOutput, refinedOutput)
      : 0;

    // توليد خطة التحسين
    const improvementPlan = await this.generateImprovementPlan(
      dimensionScores,
      config
    );

    logger.info(
      `[Enhanced Critique] Complete for ${config.agentName}`,
      {
        overallScore,
        overallLevel,
        improved,
        iterations
      }
    );

    return {
      originalOutput,
      refinedOutput,
      improved,
      iterations,
      dimensionScores,
      overallScore,
      overallLevel,
      improvementScore,
      critiqueNotes,
      improvementPlan
    };
  }

  /**
   * تقييم جميع الأبعاد
   */
  private async evaluateAllDimensions(
    output: string,
    task: string,
    context: CritiqueContext,
    config: CritiqueConfiguration
  ): Promise<DimensionScore[]> {
    const scores: DimensionScore[] = [];

    for (const dimension of config.dimensions) {
      logger.debug(
        `[Enhanced Critique] Evaluating dimension: ${dimension.name}`
      );

      const score = await this.evaluateDimension(
        output,
        task,
        context,
        dimension
      );

      scores.push(score);
    }

    return scores;
  }

  /**
   * تقييم بُعد واحد
   */
  private async evaluateDimension(
    output: string,
    task: string,
    context: CritiqueContext,
    dimension: CritiqueDimension
  ): Promise<DimensionScore> {
    const prompt = this.buildDimensionEvaluationPrompt(
      output,
      task,
      context,
      dimension
    );

    try {
      const response = await geminiService.generateContent(prompt, {
        temperature: 0.2,
        maxTokens: 2048
      });

      // تحليل الاستجابة
      return this.parseDimensionResponse(response, dimension);
    } catch (error) {
      logger.error(`[Enhanced Critique] Error evaluating ${dimension.name}:`, error);

      // إرجاع نتيجة افتراضية
      return {
        dimension: dimension.name,
        score: 0.5,
        level: "satisfactory",
        strengths: [],
        weaknesses: [],
        suggestions: []
      };
    }
  }

  /**
   * بناء prompt تقييم البُعد
   */
  private buildDimensionEvaluationPrompt(
    output: string,
    task: string,
    context: CritiqueContext,
    dimension: CritiqueDimension
  ): string {
    const rubricText = dimension.rubric
      .map(
        (level) => `
**${level.level}** (${level.score}): ${level.description}
المؤشرات: ${level.indicators.join("، ")}`
      )
      .join("\n");

    return `أنت ناقد متخصص في تحليل المحتوى الدرامي.

**المهمة:**
${task}

**النص الأصلي:**
${context.originalText.substring(0, 2000)}

**التحليل المطلوب نقدُه:**
${output}

**البعد المطلوب تقييمه:** ${dimension.name}
${dimension.description}

**معايير التقييم:**
${rubricText}

**مطلوب منك:**
1. حدد المستوى الأنسب للتحليل في هذا البُعد
2. أعطِ نتيجة رقمية بين 0 و 1
3. سرد 2-3 نقاط قوة (إن وجدت)
4. سرد 2-3 نقاط ضعف (إن وجدت)
5. اقترح 2-3 تحسينات محددة

قدم التقييم بصيغة JSON:
\`\`\`json
{
  "level": "excellent|good|satisfactory|needs_improvement|poor",
  "score": 0.85,
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "suggestions": ["تحسين 1", "تحسين 2"]
}
\`\`\``;
  }

  /**
   * تحليل استجابة تقييم البُعد
   */
  private parseDimensionResponse(
    response: string,
    dimension: CritiqueDimension
  ): DimensionScore {
    try {
      // محاولة استخراج JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          dimension: dimension.name,
          score: Math.max(0, Math.min(1, parsed.score || 0.5)),
          level: parsed.level || "satisfactory",
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          suggestions: parsed.suggestions || []
        };
      }
    } catch (error) {
      logger.warn("[Enhanced Critique] Failed to parse JSON response, using fallback");
    }

    // Fallback: تحليل نصي بسيط
    return this.fallbackDimensionParse(response, dimension);
  }

  /**
   * تحليل احتياطي للبُعد
   */
  private fallbackDimensionParse(
    response: string,
    dimension: CritiqueDimension
  ): DimensionScore {
    // تحليل بسيط لاستخراج المعلومات
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // استخراج الكلمات المفتاحية
    if (response.includes("قوة") || response.includes("ممتاز")) {
      strengths.push("تحليل جيد في هذا البُعد");
    }
    if (response.includes("ضعف") || response.includes("يحتاج")) {
      weaknesses.push("هناك مجال للتحسين");
      suggestions.push("يمكن تعميق التحليل");
    }

    return {
      dimension: dimension.name,
      score: 0.6,
      level: "satisfactory",
      strengths,
      weaknesses,
      suggestions
    };
  }

  /**
   * حساب النتيجة الإجمالية
   */
  private calculateOverallScore(
    dimensionScores: DimensionScore[],
    dimensions: CritiqueDimension[]
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    dimensionScores.forEach((score, index) => {
      const weight = dimensions[index]?.weight || 1;
      totalScore += score.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * تحديد المستوى
   */
  private determineLevel(
    score: number,
    thresholds: CritiqueConfiguration["thresholds"]
  ): EnhancedCritiqueResult["overallLevel"] {
    if (score >= thresholds.excellent) return "excellent";
    if (score >= thresholds.good) return "good";
    if (score >= thresholds.satisfactory) return "satisfactory";
    if (score >= thresholds.needsImprovement) return "needs_improvement";
    return "poor";
  }

  /**
   * توليد ملاحظات النقد
   */
  private async generateCritiqueNotes(
    dimensionScores: DimensionScore[],
    overallScore: number,
    config: CritiqueConfiguration
  ): Promise<string[]> {
    const notes: string[] = [];

    // ملاحظات الأبعاد الضعيفة
    const weakDimensions = dimensionScores.filter(
      (d) => d.score < config.thresholds.good
    );

    if (weakDimensions.length > 0) {
      notes.push(
        `الأبعاد التي تحتاج تحسين: ${weakDimensions.map((d) => d.dimension).join("، ")}`
      );
    }

    // ملاحظات الأبعاد القوية
    const strongDimensions = dimensionScores.filter(
      (d) => d.score >= config.thresholds.good
    );

    if (strongDimensions.length > 0) {
      notes.push(
        `الأبعاد القوية: ${strongDimensions.map((d) => d.dimension).join("، ")}`
      );
    }

    // ملاحظة عامة
    if (overallScore >= config.thresholds.excellent) {
      notes.push("تحليل ممتاز يجمع بين الدقة والعمق");
    } else if (overallScore >= config.thresholds.good) {
      notes.push("تحليل جيد مع مجالات محدودة للتحسين");
    } else if (overallScore >= config.thresholds.satisfactory) {
      notes.push("تحليل مقبول يحتاج لتعميق في بعض الجوانب");
    } else {
      notes.push("التحليل يحتاج لمراجعة وتحسين شامل");
    }

    return notes;
  }

  /**
   * تنفيذ دورات التحسين
   */
  private async performImprovementCycles(
    originalOutput: string,
    task: string,
    context: CritiqueContext,
    dimensionScores: DimensionScore[],
    critiqueNotes: string[],
    config: CritiqueConfiguration
  ): Promise<{
    refinedOutput: string;
    improved: boolean;
    iterations: number;
  }> {
    let currentOutput = originalOutput;
    let improved = false;
    const maxIterations = config.maxIterations;

    for (let i = 0; i < maxIterations; i++) {
      const iteration = i + 1;
      logger.debug(
        `[Enhanced Critique] Improvement cycle ${iteration}/${maxIterations}`
      );

      // بناء prompt التحسين
      const improvementPrompt = this.buildImprovementPrompt(
        currentOutput,
        task,
        context,
        dimensionScores,
        critiqueNotes,
        config
      );

      try {
        const improvedOutput = await geminiService.generateContent(
          improvementPrompt,
          {
            temperature: 0.7,
            maxTokens: 4096
          }
        );

        // فحص ما إذا كان هناك تحسين حقيقي
        const hasImproved = await this.verifyImprovement(
          currentOutput,
          improvedOutput
        );

        if (hasImproved) {
          currentOutput = improvedOutput;
          improved = true;
          logger.debug(
            `[Enhanced Critique] Improvement cycle ${iteration} successful`
          );
        } else {
          logger.debug(
            `[Enhanced Critique] No further improvement detected after cycle ${iteration}`
          );
          break;
        }
      } catch (error) {
        logger.error(
          `[Enhanced Critique] Error in improvement cycle ${iteration}:`,
          error
        );
        break;
      }
    }

    return {
      refinedOutput: currentOutput,
      improved,
      iterations: improved ? maxIterations : 0
    };
  }

  /**
   * بناء prompt التحسين
   */
  private buildImprovementPrompt(
    currentOutput: string,
    task: string,
    context: CritiqueContext,
    dimensionScores: DimensionScore[],
    critiqueNotes: string[],
    config: CritiqueConfiguration
  ): string {
    // جمع نقاط الضعف والاقتراحات
    const allWeaknesses = dimensionScores.flatMap((d) => d.weaknesses);
    const allSuggestions = dimensionScores.flatMap((d) => d.suggestions);

    return `أنت محرر ومحسن محتوى محترف متخصص في المحتوى الدرامي.

**المهمة الأصلية:**
${task}

**النص الأصلي:**
${context.originalText.substring(0, 2000)}

**التحليل الحالي:**
${currentOutput}

**ملاحظات النقد:**
${critiqueNotes.join("\n")}

**نقاط الضعف المحددة:**
${allWeaknesses.map((w) => `• ${w}`).join("\n")}

**التحسينات المقترحة:**
${allSuggestions.map((s) => `• ${s}`).join("\n")}

**مطلوب منك:**
1. احتفظ بكل النقاط القوية في التحليل
2. عالج نقاط الضعف المحددة
3. طبق التحسينات المقترحة
4. احافظ على نفس الأسلوب والطول التقريبي

قدم التحليل المحسّن فقط بدون شروحات إضافية:`;
  }

  /**
   * التحقق من وجود تحسين
   */
  private async verifyImprovement(
    original: string,
    improved: string
  ): Promise<boolean> {
    // فحص بسيط: هل النصان مختلفان بشكل كبير؟
    if (original === improved) return false;

    // حساب نسبة التغيير
    const originalWords = original.split(/\s+/).length;
    const improvedWords = improved.split(/\s+/).length;
    const wordDiff = Math.abs(originalWords - improvedWords) / originalWords;

    // إذا كان التغيير أقل من 10%، نعتبره غير مهم
    if (wordDiff < 0.1) {
      // فحص تغيير المحتوى
      const similarity = await this.calculateSimilarity(original, improved);
      return similarity < 0.9;
    }

    return true;
  }

  /**
   * حساب التشابه بين نصين
   */
  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const prompt = `قيّم التشابه بين النصين التاليين على مقياس من 0 إلى 1:

**النص الأول:**
${text1.substring(0, 1000)}

**النص الثاني:**
${text2.substring(0, 1000)}

أعطِ رقماً فقط (مثال: 0.85):`;

    try {
      const response = await geminiService.generateContent(prompt, {
        temperature: 0.1,
        maxTokens: 50
      });

      const score = parseFloat(response.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch {
      return 0.5;
    }
  }

  /**
   * حساب درجة التحسين
   */
  private async calculateImprovementScore(
    original: string,
    refined: string
  ): Promise<number> {
    if (original === refined) return 0;

    const prompt = `قيّم مستوى التحسين من النص الأول إلى النص الثاني على مقياس من 0 إلى 1:
- 0 = لا يوجد تحسين أو أسوأ
- 0.5 = تحسين متوسط
- 1 = تحسين ممتاز

**النص الأصلي:**
${original.substring(0, 1500)}

**النص المحسّن:**
${refined.substring(0, 1500)}

أعطِ رقماً فقط (مثال: 0.75):`;

    try {
      const response = await geminiService.generateContent(prompt, {
        temperature: 0.1,
        maxTokens: 50
      });

      const score = parseFloat(response.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch {
      return 0.5;
    }
  }

  /**
   * توليد خطة التحسين
   */
  private async generateImprovementPlan(
    dimensionScores: DimensionScore[],
    config: CritiqueConfiguration
  ): Promise<EnhancedCritiqueResult["improvementPlan"]> {
    const plan: EnhancedCritiqueResult["improvementPlan"] = [];

    // البحث عن الأبعاد الأضعف
    const sortedByScore = [...dimensionScores].sort((a, b) => a.score - b.score);

    for (const dimension of sortedByScore.slice(0, 3)) {
      if (dimension.score < config.thresholds.good) {
        const priority =
          dimension.score < config.thresholds.needsImprovement
            ? ("high" as const)
            : ("medium" as const);

        plan.push({
          priority,
          actions: dimension.suggestions.slice(0, 3),
          expectedImpact: `تحسين بُعد "${dimension.dimension}" سيرفع من جودة التحليل بشكل ملحوظ`
        });
      }
    }

    return plan.length > 0 ? plan : undefined;
  }
}

// Export singleton instance
export const enhancedSelfCritiqueModule = new EnhancedSelfCritiqueModule();
