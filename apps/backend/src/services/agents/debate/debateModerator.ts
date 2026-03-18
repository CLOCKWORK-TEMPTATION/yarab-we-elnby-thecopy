/**
 * منسق المناظرة - Debate Moderator
 * 
 * @module debateModerator
 * @description
 * ينسق المناظرات بين الوكلاء المتعددين، ويبني التوافق، ويجمع النتائج.
 * جزء من المرحلة 3 - نظام المناظرة متعدد الوكلاء
 * 
 * @example
 * ```typescript
 * const moderator = new DebateModerator(topic, participants);
 * const result = await moderator.runDebate(context);
 * ```
 */

import { geminiService } from '@/services/gemini.service';
import { logger } from '@/utils/logger';
import {
  DebateSession,
  DebateConfig,
  DebateParticipant,
  DebateArgument,
  ConsensusResult,
  Vote,
} from './types';
import { DebateSessionClass } from './debateSession';
import { StandardAgentOutput } from '../shared/standardAgentPattern';

/**
 * فئة منسق المناظرة
 * 
 * @description
 * تدير عملية المناظرة بالكامل وتبني التوافق بين الوكلاء
 */
export class DebateModerator {
  /** جلسة المناظرة */
  private session: DebateSessionClass;
  /** خريطة الأصوات - تربط معرّف الحجة بأصوات الوكلاء */
  private votes: Map<string, Vote[]> = new Map();

  /**
   * منشئ فئة منسق المناظرة
   * 
   * @param topic - موضوع المناظرة
   * @param participants - قائمة المشاركين في المناظرة
   * @param config - إعدادات المناظرة الاختيارية
   */
  constructor(
    topic: string,
    participants: DebateParticipant[],
    config?: Partial<DebateConfig>
  ) {
    this.session = new DebateSessionClass(topic, participants, config);
  }

  /**
   * تشغيل عملية المناظرة الكاملة
   * 
   * @description
   * يدير جميع جولات المناظرة، يبني التوافق، ويجمع النتيجة النهائية
   * 
   * @param context - سياق إضافي للمناظرة (اختياري)
   * @returns وعد بنتيجة المناظرة النهائية
   */
  async runDebate(context?: string): Promise<StandardAgentOutput> {
    logger.info("بدء المناظرة", { topic: this.session.topic });

    try {
      await this.session.start();

      const maxRounds = this.session.config.maxRounds || 3;
      const consensusThreshold = this.session.config.consensusThreshold || 0.75;

      let consensusReached = false;
      let currentRound = 1;

      // تنفيذ جولات المناظرة
      while (currentRound <= maxRounds && !consensusReached) {
        logger.debug("تنفيذ جولة المناظرة", {
          currentRound,
          maxRounds,
        });

        // تنفيذ الجولة
        await this.session.executeRound(currentRound, context);

        // التحقق من التوافق بعد الجولة الأولى
        if (currentRound > 1 || maxRounds === 1) {
          const consensus = await this.buildConsensus();
          const round = this.session.getCurrentRound();
          if (round) {
            round.consensus = consensus;
          }

          if (consensus.achieved && consensus.agreementScore >= consensusThreshold) {
            consensusReached = true;
            logger.info("تم التوصل إلى توافق", {
              round: currentRound,
              agreementScore: consensus.agreementScore,
            });
            break;
          }
        }

        currentRound++;
      }

      // توليد النتيجة النهائية
      const finalResult = await this.synthesizeFinalResult();
      this.session.setFinalResult(finalResult);
      this.session.complete();

      return finalResult;
    } catch (error) {
      logger.error("فشلت المناظرة", {
        topic: this.session.topic,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
      this.session.fail(error instanceof Error ? error.message : 'Unknown error');

      // إرجاع نتيجة احتياطية
      return {
        text: `عذراً، حدث خطأ أثناء المناظرة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        confidence: 0.3,
        notes: ['فشل في إتمام المناظرة'],
        metadata: {
          debateRounds: this.session.rounds.length,
        },
      };
    }
  }

  /**
   * بناء التوافق من الحجج
   * 
   * @description
   * يحلل جميع الحجج ويحاول الوصول إلى توافق بين الوكلاء
   * 
   * @returns وعد بنتيجة التوافق
   */
  async buildConsensus(): Promise<ConsensusResult> {
    logger.debug("بناء التوافق");

    const allArguments = this.session.getAllArguments();

    if (allArguments.length === 0) {
      return {
        achieved: false,
        agreementScore: 0,
        consensusPoints: [],
        disagreementPoints: ['لا توجد حجج كافية للتحليل'],
        finalSynthesis: '',
        participatingAgents: [],
        confidence: 0,
      };
    }

    try {
      // تحليل الحجج للعثور على الموضوعات المشتركة والخلافات
      const analysis = await this.analyzeArguments(allArguments);

      // حساب درجة التوافق
      const agreementScore = await this.calculateAgreementScore(allArguments);

      // تحديد ما إذا تم تحقيق التوافق
      const consensusThreshold = this.session.config.consensusThreshold || 0.75;
      const achieved = agreementScore >= consensusThreshold;

      // الحصول على الوكلاء المشاركين
      const participatingAgents = Array.from(
        new Set(allArguments.map(arg => arg.agentName))
      );

      // توليد التوليف إذا تم تحقيق التوافق
      let finalSynthesis = '';
      if (achieved) {
        finalSynthesis = await this.generateSynthesis(
          allArguments,
          analysis.consensusPoints
        );
      }

      return {
        achieved,
        agreementScore,
        consensusPoints: analysis.consensusPoints,
        disagreementPoints: analysis.disagreementPoints,
        finalSynthesis,
        participatingAgents,
        confidence: agreementScore,
      };
    } catch (error) {
      logger.error("فشل في بناء التوافق", {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });

      return {
        achieved: false,
        agreementScore: 0,
        consensusPoints: [],
        disagreementPoints: ['خطأ في تحليل التوافق'],
        finalSynthesis: '',
        participatingAgents: [],
        confidence: 0,
      };
    }
  }

  /**
   * تحليل الحجج للعثور على نقاط التوافق والاختلاف
   * 
   * @description
   * يستخدم نموذج اللغة لتحليل الحجج وتحديد المواضيع المشتركة والخلافات
   * 
   * @param debateArguments - مصفوفة الحجج المراد تحليلها
   * @returns وعد بكائن يحتوي على نقاط التوافق والاختلاف
   */
  private async analyzeArguments(
    debateArguments: DebateArgument[]
  ): Promise<{ consensusPoints: string[]; disagreementPoints: string[] }> {
    const prompt = `

قم بتحليل الحجج التالية في مناظرة حول: "${this.session.topic}"



${debateArguments.map((arg, idx) => `
**الحجة ${idx + 1}** (${arg.agentName}):
${arg.position}
الثقة: ${arg.confidence}
`).join('\n---\n')}

حدد:
1. **نقاط التوافق**: النقاط التي يتفق عليها معظم المشاركين
2. **نقاط الاختلاف**: النقاط المثيرة للجدل أو التي يختلف عليها المشاركون

قدم النتائج بشكل واضح ومنظم.
`;

    try {
      const response = await geminiService.generateContent(prompt, {
        temperature: 0.5,
        maxTokens: 4096,
      });

      // تحليل الاستجابة لاستخراج نقاط التوافق والاختلاف
      const lines = response.split('\n');
      const consensusPoints: string[] = [];
      const disagreementPoints: string[] = [];

      let currentSection: 'consensus' | 'disagreement' | null = null;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.includes('توافق') || trimmed.includes('اتفاق')) {
          currentSection = 'consensus';
          continue;
        }

        if (trimmed.includes('اختلاف') || trimmed.includes('جدل')) {
          currentSection = 'disagreement';
          continue;
        }

        // استخراج النقاط المرقمة أو المنقطة
        if (trimmed.match(/^[\-\*\•]\s/) || trimmed.match(/^\d+[\.\)]\s/)) {
          const point = trimmed.replace(/^[\-\*\•]\s/, '').replace(/^\d+[\.\)]\s/, '');

          if (currentSection === 'consensus') {
            consensusPoints.push(point);
          } else if (currentSection === 'disagreement') {
            disagreementPoints.push(point);
          }
        }
      }

      return { consensusPoints, disagreementPoints };
    } catch (error) {
      logger.error("فشل في تحليل الحجج", {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
      return {
        consensusPoints: [],
        disagreementPoints: ['خطأ في التحليل'],
      };
    }
  }

  /**
   * حساب درجة التوافق
   * 
   * @description
   * يحسب درجة التوافق بين الوكلاء على مقياس من 0 إلى 1
   * 
   * @param debateArguments - مصفوفة الحجج
   * @returns وعد بدرجة التوافق
   */
  private async calculateAgreementScore(debateArguments: DebateArgument[]): Promise<number> {
    if (debateArguments.length === 0) return 0;

    // الطريقة 1: بناءً على تشابه درجات الثقة
    const confidences = debateArguments.map(arg => arg.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    const confidenceAgreement = 1 - Math.min(1, variance);

    // الطريقة 2: بناءً على تشابه المواقف (باستخدام الذكاء الاصطناعي)
    let positionAgreement = 0.5; // القيمة الافتراضية

    try {
      const prompt = `
على مقياس من 0 إلى 1، ما مدى تشابه المواقف التالية؟

${debateArguments.map((arg, idx) => `
${idx + 1}. ${arg.agentName}: ${arg.position.substring(0, 200)}
`).join('\n')}

أعطِ فقط رقماً بين 0 و 1 (حيث 1 = تطابق تام، 0 = تعارض تام):
`;

      const response = await geminiService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 100,
      });

      const match = response.match(/(\d+\.?\d*)/);
      if (match?.[1]) {
        positionAgreement = Math.min(1, Math.max(0, parseFloat(match[1])));
      }
    } catch (error) {
      logger.error("فشل في حساب تشابه المواقف", {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }

    // الدرجة المجمعة (متوسط مرجح)
    const agreementScore = (confidenceAgreement * 0.3) + (positionAgreement * 0.7);

    return agreementScore;
  }

  /**
   * توليد التوليف من نقاط التوافق
   * 
   * @description
   * يولّد نصاً يجمع نقاط التوافق في رؤية موحدة
   * 
   * @param debateArguments - مصفوفة الحجج
   * @param consensusPoints - نقاط التوافق المحددة
   * @returns وعد بنص التوليف
   */
  private async generateSynthesis(
    debateArguments: DebateArgument[],
    consensusPoints: string[]
  ): Promise<string> {
    const prompt = `
بناءً على المناظرة حول: "${this.session.topic}"

**نقاط التوافق:**
${consensusPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

**الحجج الأصلية:**

${debateArguments.slice(0, 3).map((arg, idx) => `

${idx + 1}. ${arg.agentName}: ${arg.position.substring(0, 300)}

`).join('\n')}

قم بتوليف موقف نهائي موحد يجمع نقاط التوافق ويقدم رأياً متماسكاً وشاملاً.
`;

    try {
      const synthesis = await geminiService.generateContent(prompt, {
        temperature: 0.6,
        maxTokens: 8192,
      });

      return synthesis;
    } catch (error) {
      logger.error("فشل في توليد التوليف", {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
      return 'خطأ في توليد التوليف النهائي';
    }
  }

  /**
   * توليف النتيجة النهائية من جميع جولات المناظرة
   * 
   * @description
   * يجمع نتائج جميع الجولات في نتيجة نهائية شاملة
   * 
   * @returns وعد بالنتيجة النهائية
   */
  private async synthesizeFinalResult(): Promise<StandardAgentOutput> {
    logger.debug("توليف النتيجة النهائية");

    const metrics = this.session.getMetrics();
    const lastRound = this.session.getCurrentRound();
    const consensus = lastRound?.consensus;

    let finalText = '';
    let confidence = 0;
    const notes: string[] = [];

    if (consensus && consensus.achieved) {
      finalText = consensus.finalSynthesis;
      confidence = consensus.confidence;
      notes.push(`تم التوصل إلى توافق بنسبة ${(consensus.agreementScore * 100).toFixed(1)}%`);
    } else {
      // لا يوجد توافق - توليف من جميع الحجج
      const allArguments = this.session.getAllArguments();
      finalText = await this.synthesizeWithoutConsensus(allArguments);
      confidence = metrics.averageConfidence * 0.8; // تقليل الثقة إذا لم يكن هناك توافق
      notes.push('لم يتم التوصل إلى توافق كامل - هذا توليف للآراء المختلفة');
    }

    notes.push(`عدد الجولات: ${metrics.totalRounds}`);
    notes.push(`عدد الحجج: ${metrics.totalArguments}`);
    notes.push(`جودة المناظرة: ${(metrics.qualityScore * 100).toFixed(1)}%`);

    return {
      text: finalText,
      confidence,
      notes,
      metadata: {
        debateRounds: metrics.totalRounds,
        consensusAchieved: metrics.consensusAchieved,
        participantCount: metrics.participantCount,
        agreementScore: metrics.finalAgreementScore,
        qualityScore: metrics.qualityScore,
        processingTime: metrics.processingTime,
      },
    };
  }

  /**
   * توليف النتيجة عندما لا يتم التوصل إلى توافق
   * 
   * @description
   * يولّد توليفاً يعرض جميع وجهات النظر بشكل متوازن
   * 
   * @param debateArguments - مصفوفة الحجج
   * @returns وعد بنص التوليف
   */
  private async synthesizeWithoutConsensus(debateArguments: DebateArgument[]): Promise<string> {
    const prompt = `
لم يتم التوصل إلى توافق كامل في المناظرة حول: "${this.session.topic}"

قم بتوليف الآراء المختلفة التالية في رؤية شاملة تعرض جميع وجهات النظر:

${debateArguments.map((arg, idx) => `

**${idx + 1}. ${arg.agentName}:**

${arg.position}

(الثقة: ${arg.confidence})

`).join('\n---\n')}

قدم توليفاً يشمل:
1. عرض موضوعي لجميع وجهات النظر
2. تحديد نقاط القوة في كل حجة
3. استخلاص رؤية متوازنة تجمع أفضل ما في كل موقف
`;

    try {
      const synthesis = await geminiService.generateContent(prompt, {
        temperature: 0.6,
        maxTokens: 8192,
      });

      return synthesis;
    } catch (error) {
      logger.error("فشل في توليف النتيجة بدون توافق", {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
      return 'خطأ في توليف النتيجة النهائية';
    }
  }

  /**
   * الحصول على جلسة المناظرة
   * 
   * @returns جلسة المناظرة الحالية
   */
  getSession(): DebateSession {
    return this.session;
  }

  /**
   * تسجيل صوت
   * 
   * @description
   * يضيف صوتاً جديداً لحجة محددة
   * 
   * @param vote - كائن الصوت المراد تسجيله
   */
  recordVote(vote: Vote): void {
    const existingVotes = this.votes.get(vote.argumentId) || [];
    existingVotes.push(vote);
    this.votes.set(vote.argumentId, existingVotes);
  }

  /**
   * الحصول على الأصوات لحجة محددة
   * 
   * @param argumentId - معرّف الحجة
   * @returns مصفوفة الأصوات للحجة المحددة
   */
  getVotesForArgument(argumentId: string): Vote[] {
    return this.votes.get(argumentId) || [];
  }

  /**
   * الحصول على جميع الأصوات
   * 
   * @returns خريطة جميع الأصوات مرتبة حسب معرّف الحجة
   */
  getAllVotes(): Map<string, Vote[]> {
    return new Map(this.votes);
  }
}