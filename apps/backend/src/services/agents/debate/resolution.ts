/**
 * نظام حل المناظرة - Debate Resolution System
 * 
 * @module resolution
 * @description
 * يوفر وظائف لحساب درجات التوافق وتحديد نقاط الاتفاق والاختلاف.
 * جزء من المرحلة 3 - نظام المناظرة متعدد الوكلاء
 */

import { geminiService } from '@/services/gemini.service';
import { logger } from '@/utils/logger';
import { DebateArgument, ConsensusResult, Vote } from './types';

/**
 * حساب درجة التوافق بين الحجج
 * 
 * @description
 * يحسب درجة التوافق باستخدام ثلاث طرق:
 * - تباين الثقة (30%)
 * - تشابه المواقف عبر الذكاء الاصطناعي (50%)
 * - تداخل الأدلة (20%)
 * 
 * @param args - مصفوفة الحجج المراد تحليلها
 * @returns وعد بدرجة التوافق (0-1)
 */
export async function calculateAgreementScore(
  args: DebateArgument[]
): Promise<number> {
  logger.debug("حساب درجة التوافق", { argumentCount: args.length });

  if (args.length === 0) {
    return 0;
  }

  if (args.length === 1) {
    return args[0].confidence;
  }

  try {
    // الطريقة 1: تباين الثقة (30%)
    const confidenceScore = calculateConfidenceAgreement(args);

    // الطريقة 2: تشابه المواقف عبر الذكاء الاصطناعي (50%)
    const positionScore = await calculatePositionSimilarity(args);

    // الطريقة 3: تداخل الأدلة (20%)
    const evidenceScore = calculateEvidenceOverlap(args);

    // الدمج المرجح
    const agreementScore =
      confidenceScore * 0.3 + positionScore * 0.5 + evidenceScore * 0.2;

    logger.info("تم حساب درجة التوافق", {
      agreementScore: agreementScore.toFixed(3),
      confidenceScore: confidenceScore.toFixed(3),
      positionScore: positionScore.toFixed(3),
      evidenceScore: evidenceScore.toFixed(3),
    });

    return Math.min(1, Math.max(0, agreementScore));
  } catch (error) {
    logger.error("فشل في حساب درجة التوافق", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });

    // احتياطي: استخدام متوسط الثقة
    const avgConfidence =
      args.reduce((sum, arg) => sum + arg.confidence, 0) / args.length;
    return avgConfidence;
  }
}

/**
 * تحديد نقاط التوافق من الحجج
 * 
 * @description
 * يستخدم الذكاء الاصطناعي لتحليل الحجج وتحديد النقاط المشتركة
 * 
 * @param args - مصفوفة الحجج
 * @param topic - موضوع المناظرة
 * @returns وعد بمصفوفة نقاط التوافق
 */
export async function identifyConsensusPoints(
  args: DebateArgument[],
  topic: string
): Promise<string[]> {
  logger.debug("تحديد نقاط التوافق");

  if (args.length === 0) {
    return [];
  }

  try {
    const prompt = `
قم بتحليل الحجج التالية في مناظرة حول: "${topic}"

${args
  .map(
    (arg, idx) => `
**الحجة ${idx + 1}** (${arg.agentName}):
${arg.position}
الثقة: ${(arg.confidence * 100).toFixed(0)}%
`
  )
  .join('\n---\n')}

حدد **نقاط التوافق** التي يتفق عليها معظم المشاركين أو تظهر في أكثر من حجة.

قدم قائمة منقطة بنقاط التوافق فقط (بدون شرح إضافي):
`;

    const response = await geminiService.generateContent(prompt, {
      temperature: 0.4,
      maxTokens: 2048,
    });

    // استخراج نقاط التوافق
    const points = extractBulletPoints(response);

    logger.info("تم تحديد نقاط التوافق", { count: points.length });
    return points;
  } catch (error) {
    logger.error("فشل في تحديد نقاط التوافق", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
    return [];
  }
}

/**
 * تحديد نقاط الاختلاف
 * 
 * @description
 * يستخدم الذكاء الاصطناعي لتحليل الحجج وتحديد النقاط المختلف عليها
 * 
 * @param args - مصفوفة الحجج
 * @param topic - موضوع المناظرة
 * @returns وعد بمصفوفة نقاط الاختلاف
 */
export async function identifyDisagreementPoints(
  args: DebateArgument[],
  topic: string
): Promise<string[]> {
  logger.debug("تحديد نقاط الاختلاف");

  if (args.length === 0) {
    return [];
  }

  try {
    const prompt = `
قم بتحليل الحجج التالية في مناظرة حول: "${topic}"

${args
  .map(
    (arg, idx) => `
**الحجة ${idx + 1}** (${arg.agentName}):
${arg.position}
`
  )
  .join('\n---\n')}

حدد **نقاط الاختلاف** التي يختلف عليها المشاركون أو تظهر بها آراء متعارضة.

قدم قائمة منقطة بنقاط الاختلاف فقط:
`;

    const response = await geminiService.generateContent(prompt, {
      temperature: 0.4,
      maxTokens: 2048,
    });

    // استخراج نقاط الاختلاف
    const points = extractBulletPoints(response);

    logger.info("تم تحديد نقاط الاختلاف", { count: points.length });
    return points;
  } catch (error) {
    logger.error("فشل في تحديد نقاط الاختلاف", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
    return [];
  }
}

/**
 * حل الخلافات وإيجاد أرضية مشتركة
 * 
 * @description
 * يولّد حلولاً توفيقية لنقاط الاختلاف
 * 
 * @param args - مصفوفة الحجج
 * @param disagreementPoints - نقاط الاختلاف المحددة
 * @param topic - موضوع المناظرة
 * @returns وعد بنص الحل التوفيقي
 */
export async function resolveDisagreements(
  args: DebateArgument[],
  disagreementPoints: string[],
  topic: string
): Promise<string> {
  logger.debug("حل الخلافات", { disagreementCount: disagreementPoints.length });

  if (disagreementPoints.length === 0) {
    return 'لا توجد نقاط اختلاف كبيرة للحل';
  }

  try {
    const prompt = `
الموضوع: "${topic}"

تم تحديد نقاط الاختلاف التالية:
${disagreementPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

بناءً على الحجج الأصلية:
${args
  .map(
    (arg, idx) => `
${idx + 1}. ${arg.agentName}:
${arg.position.substring(0, 400)}
`
  )
  .join('\n---\n')}

قم بتقديم **حل توفيقي** لكل نقطة اختلاف يجمع بين وجهات النظر المختلفة:
`;

    const response = await geminiService.generateContent(prompt, {
      temperature: 0.6,
      maxTokens: 4096,
    });

    logger.info("تم توليد الحل التوفيقي للخلافات");
    return response;
  } catch (error) {
    logger.error("فشل في حل الخلافات", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
    return 'خطأ في توليد الحل التوفيقي';
  }
}

/**
 * توليف نهائي من جميع الحجج
 * 
 * @description
 * يولّد توليفاً شاملاً يجمع نقاط التوافق والاختلاف
 * 
 * @param args - مصفوفة الحجج
 * @param consensusPoints - نقاط التوافق
 * @param disagreementPoints - نقاط الاختلاف
 * @param topic - موضوع المناظرة
 * @returns وعد بنص التوليف النهائي
 */
export async function generateFinalSynthesis(
  args: DebateArgument[],
  consensusPoints: string[],
  disagreementPoints: string[],
  topic: string
): Promise<string> {
  logger.debug("توليد التوليف النهائي");

  if (args.length === 0) {
    return 'لا توجد حجج لتوليفها';
  }

  try {
    const prompt = `
الموضوع: "${topic}"

**نقاط التوافق:**
${consensusPoints.length > 0 ? consensusPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'لا توجد'}

**نقاط الاختلاف:**
${disagreementPoints.length > 0 ? disagreementPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'لا توجد'}

**الحجج الأصلية:**
${args
  .map(
    (arg, idx) => `
${idx + 1}. **${arg.agentName}** (ثقة: ${(arg.confidence * 100).toFixed(0)}%):
${arg.position}
`
  )
  .join('\n---\n')}

قم بتوليف **موقف نهائي شامل** يتضمن:
1. تلخيص نقاط التوافق
2. معالجة نقاط الاختلاف بطريقة متوازنة
3. استخلاص رؤية موحدة ومتماسكة
4. توصيات عملية (إن أمكن)

قدم التوليف بشكل منظم وواضح:
`;

    const synthesis = await geminiService.generateContent(prompt, {
      temperature: 0.6,
      maxTokens: 8192,
    });

    logger.info("تم توليد التوليف النهائي");
    return synthesis;
  } catch (error) {
    logger.error("فشل في توليد التوليف النهائي", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
    return 'خطأ في توليف النتيجة النهائية';
  }
}

/**
 * بناء نتيجة التوافق الكاملة
 * 
 * @description
 * يجمع كل خطوات تحليل التوافق في نتيجة واحدة شاملة
 * 
 * @param args - مصفوفة الحجج
 * @param topic - موضوع المناظرة
 * @returns وعد بنتيجة التوافق الكاملة
 */
export async function buildConsensusResult(
  args: DebateArgument[],
  topic: string
): Promise<ConsensusResult> {
  logger.info("بناء نتيجة التوافق الكاملة");

  try {
    // 1. حساب درجة التوافق
    const agreementScore = await calculateAgreementScore(args);

    // 2. تحديد نقاط التوافق والاختلاف
    const [consensusPoints, disagreementPoints] = await Promise.all([
      identifyConsensusPoints(args, topic),
      identifyDisagreementPoints(args, topic),
    ]);

    // 3. توليد التوليف النهائي
    const finalSynthesis = await generateFinalSynthesis(
      args,
      consensusPoints,
      disagreementPoints,
      topic
    );

    // 4. تحديد ما إذا تم تحقيق التوافق (الحد: 0.75)
    const achieved = agreementScore >= 0.75;

    // 5. الحصول على الوكلاء المشاركين
    const participatingAgents = Array.from(
      new Set(args.map(arg => arg.agentName))
    );

    return {
      achieved,
      agreementScore,
      consensusPoints,
      disagreementPoints,
      finalSynthesis,
      participatingAgents,
      confidence: agreementScore,
    };
  } catch (error) {
    logger.error("فشل في بناء نتيجة التوافق", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });

    return {
      achieved: false,
      agreementScore: 0,
      consensusPoints: [],
      disagreementPoints: ['خطأ في بناء نتيجة التوافق'],
      finalSynthesis: '',
      participatingAgents: [],
      confidence: 0,
    };
  }
}

/**
 * حساب الأصوات وتحديد الفائز
 * 
 * @description
 * يجمع الأصوات ويحدد الحجة الفائزة
 * 
 * @param votes - مصفوفة الأصوات
 * @returns كائن يحتوي على درجات الحجج ومعرّف الفائز
 */
export function calculateVoteResults(
  votes: Vote[]
): { argumentScores: Map<string, number>; winnerId: string | null } {
  logger.debug("حساب نتائج التصويت", { voteCount: votes.length });

  const argumentScores = new Map<string, number>();

  // تجميع الأصوات
  votes.forEach(vote => {
    const currentScore = argumentScores.get(vote.argumentId) || 0;
    argumentScores.set(vote.argumentId, currentScore + vote.score);
  });

  // تحديد الفائز (أعلى درجة)
  let maxScore = 0;
  let winnerId: string | null = null;

  argumentScores.forEach((score, argId) => {
    if (score > maxScore) {
      maxScore = score;
      winnerId = argId;
    }
  });

  logger.info("تم تحديد الفائز في التصويت", {
    winnerId,
    maxScore: maxScore.toFixed(2),
  });

  return { argumentScores, winnerId };
}

// ===== وظائف مساعدة =====

/**
 * حساب التوافق بناءً على تباين الثقة
 * 
 * @param args - مصفوفة الحجج
 * @returns درجة التوافق بناءً على الثقة
 */
function calculateConfidenceAgreement(args: DebateArgument[]): number {
  const confidences = args.map(arg => arg.confidence);
  const avgConfidence =
    confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const variance =
    confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) /
    confidences.length;

  // تباين أقل = توافق أعلى
  const agreementScore = 1 - Math.min(1, variance * 2);

  return agreementScore;
}

/**
 * حساب تشابه المواقف باستخدام الذكاء الاصطناعي
 * 
 * @param args - مصفوفة الحجج
 * @returns وعد بدرجة التشابه
 */
async function calculatePositionSimilarity(
  args: DebateArgument[]
): Promise<number> {
  try {
    const prompt = `
على مقياس من 0 إلى 1، ما مدى تشابه المواقف التالية؟

${args
  .map(
    (arg, idx) => `
${idx + 1}. ${arg.agentName}:
${arg.position.substring(0, 300)}
`
  )
  .join('\n')}

أعطِ فقط رقماً واحداً بين 0 و 1:
- 1 = تطابق تام
- 0.75 = تشابه كبير
- 0.5 = تشابه معتدل
- 0.25 = اختلاف كبير
- 0 = تعارض تام

الرقم:
`;

    const response = await geminiService.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 50,
    });

    const match = response.match(/(\d+\.?\d*)/);
    if (match?.[1]) {
      return Math.min(1, Math.max(0, parseFloat(match[1])));
    }

    return 0.5; // القيمة الافتراضية
  } catch (error) {
    logger.error("فشل في حساب تشابه المواقف", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
    return 0.5;
  }
}

/**
 * Calculate evidence overlap
 */
function calculateEvidenceOverlap(args: DebateArgument[]): number {
  if (args.length < 2) {
    return 1;
  }

  // Collect all evidence
  const allEvidence = args.flatMap(arg => arg.evidence);

  if (allEvidence.length === 0) {
    return 0.5; // No evidence, neutral score
  }

  // Count evidence overlaps
  let overlapCount = 0;
  let totalComparisons = 0;

  for (let i = 0; i < arguments.length; i++) {
    for (let j = i + 1; j < arguments.length; j++) {
      const evidence1 = arguments[i].evidence;
      const evidence2 = arguments[j].evidence;

      evidence1.forEach(e1 => {
        evidence2.forEach(e2 => {
          totalComparisons++;
          // Simple similarity check (can be improved with embeddings)
          if (areSimilar(e1, e2)) {
            overlapCount++;
          }
        });
      });
    }
  }

  if (totalComparisons === 0) {
    return 0.5;
  }

  return overlapCount / totalComparisons;
}

/**
 * Check if two strings are similar (simple version)
 */
function areSimilar(str1: string, str2: string): boolean {
  const normalized1 = str1.toLowerCase().trim();
  const normalized2 = str2.toLowerCase().trim();

  // Check if one contains the other
  if (
    normalized1.includes(normalized2) ||
    normalized2.includes(normalized1)
  ) {
    return true;
  }

  // Check word overlap
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);

  const commonWords = words1.filter(w => words2.includes(w));

  // If 50%+ words overlap, consider similar
  return commonWords.length / Math.max(words1.length, words2.length) > 0.5;
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  const points: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Match bullet points (-, *, •) or numbered lists (1., 2.), etc)
    if (trimmed.match(/^[\-\*\•]\s/) || trimmed.match(/^\d+[\.\)]\s/)) {
      const point = trimmed
        .replace(/^[\-\*\•]\s/, '')
        .replace(/^\d+[\.\)]\s/, '')
        .trim();

      if (point.length > 0) {
        points.push(point);
      }
    }
  }

  return points;
}
