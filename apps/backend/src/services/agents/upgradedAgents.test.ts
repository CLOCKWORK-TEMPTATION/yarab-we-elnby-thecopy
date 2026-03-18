import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskType } from "@core/enums";
import {
  executeAgentTask,
  isAgentUpgraded,
  getAgentConfig,
  getUpgradedAgents,
  batchExecuteAgentTasks,
  getAgentStatistics,
  completionAgent,
  creativeAgent,
  characterVoiceAgent,
} from "./upgradedAgents";
import { StandardAgentInput } from "./shared/standardAgentPattern";

// Mock the geminiService
vi.mock("../services/geminiService", () => ({
  geminiService: {
    generateContent: vi.fn().mockResolvedValue("نص تجريبي من النموذج"),
  },
}));

// Mock the standard pattern execution
vi.mock("./shared/standardAgentPattern", () => ({
  executeStandardAgentPattern: vi.fn().mockResolvedValue({
    text: "نص ناتج من النمط القياسي",
    confidence: 0.85,
    notes: "تم التنفيذ بنجاح",
    metadata: {
      processingTime: 1000,
      tokensUsed: 500,
      modelUsed: "gemini-2.5-flash",
      timestamp: new Date().toISOString(),
    },
  }),
}));

describe("Upgraded Agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Agent Registration", () => {
    it("should have completion agent registered", () => {
      expect(isAgentUpgraded(TaskType.COMPLETION)).toBe(true);
    });

    it("should have creative agent registered", () => {
      expect(isAgentUpgraded(TaskType.CREATIVE_DEVELOPMENT)).toBe(true);
    });

    it("should have character voice agent registered", () => {
      expect(isAgentUpgraded(TaskType.CHARACTER_VOICE)).toBe(true);
    });

    it("should return false for non-upgraded agents", () => {
      expect(isAgentUpgraded(TaskType.ANALYSIS)).toBe(false);
    });

    it("should return list of upgraded agents", () => {
      const upgraded = getUpgradedAgents();
      expect(upgraded).toContain(TaskType.COMPLETION);
      expect(upgraded).toContain(TaskType.CREATIVE_DEVELOPMENT);
      expect(upgraded).toContain(TaskType.CHARACTER_VOICE);
      expect(upgraded.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Agent Configuration", () => {
    it("should get config for completion agent", () => {
      const config = getAgentConfig(TaskType.COMPLETION);
      expect(config).toBeDefined();
      expect(config?.name).toBe("NarrativeContinuum AI");
      expect(config?.taskType).toBe(TaskType.COMPLETION);
      expect(config?.supportsRAG).toBe(true);
    });

    it("should get config for creative agent", () => {
      const config = getAgentConfig(TaskType.CREATIVE_DEVELOPMENT);
      expect(config).toBeDefined();
      expect(config?.name).toBe("CreativeVision AI");
      expect(config?.taskType).toBe(TaskType.CREATIVE_DEVELOPMENT);
    });

    it("should return null for non-upgraded agent", () => {
      const config = getAgentConfig(TaskType.ANALYSIS);
      expect(config).toBeNull();
    });
  });

  describe("Agent Execution", () => {
    const testInput: StandardAgentInput = {
      input: "نص تجريبي للمعالجة",
      options: {
        enableRAG: true,
        enableSelfCritique: true,
        enableConstitutional: true,
        enableUncertainty: false,
        enableHallucination: false,
        enableDebate: false,
      },
      context: {
        originalText: "النص الأصلي",
        analysisReport: { summary: "تقرير التحليل" },
      },
    };

    it("should execute completion agent task successfully", async () => {
      const result = await executeAgentTask(TaskType.COMPLETION, testInput);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe("string");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.notes).toBeTruthy();
      expect(result.metadata).toBeDefined();
    });

    it("should execute creative agent task successfully", async () => {
      const result = await executeAgentTask(
        TaskType.CREATIVE_DEVELOPMENT,
        testInput
      );

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe("string");
      expect(result.confidence).toBeDefined();
    });

    it("should execute character voice agent task successfully", async () => {
      const voiceInput: StandardAgentInput = {
        ...testInput,
        context: {
          ...testInput.context,
          characterProfile: {
            name: "أحمد",
            personality: "هادئ ومتفكر",
            background: "مهندس متقاعد",
          },
          emotionalState: "neutral",
        },
      };

      const result = await executeAgentTask(
        TaskType.CHARACTER_VOICE,
        voiceInput
      );

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.metadata?.voiceConsistency).toBeDefined();
    });

    it("should return fallback for non-upgraded agent", async () => {
      const result = await executeAgentTask(TaskType.ANALYSIS, testInput);

      expect(result).toBeDefined();
      expect(result.confidence).toBe(0);
      expect(result.text).toContain("لم يتم ترقيته بعد");
    });

    it("should handle execution errors gracefully", async () => {
      // Mock an error
      vi.spyOn(completionAgent, "executeTask").mockRejectedValueOnce(
        new Error("Test error")
      );

      const result = await executeAgentTask(TaskType.COMPLETION, testInput);

      expect(result).toBeDefined();
      expect(result.confidence).toBe(0);
      expect(result.text).toContain("حدث خطأ");
      expect(result.metadata?.error).toBe(true);
    });
  });

  describe("Batch Execution", () => {
    it("should execute multiple tasks in batch", async () => {
      const tasks = [
        {
          taskType: TaskType.COMPLETION,
          input: {
            input: "مهمة 1",
            options: {},
            context: {},
          },
        },
        {
          taskType: TaskType.CREATIVE_DEVELOPMENT,
          input: {
            input: "مهمة 2",
            options: {},
            context: {},
          },
        },
      ];

      const results = await batchExecuteAgentTasks(tasks);

      expect(results).toHaveLength(2);
      expect(results[0].text).toBeTruthy();
      expect(results[1].text).toBeTruthy();
    });

    it("should handle partial failures in batch execution", async () => {
      // Mock one success and one failure
      vi.spyOn(completionAgent, "executeTask")
        .mockResolvedValueOnce({
          text: "نجح",
          confidence: 0.8,
          notes: "نجح",
          metadata: {
            processingTime: 100,
            tokensUsed: 50,
            modelUsed: "test",
            timestamp: new Date().toISOString(),
          },
        })
        .mockRejectedValueOnce(new Error("فشل"));

      const tasks = [
        {
          taskType: TaskType.COMPLETION,
          input: { input: "test1", options: {}, context: {} },
        },
        {
          taskType: TaskType.COMPLETION,
          input: { input: "test2", options: {}, context: {} },
        },
      ];

      const results = await batchExecuteAgentTasks(tasks);

      expect(results).toHaveLength(2);
      expect(results[0].text).toBe("نجح");
      expect(results[1].text).toContain("فشل تنفيذ المهمة");
      expect(results[1].confidence).toBe(0);
    });
  });

  describe("Agent Statistics", () => {
    it("should return correct statistics", () => {
      const stats = getAgentStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.upgraded).toBe(3); // We have 3 upgraded agents
      expect(stats.remaining).toBe(stats.total - stats.upgraded);
      expect(stats.percentage).toBe(
        Math.round((stats.upgraded / stats.total) * 100)
      );
      expect(stats.upgradedAgents).toHaveLength(3);
      expect(stats.remainingAgents.length).toBeGreaterThan(0);
    });
  });

  describe("Text-Only Output", () => {
    it("should never return JSON in output", async () => {
      const result = await executeAgentTask(TaskType.COMPLETION, {
        input: "اختبار",
        options: {},
        context: {},
      });

      // Check that output doesn't contain JSON artifacts
      expect(result.text).not.toContain("```json");
      expect(result.text).not.toContain('"result":');
      expect(result.text).not.toContain('"confidence":');

      // Text should be plain Arabic text
      expect(typeof result.text).toBe("string");
    });
  });

  describe("Standard Pattern Integration", () => {
    it("should apply all enhancement options when enabled", async () => {
      const input: StandardAgentInput = {
        input: "نص للمعالجة",
        options: {
          enableRAG: true,
          enableSelfCritique: true,
          enableConstitutional: true,
          enableUncertainty: true,
          enableHallucination: true,
          enableDebate: true,
          maxDebateRounds: 3,
          confidenceThreshold: 0.7,
        },
        context: {
          originalText: "النص الأصلي الطويل...",
          analysisReport: { findings: "نتائج التحليل" },
        },
      };

      const result = await executeAgentTask(
        TaskType.CREATIVE_DEVELOPMENT,
        input
      );

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });

    it("should respect confidence floor settings", async () => {
      // Set a high confidence floor
      completionAgent.setConfidenceFloor(0.9);

      const result = await executeAgentTask(TaskType.COMPLETION, {
        input: "نص",
        options: { confidenceThreshold: 0.9 },
        context: {},
      });

      expect(result).toBeDefined();
      // The confidence floor should influence the output
      expect(completionAgent.getConfig().confidenceFloor).toBe(0.9);
    });
  });

  describe("Fallback Handling", () => {
    it("should provide graceful fallback on critical failure", async () => {
      // Mock complete failure
      vi.spyOn(completionAgent, "executeTask").mockImplementationOnce(() => {
        throw new Error("Critical failure");
      });

      const result = await executeAgentTask(TaskType.COMPLETION, {
        input: "test",
        options: {},
        context: {},
      });

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.text).not.toBe(""); // Should have fallback text
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("Critical failure");
    });
  });
});

describe("Individual Agent Tests", () => {
  describe("CompletionAgent", () => {
    it("should handle completion scope correctly", async () => {
      const result = await completionAgent.executeTask({
        input: "أكمل هذه القصة",
        options: {},
        context: {
          originalText: "كان يا ما كان...",
          completionScope: "paragraph",
        },
      });

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.metadata).toBeDefined();
    });

    it("should handle enhancements properly", async () => {
      const result = await completionAgent.executeTask({
        input: "أكمل",
        options: {},
        context: {
          originalText: "النص",
          enhancements: ["style_fingerprint", "character_voice"],
        },
      });

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
    });
  });

  describe("CreativeAgent", () => {
    it("should handle development focus correctly", async () => {
      const result = await creativeAgent.executeTask({
        input: "طور هذا النص",
        options: {},
        context: {
          originalText: "النص الأصلي",
          developmentFocus: "plot",
          goals: ["تعزيز الحبكة", "إضافة تشويق"],
        },
      });

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.metadata?.creativityScore).toBeDefined();
      expect(result.metadata?.practicalityScore).toBeDefined();
    });
  });

  describe("CharacterVoiceAgent", () => {
    it("should generate character-appropriate dialogue", async () => {
      const result = await characterVoiceAgent.executeTask({
        input: "اكتب حواراً للشخصية",
        options: {},
        context: {
          characterProfile: {
            name: "فاطمة",
            age: 35,
            personality: "قوية وحازمة",
            speechPattern: "رسمي ومباشر",
          },
          sceneContext: "اجتماع عمل مهم",
          emotionalState: "confident",
        },
      });

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.metadata?.voiceConsistency).toBeGreaterThan(0);
      expect(result.metadata?.naturality).toBeGreaterThan(0);
      expect(result.metadata?.dialogueType).toBeDefined();
    });
  });
});
