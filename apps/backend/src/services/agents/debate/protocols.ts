/**
 * بروتوكولات المناظرة - Debate Protocols
 * 
 * @module protocols
 * @description
 * وظائف تنسيق المناظرة عالية المستوى.
 * جزء من المرحلة 3 - نظام المناظرة متعدد الوكلاء
 */

import { BaseAgent } from '../shared/BaseAgent';
import { logger } from '@/utils/logger';
import {
  DebateConfig,
  DebateParticipant,
  DebateArgument,
  DebateRole,
  ConsensusResult,
  Vote,
} from './types';
import { DebateModerator } from './debateModerator';
import { StandardAgentOutput } from '../shared/standardAgentPattern';
import { selectDebatingAgents } from './selection';

/**
 * بدء جلسة مناظرة
 * 
 * @description
 * يبدأ جلسة مناظرة جديدة مع الوكلاء المحددين
 * 
 * @param topic - موضوع المناظرة
 * @param availableAgents - الوكلاء المتاحين للمشاركة
 * @param context - السياق الإضافي (اختياري)
 * @param config - إعدادات المناظرة (اختياري)
 * @returns وعد بنتيجة المناظرة
 * @throws خطأ إذا كان عدد الوكلاء أقل من 2
 */
export async function startDebate(
  topic: string,
  availableAgents: BaseAgent[],
  context?: string,
  config?: Partial<DebateConfig>
): Promise<StandardAgentOutput> {
  logger.info("بدء جلسة مناظرة", { topic, agentCount: availableAgents.length });

  // اختيار الوكلاء المشاركين
  const participants = selectDebatingAgents(availableAgents, config);

  if (participants.length < 2) {
    throw new Error('يجب أن يكون هناك على الأقل وكيلان للمناظرة');
  }

  // إنشاء المنسق وتشغيل المناظرة
  const moderator = new DebateModerator(topic, participants, config);
  const result = await moderator.runDebate(context);

  return result;
}

/**
 * تقديم الحجج من جميع المشاركين
 * 
 * @description
 * يجمع الحجج من جميع المشاركين في المناظرة
 * 
 * @param topic - موضوع المناظرة
 * @param participants - المشاركون في المناظرة
 * @param context - السياق الإضافي (اختياري)
 * @param previousArguments - الحجج السابقة (اختياري)
 * @returns وعد بمصفوفة الحجج المقدمة
 */
export async function presentArguments(
  topic: string,
  participants: DebateParticipant[],
  context?: string,
  previousArguments?: DebateArgument[]
): Promise<DebateArgument[]> {
  logger.debug("جمع الحجج من المشاركين", { participantCount: participants.length });

  const argumentPromises = participants.map(async participant => {
    try {
      const agentName = participant.agent.getConfig().name;
      logger.debug("الحصول على حجة من وكيل", { agentName });

      // بناء النص بناءً على الدور
      const prompt = buildArgumentPrompt(
        topic,
        participant.role,
        context,
        previousArguments
      );

      const result = await participant.agent.executeTask({
        input: prompt,
        options: {
          temperature: 0.7,
          enableRAG: true,
          enableSelfCritique: true,
        },
        context: context || '',
      });

      const argument: DebateArgument = {
        id: `${agentName}-${Date.now()}`,
        agentName,
        role: participant.role,
        position: result.text,
        reasoning: extractReasoning(result.text),
        evidence: extractEvidence(result.text),
        confidence: result.confidence,
        referencesTo: previousArguments?.map(arg => arg.id) || [],
        timestamp: new Date(),
      };

      return argument;
    } catch (error) {
      logger.error("فشل في الحصول على حجة من المشارك", {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
      return null;
    }
  });

  const debateArguments = await Promise.all(argumentPromises);

  // تصفية الحجج الفاشلة
  return debateArguments.filter((arg): arg is DebateArgument => arg !== null);
}

/**
 * الرد على الحجج
 * 
 * @description
 * يجمع الردود من المشاركين على حجج الآخرين
 * 
 * @param args - الحجج المراد الرد عليها
 * @param participants - المشاركون في المناظرة
 * @param context - السياق الإضافي (اختياري)
 * @returns وعد بمصفوفة الردود
 */
export async function refuteArguments(
  args: DebateArgument[],
  participants: DebateParticipant[],
  context?: string
): Promise<DebateArgument[]> {
  logger.debug("جمع الردود على الحجج", { argumentCount: args.length });

  const refutations: DebateArgument[] = [];

  for (const participant of participants) {
    const agentName = participant.agent.getConfig().name;

    // كل وكيل يرد على حجج الوكلاء الآخرين
    const otherArguments = args.filter(arg => arg.agentName !== agentName);

    if (otherArguments.length === 0) continue;

    try {
      const prompt = buildRefutationPrompt(otherArguments, context);

      const result = await participant.agent.executeTask({
        input: prompt,
        options: {
          temperature: 0.7,
          enableRAG: true,
          enableSelfCritique: true,
        },
        context: context || '',
      });

      const refutation: DebateArgument = {
        id: `refutation-${agentName}-${Date.now()}`,
        agentName,
        role: DebateRole.OPPONENT,
        position: result.text,
        reasoning: extractReasoning(result.text),
        evidence: extractEvidence(result.text),
        confidence: result.confidence,
        referencesTo: otherArguments.map(arg => arg.id),
        timestamp: new Date(),
      };

      refutations.push(refutation);
    } catch (error) {
      logger.error("فشل في الحصول على رد من وكيل", {
        agentName,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }

  return refutations;
}

/**
 * توليف التوافق من الحجج
 * 
 * @description
 * يحلل الحجج ويحاول الوصول إلى توافق
 * 
 * @param args - الحجج المراد تحليلها
 * @param topic - موضوع المناظرة
 * @param synthesizer - وكيل التوليف (اختياري)
 * @returns وعد بنتيجة التوافق
 */
export async function synthesizeConsensus(
  args: DebateArgument[],
  topic: string,
  synthesizer?: BaseAgent
): Promise<ConsensusResult> {
  logger.debug("توليف التوافق من الحجج", { argumentCount: args.length });

  if (args.length === 0) {
    return {
      achieved: false,
      agreementScore: 0,
      consensusPoints: [],
      disagreementPoints: ['لا توجد حجج للتحليل'],
      finalSynthesis: '',
      participatingAgents: [],
      confidence: 0,
    };
  }

  try {
    // استخدام وكيل التوليف إذا كان متاحاً، وإلا إنشاء توليف مباشر
    const synthesisText = synthesizer
      ? await getSynthesizerAgentOutput(synthesizer, args, topic)
      : await generateDirectSynthesis(args, topic);

    // تحليل نقاط التوافق
    const { consensusPoints, disagreementPoints } = await analyzeConsensusPoints(
      args,
      synthesisText
    );

    // حساب درجة التوافق
    const agreementScore = calculateAgreementScore(args, consensusPoints);

    // تحديد ما إذا تم تحقيق التوافق (الحد 0.75)
    const achieved = agreementScore >= 0.75;

    // الحصول على الوكلاء المشاركين
    const participatingAgents = Array.from(
      new Set(args.map(arg => arg.agentName))
    );

    return {
      achieved,
      agreementScore,
      consensusPoints,
      disagreementPoints,
      finalSynthesis: synthesisText,
      participatingAgents,
      confidence: agreementScore,
    };
  } catch (error) {
    logger.error("فشل في توليف التوافق", {
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });

    return {
      achieved: false,
      agreementScore: 0,
      consensusPoints: [],
      disagreementPoints: ['خطأ في توليف التوافق'],
      finalSynthesis: '',
      participatingAgents: [],
      confidence: 0,
    };
  }
}

/**
 * التصويت على أفضل رد
 * 
 * @description
 * يجمع أصوات المشاركين على الحجج ويحدد الفائز
 * 
 * @param args - الحجج المراد التصويت عليها
 * @param participants - المشاركون في المناظرة
 * @param topic - موضوع المناظرة
 * @returns وعد بنتيجة التصويت شاملة الفائز
 */
export async function voteOnBestResponse(
  args: DebateArgument[],
  participants: DebateParticipant[],
  topic: string
): Promise<{ argumentId: string; votes: Vote[]; winner: DebateArgument }> {
  logger.debug("التصويت على الحجج", { argumentCount: args.length });

  const allVotes: Vote[] = [];

  // كل مشارك يصوت على جميع الحجج
  for (const participant of participants) {
    const agentName = participant.agent.getConfig().name;

    try {
      const prompt = buildVotingPrompt(args, topic);

      const result = await participant.agent.executeTask({
        input: prompt,
        options: {
          temperature: 0.5,
          enableRAG: false,
        },
      });

      // تحليل الأصوات من الاستجابة
      const votes = parseVotesFromResponse(result.text, args, agentName);
      allVotes.push(...votes);
    } catch (error) {
      logger.error("فشل في الحصول على أصوات من وكيل", {
        agentName,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }

  // حساب درجات التصويت لكل حجة
  const scoreMap = new Map<string, number>();
  args.forEach(arg => scoreMap.set(arg.id, 0));

  allVotes.forEach(vote => {
    const currentScore = scoreMap.get(vote.argumentId) || 0;
    scoreMap.set(vote.argumentId, currentScore + vote.score);
  });

  // تحديد الفائز (أعلى درجة)
  let maxScore = 0;
  let winnerId = args[0].id;

  scoreMap.forEach((score, argId) => {
    if (score > maxScore) {
      maxScore = score;
      winnerId = argId;
    }
  });

  const winner = args.find(arg => arg.id === winnerId) || args[0];

  return {
    argumentId: winnerId,
    votes: allVotes,
    winner,
  };
}

// ===== Helper Functions =====

/**
 * Build argument prompt based on role
 */
function buildArgumentPrompt(
  topic: string,
  role: DebateRole,
  context?: string,
  previousArguments?: DebateArgument[]
): string {
  let prompt = `الموضوع: ${topic}\n\n`;

  if (context) {
    prompt += `السياق:\n${context}\n\n`;
  }

  if (previousArguments && previousArguments.length > 0) {
    prompt += `الحجج السابقة:\n`;
    previousArguments.forEach((arg, idx) => {
      prompt += `${idx + 1}. ${arg.agentName}: ${arg.position.substring(0, 200)}...\n`;
    });
    prompt += '\n';
  }

  switch (role) {
    case DebateRole.PROPOSER:
      prompt += 'قدم حجة قوية ومدعومة بالأدلة لدعم موقفك من هذا الموضوع.';
      break;
    case DebateRole.OPPONENT:
      prompt += 'قدم حجة مضادة مدعومة بالأدلة.';
      break;
    case DebateRole.SYNTHESIZER:
      prompt += 'حلل الحجج واستخلص رأياً موحداً.';
      break;
    default:
      prompt += 'قدم تحليلاً متوازناً للموضوع.';
  }

  return prompt;
}

/**
 * Build refutation prompt
 */
function buildRefutationPrompt(
  args: DebateArgument[],
  context?: string
): string {
  let prompt = 'قم بتحليل ونقد الحجج التالية:\n\n';

  args.forEach((arg, idx) => {
    prompt += `**الحجة ${idx + 1}** (${arg.agentName}):\n`;
    prompt += `${arg.position}\n\n`;
  });

  if (context) {
    prompt += `\nالسياق:\n${context}\n\n`;
  }

  prompt += 'قدم رداً منطقياً يتضمن نقاط الضعف والحجج المضادة.';

  return prompt;
}

/**
 * Build voting prompt
 */
function buildVotingPrompt(args: DebateArgument[], topic: string): string {
  let prompt = `الموضوع: ${topic}\n\nقيّم الحجج التالية (من 0 إلى 1):\n\n`;

  args.forEach((arg, idx) => {
    prompt += `${idx + 1}. ${arg.agentName}:\n${arg.position.substring(0, 300)}\n\n`;
  });

  prompt += 'أعطِ درجة لكل حجة بناءً على القوة المنطقية والأدلة.';

  return prompt;
}

/**
 * Extract reasoning from text
 */
function extractReasoning(text: string): string {
  const patterns = [
    /لأن[^\.]+\./g,
    /بسبب[^\.]+\./g,
    /نظراً[^\.]+\./g,
  ];

  let reasoning = '';
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      reasoning += matches.join(' ');
    }
  }

  return reasoning || text.substring(0, 200);
}

/**
 * Extract evidence from text
 */
function extractEvidence(text: string): string[] {
  const evidence: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.match(/^[\-\*\•]\s/) || line.match(/^\d+[\.\)]\s/)) {
      evidence.push(line.trim());
    }
  }

  return evidence.slice(0, 5);
}

/**
 * Get synthesis from synthesizer agent
 */
async function getSynthesizerAgentOutput(
  synthesizer: BaseAgent,
  args: DebateArgument[],
  topic: string
): Promise<string> {
  const prompt = `
الموضوع: ${topic}

قم بتوليف الحجج التالية في رأي موحد:

${args.map((arg, idx) => `
${idx + 1}. ${arg.agentName}:
${arg.position}
`).join('\n---\n')}

قدم توليفاً شاملاً يجمع أفضل ما في كل حجة.
`;

  const result = await synthesizer.executeTask({
    input: prompt,
    options: {
      temperature: 0.6,
      enableRAG: true,
    },
  });

  return result.text;
}

/**
 * Generate direct synthesis without synthesizer agent
 */
async function generateDirectSynthesis(
  args: DebateArgument[],
  topic: string
): Promise<string> {
  // Simple concatenation with summary
  let synthesis = `# توليف الآراء حول: ${topic}\n\n`;

  synthesis += `بناءً على ${args.length} حجة من المشاركين، نستنتج ما يلي:\n\n`;

  args.forEach((arg, idx) => {
    synthesis += `**${idx + 1}. ${arg.agentName}:**\n${arg.position.substring(0, 300)}...\n\n`;
  });

  return synthesis;
}

/**
 * Analyze consensus points from arguments
 */
async function analyzeConsensusPoints(
  args: DebateArgument[],
  synthesisText: string
): Promise<{ consensusPoints: string[]; disagreementPoints: string[] }> {
  // Simple extraction from synthesis text
  const consensusPoints: string[] = [];
  const disagreementPoints: string[] = [];

  const lines = synthesisText.split('\n');

  for (const line of lines) {
    if (line.includes('اتفاق') || line.includes('توافق')) {
      consensusPoints.push(line.trim());
    }
    if (line.includes('اختلاف') || line.includes('تعارض')) {
      disagreementPoints.push(line.trim());
    }
  }

  return { consensusPoints, disagreementPoints };
}

/**
 * Calculate agreement score
 */
function calculateAgreementScore(
  args: DebateArgument[],
  consensusPoints: string[]
): number {
  if (args.length === 0) return 0;

  // Base score on confidence similarity and consensus points
  const avgConfidence =
    args.reduce((sum, arg) => sum + arg.confidence, 0) / args.length;

  const consensusRatio = Math.min(1, consensusPoints.length / args.length);

  return (avgConfidence * 0.6) + (consensusRatio * 0.4);
}

/**
 * Parse votes from AI response
 */
function parseVotesFromResponse(
  response: string,
  args: DebateArgument[],
  voterId: string
): Vote[] {
  const votes: Vote[] = [];

  args.forEach((arg, idx) => {
    // Try to find score for this argument
    const scoreMatch = response.match(new RegExp(`${idx + 1}[\\s\\S]{0,50}(\\d+\\.?\\d*)`, 'i'));

    let score = 0.5; // Default
    if (scoreMatch) {
      score = Math.min(1, Math.max(0, parseFloat(scoreMatch[1])));
    }

    votes.push({
      voterId,
      argumentId: arg.id,
      score,
      timestamp: new Date(),
    });
  });

  return votes;
}