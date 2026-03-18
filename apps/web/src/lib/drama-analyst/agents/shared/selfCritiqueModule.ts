/**
 * وحدة النقد الذاتي - Self-Critique Module
 * يمكن استخدامها من أي وكيل لتحسين مخرجاته
 *
 * Based on Self-Refine and Constitutional AI research
 */

import { SelfCritiqueResult } from "../../core/types";
import { geminiService } from "../../services/geminiService";

export class SelfCritiqueModule {
  /**
   * تطبيق النقد الذاتي على مخرج
   * Apply self-critique to improve output
   */
  async applySelfCritique(
    output: string,
    task: string,
    context: any,
    maxIterations: number = 3
  ): Promise<SelfCritiqueResult> {
    console.log(
      `[Self-Critique] Starting with max ${maxIterations} iterations`
    );

    let currentOutput = output;
    const critiques: string[] = [];
    let iteration = 0;

    for (let i = 0; i < maxIterations; i++) {
      iteration = i + 1;
      console.log(`[Self-Critique] Iteration ${iteration}/${maxIterations}`);

      // Reflection phase: نقد المخرج الحالي
      const critique = await this.generateCritique(
        currentOutput,
        task,
        context
      );
      critiques.push(critique);

      // Check if improvement is needed
      const needsImprovement = await this.needsImprovement(
        currentOutput,
        critique
      );

      if (!needsImprovement) {
        console.log(
          `[Self-Critique] Output is good enough after ${iteration} iterations`
        );
        break;
      }

      // Refinement phase: تحسين المخرج
      currentOutput = await this.refineOutput(
        currentOutput,
        critique,
        task,
        context
      );
    }

    // Calculate improvement score
    const improvementScore = await this.calculateImprovement(
      output,
      currentOutput
    );

    console.log(
      `[Self-Critique] Complete. Improvement: ${(improvementScore * 100).toFixed(1)}%`
    );

    return {
      originalOutput: output,
      critiques,
      refinedOutput: currentOutput,
      improvementScore,
      iterations: iteration,
    };
  }

  /**
   * توليد نقد للمخرج
   * Generate critique for output
   */
  private async generateCritique(
    output: string,
    task: string,
    context: any
  ): Promise<string> {
    const critiquePrompt = `
أنت ناقد محترف متخصص في المحتوى الدرامي.

المهمة الأصلية:
${task}

السياق:
${JSON.stringify(context, null, 2).substring(0, 1000)}

المخرج الحالي:
"""
${output}
"""

قم بتقييم المخرج نقدياً من حيث:
1. **نقاط القوة**: ما الجيد في المخرج؟
2. **نقاط الضعف**: ما الذي يحتاج تحسين؟
3. **التحسينات المقترحة**: كيف يمكن تحسينه؟
4. **الأخطاء**: هل هناك أخطاء أو تناقضات؟

قدم تقييماً نقدياً مفصلاً:
`;

    try {
      return await geminiService.generateContent(critiquePrompt);
    } catch (error) {
      console.error("[Self-Critique] Error generating critique:", error);
      return "لا يوجد نقد متاح";
    }
  }

  /**
   * فحص إذا كان المخرج يحتاج تحسين
   * Check if output needs improvement
   */
  private async needsImprovement(
    output: string,
    critique: string
  ): Promise<boolean> {
    const checkPrompt = `
بناءً على النقد التالي:
"""
${critique}
"""

هل المخرج بحاجة لتحسين إضافي؟

أجب بـ "yes" إذا كان يحتاج تحسين، أو "no" إذا كان جيداً بما فيه الكفاية.
أجب بكلمة واحدة فقط:
`;

    try {
      const result = await geminiService.generateContent(checkPrompt);
      return result.trim().toLowerCase().includes("yes");
    } catch (error) {
      console.error("[Self-Critique] Error checking improvement need:", error);
      return false; // Default to no improvement needed on error
    }
  }

  /**
   * تحسين المخرج بناءً على النقد
   * Refine output based on critique
   */
  private async refineOutput(
    output: string,
    critique: string,
    task: string,
    context: any
  ): Promise<string> {
    const refinementPrompt = `
المهمة الأصلية:
${task}

السياق:
${JSON.stringify(context, null, 2).substring(0, 1000)}

المخرج الحالي:
"""
${output}
"""

النقد والملاحظات:
"""
${critique}
"""

قم بتحسين المخرج بناءً على النقد والملاحظات.
احتفظ بالجوانب الجيدة، وحسّن نقاط الضعف.

أعد المخرج المحسّن فقط بدون شروحات:
`;

    try {
      return await geminiService.generateContent(refinementPrompt);
    } catch (error) {
      console.error("[Self-Critique] Error refining output:", error);
      return output; // Return original on error
    }
  }

  /**
   * حساب درجة التحسين
   * Calculate improvement score
   */
  private async calculateImprovement(
    original: string,
    refined: string
  ): Promise<number> {
    // Simple comparison - can be enhanced with more sophisticated metrics
    if (original === refined) return 0;

    const assessmentPrompt = `
المخرج الأصلي:
"""
${original.substring(0, 1500)}
"""

المخرج المحسّن:
"""
${refined.substring(0, 1500)}
"""

قيّم مستوى التحسين على مقياس من 0 إلى 1:
- 0 = لا يوجد تحسين أو أسوأ
- 0.5 = تحسين متوسط
- 1 = تحسين ممتاز

أجب برقم فقط (مثال: 0.75):
`;

    try {
      const result = await geminiService.generateContent(assessmentPrompt);
      const score = parseFloat(result.trim());
      return isNaN(score) ? 0.5 : Math.min(Math.max(score, 0), 1);
    } catch (error) {
      console.error("[Self-Critique] Error calculating improvement:", error);
      return 0.5; // Default to medium improvement
    }
  }
}

// Export singleton instance
export const selfCritiqueModule = new SelfCritiqueModule();
