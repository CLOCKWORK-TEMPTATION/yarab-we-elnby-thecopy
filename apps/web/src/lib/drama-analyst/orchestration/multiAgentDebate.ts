/**
 * نظام النقاش متعدد الوكلاء
 * Multi-Agent Debate System
 *
 * يسمح لعدة وكلاء بالنقاش والوصول لأفضل حل بشكل تعاوني
 * Based on Multi-Agent Debate research from 2024-2025
 */

import { AgentProposal, DebateResult } from "../core/types";
import { geminiService } from "../services/geminiService";

export class MultiAgentDebateSystem {
  private maxRounds: number;
  private consensusThreshold: number;

  constructor(maxRounds: number = 3, consensusThreshold: number = 0.8) {
    this.maxRounds = maxRounds;
    this.consensusThreshold = consensusThreshold;
  }

  /**
   * إجراء نقاش بين وكلاء متعددين
   * Conduct debate between multiple agents
   */
  async conductDebate(
    task: string,
    context: any,
    participatingAgents: string[]
  ): Promise<DebateResult> {
    console.log(
      `[Debate] Starting debate with ${participatingAgents.length} agents`
    );
    console.log(`[Debate] Max rounds: ${this.maxRounds}`);

    const proposals: AgentProposal[] = [];
    let currentRound = 0;
    let consensus = false;

    // Round 1: Initial proposals
    console.log("[Debate] Round 1: Initial Proposals");
    for (const agentId of participatingAgents) {
      const proposal = await this.generateProposal(
        agentId,
        task,
        context,
        [] // No previous proposals in first round
      );
      proposals.push(proposal);
      console.log(
        `[Debate] ${agentId} proposal confidence: ${(proposal.confidence * 100).toFixed(1)}%`
      );
    }

    // Subsequent rounds: Refinement based on others' proposals
    while (currentRound < this.maxRounds && !consensus) {
      currentRound++;
      console.log(`[Debate] Round ${currentRound + 1}: Refinement`);

      const refinedProposals: AgentProposal[] = [];

      for (const agentId of participatingAgents) {
        const refinedProposal = await this.generateProposal(
          agentId,
          task,
          context,
          proposals // Include all previous proposals
        );
        refinedProposals.push(refinedProposal);
      }

      // Check for consensus
      consensus = this.checkConsensus(refinedProposals);
      proposals.push(...refinedProposals);

      if (consensus) {
        console.log("[Debate] Consensus reached!");
        break;
      }
    }

    // Judge makes final decision
    console.log("[Debate] Judge making final decision...");
    const finalDecision = await this.judgeDecision(task, proposals, context);

    return {
      proposals,
      finalDecision: finalDecision.decision,
      consensus,
      debateRounds: currentRound + 1,
      judgeReasoning: finalDecision.reasoning,
    };
  }

  /**
   * توليد مقترح من وكيل
   * Generate proposal from an agent
   */
  private async generateProposal(
    agentId: string,
    task: string,
    context: any,
    previousProposals: AgentProposal[]
  ): Promise<AgentProposal> {
    let prompt = `
أنت الوكيل المتخصص: ${agentId}

المهمة المطلوبة:
${task}

السياق:
${JSON.stringify(context, null, 2).substring(0, 2000)}
`;

    if (previousProposals.length > 0) {
      prompt += `\n\nمقترحات الوكلاء الآخرين للاطلاع والبناء عليها:\n`;
      previousProposals.forEach((p, i) => {
        prompt += `\n--- مقترح ${i + 1} من الوكيل ${p.agentId} ---\n`;
        prompt += `${p.proposal.substring(0, 500)}\n`;
        prompt += `الثقة: ${(p.confidence * 100).toFixed(1)}%\n`;
      });
      prompt += `\nبناءً على المقترحات السابقة، قدم مقترحك المحسن أو دافع عن مقترحك الأصلي.\n`;
    } else {
      prompt += `\nقدم مقترحك الأولي للمهمة.\n`;
    }

    prompt += `\nأجب بصيغة JSON فقط:\n{
  "proposal": "مقترحك التفصيلي هنا",
  "supportingEvidence": ["دليل 1", "دليل 2", "دليل 3"],
  "confidence": 0.85
}`;

    try {
      const result = await geminiService.generateContent(prompt);
      const parsed = JSON.parse(result);

      return {
        agentId,
        proposal: parsed.proposal || "",
        supportingEvidence: Array.isArray(parsed.supportingEvidence)
          ? parsed.supportingEvidence
          : [],
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      };
    } catch (error) {
      // SECURITY FIX: Pass agentId as separate argument to prevent format string injection
      console.error(
        "[Debate] Error generating proposal for",
        agentId,
        ":",
        error
      );
      return {
        agentId,
        proposal: "خطأ في توليد المقترح",
        supportingEvidence: [],
        confidence: 0,
      };
    }
  }

  /**
   * فحص التوافق بين المقترحات
   * Check consensus among proposals
   */
  private checkConsensus(proposals: AgentProposal[]): boolean {
    if (proposals.length < 2) return false;

    // Calculate average confidence
    const avgConfidence =
      proposals.reduce((sum, p) => sum + p.confidence, 0) / proposals.length;

    // Check if proposals are converging
    const proposalTexts = proposals.map((p) => p.proposal);
    const similarities = this.calculateSimilarities(proposalTexts);
    const avgSimilarity =
      similarities.length > 0
        ? similarities.reduce((a, b) => a + b, 0) / similarities.length
        : 0;

    console.log(
      `[Debate] Consensus check - Confidence: ${(avgConfidence * 100).toFixed(1)}%, Similarity: ${(avgSimilarity * 100).toFixed(1)}%`
    );

    return avgSimilarity >= this.consensusThreshold && avgConfidence >= 0.8;
  }

  /**
   * حساب التشابه بين النصوص
   * Calculate text similarities using Jaccard index
   */
  private calculateSimilarities(texts: string[]): number[] {
    const similarities: number[] = [];

    for (let i = 0; i < texts.length - 1; i++) {
      const text1 = texts[i];
      const text2 = texts[i + 1];
      if (!text1 || !text2) continue;

      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));

      const intersection = new Set([...words1].filter((x) => words2.has(x)));
      const union = new Set([...words1, ...words2]);

      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      similarities.push(similarity);
    }

    return similarities;
  }

  /**
   * قرار الحكم النهائي
   * Judge's final decision
   */
  private async judgeDecision(
    task: string,
    proposals: AgentProposal[],
    context: any
  ): Promise<{ decision: string; reasoning: string }> {
    const judgePrompt = `
أنت حكم محايد ومتخصص في التطوير الدرامي.

المهمة الأصلية:
${task}

المقترحات المقدمة من الوكلاء:
${proposals
  .map(
    (p, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
مقترح ${i + 1} (من ${p.agentId}):
${p.proposal}

الأدلة الداعمة:
${p.supportingEvidence.map((e, j) => `  ${j + 1}. ${e}`).join("\n")}

مستوى ثقة الوكيل: ${(p.confidence * 100).toFixed(1)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  )
  .join("\n")}

السياق:
${JSON.stringify(context, null, 2).substring(0, 1000)}

مهمتك:
1. قيّم جميع المقترحات بموضوعية
2. اختر المقترح الأفضل، أو ادمج أفضل العناصر من كل مقترح
3. قدم قراراً نهائياً محسّناً

أجب بصيغة JSON:
{
  "decision": "القرار النهائي التفصيلي والمحسّن",
  "reasoning": "شرح تفصيلي لسبب اختيار هذا القرار وكيف تم تقييم المقترحات"
}
`;

    try {
      const result = await geminiService.generateContent(judgePrompt);
      const parsed = JSON.parse(result);
      return {
        decision: parsed.decision || "",
        reasoning: parsed.reasoning || "",
      };
    } catch (error) {
      console.error("[Debate] Error in judge decision:", error);
      // Fallback: return the proposal with highest confidence
      const bestProposal = proposals.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      return {
        decision: bestProposal.proposal,
        reasoning: "استخدام المقترح بأعلى مستوى ثقة (خطأ في قرار الحكم)",
      };
    }
  }

  /**
   * تحديث إعدادات النقاش
   * Update debate settings
   */
  setMaxRounds(rounds: number): void {
    this.maxRounds = Math.max(1, Math.min(rounds, 5)); // 1-5 rounds
  }

  setConsensusThreshold(threshold: number): void {
    this.consensusThreshold = Math.max(0.5, Math.min(threshold, 1.0)); // 0.5-1.0
  }
}

// Export singleton instance
export const multiAgentDebate = new MultiAgentDebateSystem();
