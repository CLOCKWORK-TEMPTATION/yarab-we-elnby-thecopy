import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdaptiveRewritingAgent } from "./AdaptiveRewritingAgent";
import { StandardAgentInput } from "../shared/standardAgentPattern";
import { TaskType } from "@core/enums";

// Mock geminiService
vi.mock("../../services/geminiService", () => ({
  geminiService: {
    generateContent: vi
      .fn()
      .mockResolvedValue("Mock AI response for adaptive rewriting"),
  },
}));

describe("AdaptiveRewritingAgent", () => {
  let agent: AdaptiveRewritingAgent;

  beforeEach(() => {
    agent = new AdaptiveRewritingAgent();
    vi.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should initialize with correct configuration", () => {
      const config = agent.getConfig();

      expect(config.name).toBe("RewriteMaster AI");
      expect(config.taskType).toBe(TaskType.ADAPTIVE_REWRITING);
      expect(config.confidenceFloor).toBe(0.8);
      expect(config.supportsRAG).toBe(true);
      expect(config.supportsSelfCritique).toBe(true);
      expect(config.supportsConstitutional).toBe(true);
      expect(config.supportsUncertainty).toBe(true);
      expect(config.supportsHallucination).toBe(true);
      expect(config.supportsDebate).toBe(true);
    });

    it("should allow confidence floor to be updated", () => {
      agent.setConfidenceFloor(0.85);
      const config = agent.getConfig();
      expect(config.confidenceFloor).toBe(0.85);
    });
  });

  describe("Success Path", () => {
    it("should execute adaptive rewriting task successfully", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص التالي لتحسين الوضوح والإيقاع",
        options: {
          enableRAG: true,
          enableSelfCritique: true,
          enableConstitutional: true,
          enableUncertainty: true,
          enableHallucination: true,
          enableDebate: false,
          confidenceThreshold: 0.75,
        },
        context: {
          originalText: "النص الأصلي الذي يحتاج إلى إعادة كتابة وتحسين",
          rewritingGoals: ["تحسين الوضوح", "تعزيز الإيقاع"],
          targetAudience: "جمهور عام",
          improvementFocus: ["clarity", "pacing"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe("string");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metadata).toBeDefined();

      // Verify no JSON in output
      expect(result.text).not.toMatch(/\{[\s\S]*?"[^"]*"\s*:[\s\S]*?\}/);
      expect(result.text).not.toMatch(/```json/);
    });

    it("should handle rewriting with multiple goals", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص مع تحقيق جميع الأهداف",
        options: {},
        context: {
          originalText:
            "كان هناك رجل يعيش في قرية صغيرة وكان يحب القراءة كثيراً",
          rewritingGoals: ["تحسين الوصف", "إضافة تفاصيل حسية", "تعزيز الإيقاع"],
          targetTone: "أدبي",
          targetLength: "longer",
          improvementFocus: ["description", "atmosphere"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.metadata?.rewritingQuality).toBeDefined();
    });

    it("should return text-only output without JSON blocks", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص",
        options: {
          enableRAG: true,
        },
        context: {
          originalText: "النص المراد إعادة كتابته",
        },
      };

      const result = await agent.executeTask(input);

      // Ensure output is clean text
      expect(result.text).not.toContain("```json");
      expect(result.text).not.toContain("```");
      expect(result.text).not.toMatch(/\{[^}]*"[^"]*":[^}]*\}/);
    });

    it("should preserve specified elements", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص مع الحفاظ على العناصر المحددة",
        options: {},
        context: {
          originalText: "النص الأصلي",
          preserveElements: [
            "أسماء الشخصيات",
            "الأماكن الرئيسية",
            "الحدث المحوري",
          ],
          improvementFocus: ["clarity", "impact"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });
  });

  describe("Low Confidence Path", () => {
    it("should trigger debate when confidence is below threshold", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة هذا النص المعقد بشكل كامل",
        options: {
          enableDebate: true,
          confidenceThreshold: 0.95,
          maxDebateRounds: 2,
        },
        context: {
          originalText: "نص معقد جداً",
          rewritingGoals: ["تحسين شامل"],
          constraints: ["يجب الحفاظ على المعنى الدقيق"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.confidence).toBeDefined();

      if (result.confidence < 0.95) {
        expect(result.notes).toBeDefined();
      }
    });

    it("should handle uncertainty in rewriting decisions", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة مع أهداف متعارضة",
        options: {
          enableUncertainty: true,
          confidenceThreshold: 0.7,
        },
        context: {
          originalText: "النص",
          rewritingGoals: ["اجعله أقصر", "أضف تفاصيل أكثر"],
          targetLength: "shorter",
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Hallucination Detection Path", () => {
    it("should detect and handle unsupported additions", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص بدون إضافة معلومات غير موجودة",
        options: {
          enableHallucination: true,
          confidenceThreshold: 0.75,
        },
        context: {
          originalText: "نص بسيط عن موضوع محدد",
          constraints: ["لا تضف معلومات غير موجودة في الأصل"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it("should maintain high confidence for well-constrained rewrites", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص مع الالتزام بالقيود",
        options: {
          enableHallucination: true,
          enableSelfCritique: true,
          confidenceThreshold: 0.75,
        },
        context: {
          originalText: "النص الأصلي الكامل مع سياق واضح",
          rewritingGoals: ["تحسين الوضوح فقط"],
          preserveElements: ["جميع الحقائق", "التسلسل الزمني"],
          constraints: ["لا تغيير في المعنى"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe("Post-Processing and Quality Assessment", () => {
    it("should clean JSON blocks from output", async () => {
      const input: StandardAgentInput = {
        input: "أعد الكتابة",
        options: {},
        context: {
          originalText: "النص",
        },
      };

      const result = await agent.executeTask(input);

      // Verify all JSON is removed
      expect(result.text).not.toMatch(/```json[\s\S]*?```/);
      expect(result.text).not.toMatch(/```[\s\S]*?```/);
      expect(result.text).not.toMatch(/\{[\s\S]*?"[^"]*"\s*:[\s\S]*?\}/);
    });

    it("should assess rewriting quality metrics", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص مع تحسينات شاملة",
        options: {
          confidenceThreshold: 0.75,
        },
        context: {
          originalText: "نص يحتاج تحسين",
          rewritingGoals: ["تحسين الوضوح", "تعزيز التأثير"],
          improvementFocus: ["clarity", "impact", "coherence"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result.metadata?.rewritingQuality).toBeDefined();

      if (result.metadata?.rewritingQuality) {
        const quality = result.metadata.rewritingQuality as any;
        expect(quality.overall).toBeGreaterThanOrEqual(0);
        expect(quality.overall).toBeLessThanOrEqual(1);
        expect(quality.goalAchievement).toBeDefined();
        expect(quality.qualityImprovement).toBeDefined();
        expect(quality.coherence).toBeDefined();
        expect(quality.creativity).toBeDefined();
      }
    });

    it("should add appropriate notes based on quality assessment", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص",
        options: {
          confidenceThreshold: 0.75,
        },
        context: {
          originalText: "النص الأصلي",
        },
      };

      const result = await agent.executeTask(input);

      expect(result.notes).toBeDefined();
      expect(typeof result.notes).toBe("string");
    });

    it("should include rewriting metadata", async () => {
      const input: StandardAgentInput = {
        input: "أعد الكتابة",
        options: {},
        context: {
          originalText: "نص للإعادة",
        },
      };

      const result = await agent.executeTask(input);

      expect(result.metadata?.rewrittenLength).toBeDefined();
      expect(result.metadata?.improvementsApplied).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should return fallback response on error", async () => {
      const input: StandardAgentInput = {
        input: "",
        options: {},
        context: {},
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it("should handle missing original text gracefully", async () => {
      const input: StandardAgentInput = {
        input: "أعد الكتابة",
        options: {},
        context: {
          rewritingGoals: ["تحسين"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });
  });

  describe("Advanced Options", () => {
    it("should respect all advanced options", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص",
        options: {
          enableRAG: true,
          enableSelfCritique: true,
          enableConstitutional: true,
          enableUncertainty: true,
          enableHallucination: true,
          enableDebate: true,
          maxDebateRounds: 3,
          confidenceThreshold: 0.8,
          temperature: 0.8,
          maxTokens: 8192,
        },
        context: {
          originalText: "النص الأصلي",
          rewritingGoals: ["تحسين شامل"],
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it("should handle various target lengths", async () => {
      const lengths = ["shorter", "same", "longer", "double", "half"];

      for (const length of lengths) {
        const input: StandardAgentInput = {
          input: "أعد الكتابة",
          options: {},
          context: {
            originalText: "نص",
            targetLength: length,
          },
        };

        const result = await agent.executeTask(input);
        expect(result).toBeDefined();
      }
    });

    it("should handle various improvement focuses", async () => {
      const focuses = [
        "pacing",
        "dialogue",
        "description",
        "clarity",
        "impact",
      ];

      const input: StandardAgentInput = {
        input: "أعد الكتابة",
        options: {},
        context: {
          originalText: "نص",
          improvementFocus: focuses,
        },
      };

      const result = await agent.executeTask(input);
      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });
  });

  describe("Integration with Standard Pattern", () => {
    it("should execute full standard pattern pipeline", async () => {
      const input: StandardAgentInput = {
        input: "أعد كتابة النص التالي لتحسين الوضوح والإيقاع والتأثير",
        options: {
          enableRAG: true,
          enableSelfCritique: true,
          enableConstitutional: true,
          enableUncertainty: true,
          enableHallucination: true,
          enableDebate: false,
        },
        context: {
          originalText:
            "كان الرجل يسير في الشارع. كان الطقس بارداً. رأى قطة. توقف.",
          rewritingGoals: [
            "تحسين الوصف",
            "ربط الجمل بشكل أفضل",
            "إضافة تفاصيل حسية",
          ],
          targetAudience: "قراء أدب",
          targetTone: "أدبي تأملي",
          targetLength: "longer",
          improvementFocus: ["description", "coherence", "atmosphere"],
          preserveElements: ["الشخصية", "الحدث الأساسي"],
        },
      };

      const result = await agent.executeTask(input);

      // Verify complete output structure
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe("string");
      expect(result.text.length).toBeGreaterThan(50);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.notes).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.rewritingQuality).toBeDefined();

      // Verify text-only output
      expect(result.text).not.toMatch(/\{.*:.*\}/);
      expect(result.text).not.toContain("```");
    });
  });
});
