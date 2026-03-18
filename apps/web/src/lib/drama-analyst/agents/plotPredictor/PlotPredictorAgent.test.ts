import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlotPredictorAgent } from "./PlotPredictorAgent";
import { StandardAgentInput } from "../shared/standardAgentPattern";
import { TaskType } from "@core/enums";

// Mock geminiService
vi.mock("../../services/geminiService", () => ({
  geminiService: {
    generateContent: vi
      .fn()
      .mockResolvedValue("Mock AI response for plot prediction"),
  },
}));

describe("PlotPredictorAgent", () => {
  let agent: PlotPredictorAgent;

  beforeEach(() => {
    agent = new PlotPredictorAgent();
    vi.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should initialize with correct configuration", () => {
      const config = agent.getConfig();

      expect(config.name).toBe("PlotPredictorAgent");
      expect(config.taskType).toBe(TaskType.PLOT_PREDICTOR);
      expect(config.confidenceFloor).toBe(0.78);
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
    it("should execute plot prediction task successfully", async () => {
      const input: StandardAgentInput = {
        input:
          "تنبأ بمسارات الحبكة المحتملة لقصة تدور حول صراع بين شخصيتين رئيسيتين",
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
          previousStations: {
            analysis: "تحليل أولي للنص",
            characterAnalysis: "تحليل الشخصيات الرئيسية",
          },
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

    it("should include context from previous stations in prompt", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بتطورات الحبكة",
        options: {},
        context: {
          previousStations: {
            analysis: "النص يحتوي على صراع رئيسي",
            characterAnalysis: "الشخصية الرئيسية لديها دوافع معقدة",
            thematicAnalysis: "الثيمات الأساسية: الخيانة والفداء",
          },
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });

    it("should return text-only output without JSON blocks", async () => {
      const input: StandardAgentInput = {
        input: "حلل وتنبأ بمسارات الحبكة",
        options: {
          enableRAG: true,
        },
        context: {},
      };

      const result = await agent.executeTask(input);

      // Ensure output is clean text
      expect(result.text).not.toContain("```json");
      expect(result.text).not.toContain("```");
      expect(result.text).not.toMatch(/\{[^}]*"[^"]*":[^}]*\}/);
    });
  });

  describe("Low Confidence Path", () => {
    it("should trigger debate when confidence is below threshold", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بمسارات معقدة جداً للحبكة مع تحليل عميق",
        options: {
          enableDebate: true,
          confidenceThreshold: 0.95, // High threshold to potentially trigger debate
          maxDebateRounds: 2,
        },
        context: {},
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.confidence).toBeDefined();

      // If confidence is low, notes should indicate additional processing
      if (result.confidence < 0.95) {
        expect(result.notes).toBeDefined();
      }
    });

    it("should handle uncertainty in predictions", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بمسارات الحبكة مع سياق محدود جداً",
        options: {
          enableUncertainty: true,
          confidenceThreshold: 0.7,
        },
        context: {
          previousStations: {},
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);

      // Should include notes about confidence level
      if (result.confidence < 0.7) {
        expect(result.notes).toContain("تحتاج تحقق إضافي");
      }
    });
  });

  describe("Hallucination Detection Path", () => {
    it("should detect and handle unsupported claims", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بمسارات الحبكة بناءً على معلومات غير مذكورة",
        options: {
          enableHallucination: true,
          confidenceThreshold: 0.75,
        },
        context: {
          previousStations: {
            analysis: "تحليل بسيط للنص",
          },
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeDefined();

      // Hallucination detection should influence confidence or notes
      expect(result.metadata).toBeDefined();
    });

    it("should maintain high confidence for well-supported predictions", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بمسارات الحبكة بناءً على السياق المتوفر",
        options: {
          enableHallucination: true,
          enableSelfCritique: true,
          confidenceThreshold: 0.75,
        },
        context: {
          previousStations: {
            analysis: "تحليل شامل للنص مع تفاصيل الحبكة",
            characterAnalysis: "تحليل عميق للشخصيات ودوافعها",
            thematicAnalysis: "استخراج الثيمات الرئيسية والفرعية",
          },
        },
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe("Post-Processing", () => {
    it("should clean JSON blocks from output", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بالحبكة",
        options: {},
        context: {},
      };

      const result = await agent.executeTask(input);

      // Verify all JSON is removed
      expect(result.text).not.toMatch(/```json[\s\S]*?```/);
      expect(result.text).not.toMatch(/```[\s\S]*?```/);
      expect(result.text).not.toMatch(/\{[\s\S]*?"[^"]*"\s*:[\s\S]*?\}/);
    });

    it("should add appropriate notes based on confidence level", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بمسارات الحبكة المحتملة",
        options: {
          confidenceThreshold: 0.75,
        },
        context: {},
      };

      const result = await agent.executeTask(input);

      expect(result.notes).toBeDefined();

      // Notes should reflect confidence level
      if (result.confidence >= 0.85) {
        expect(result.notes).toContain("عالية الثقة");
      } else if (result.confidence >= 0.7) {
        expect(result.notes).toContain("متوسطة الثقة");
      } else {
        expect(result.notes).toContain("استكشافية");
      }
    });
  });

  describe("Error Handling", () => {
    it("should return fallback response on error", async () => {
      // Force an error by passing invalid input
      const input: StandardAgentInput = {
        input: "",
        options: {},
        context: {},
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeLessThanOrEqual(0.5);
      expect(result.metadata?.error).toBeDefined();
    });

    it("should handle missing context gracefully", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بالحبكة",
        options: {},
        context: undefined as any,
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });
  });

  describe("Advanced Options", () => {
    it("should respect all advanced options", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بمسارات الحبكة",
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
        context: {},
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it("should use default options when not provided", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بالحبكة",
        options: undefined as any,
        context: {},
      };

      const result = await agent.executeTask(input);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });
  });

  describe("Integration with Standard Pattern", () => {
    it("should execute full standard pattern pipeline", async () => {
      const input: StandardAgentInput = {
        input: "تنبأ بثلاثة مسارات محتملة للحبكة مع تقييم الاحتمالية والإبداع",
        options: {
          enableRAG: true,
          enableSelfCritique: true,
          enableConstitutional: true,
          enableUncertainty: true,
          enableHallucination: true,
          enableDebate: false,
        },
        context: {
          previousStations: {
            analysis: "القصة تدور حول صراع أخلاقي معقد",
            characterAnalysis: "الشخصيات متعددة الأبعاد",
            thematicAnalysis: "الثيمات: الهوية، الانتماء، الحرية",
          },
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

      // Verify text-only output
      expect(result.text).not.toMatch(/\{.*:.*\}/);
      expect(result.text).not.toContain("```");
    });
  });
});
