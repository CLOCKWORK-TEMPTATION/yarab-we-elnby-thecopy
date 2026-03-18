import { describe, it, expect } from "vitest";
import { TaskType, TaskCategory } from "./enums";

describe("Enums", () => {
  describe("TaskType", () => {
    it("should have ANALYSIS task type", () => {
      expect(TaskType.ANALYSIS).toBe("analysis");
    });

    it("should have CREATIVE task type", () => {
      expect(TaskType.CREATIVE).toBe("creative");
    });

    it("should have INTEGRATED task type", () => {
      expect(TaskType.INTEGRATED).toBe("integrated");
    });

    it("should have COMPLETION task type", () => {
      expect(TaskType.COMPLETION).toBe("completion");
    });

    it("should have RHYTHM_MAPPING task type", () => {
      expect(TaskType.RHYTHM_MAPPING).toBe("rhythm_mapping");
    });

    it("should have CHARACTER_NETWORK task type", () => {
      expect(TaskType.CHARACTER_NETWORK).toBe("character_network");
    });

    it("should have DIALOGUE_FORENSICS task type", () => {
      expect(TaskType.DIALOGUE_FORENSICS).toBe("dialogue_forensics");
    });

    it("should have THEMATIC_MINING task type", () => {
      expect(TaskType.THEMATIC_MINING).toBe("thematic_mining");
    });

    it("should have STYLE_FINGERPRINT task type", () => {
      expect(TaskType.STYLE_FINGERPRINT).toBe("style_fingerprint");
    });

    it("should have CONFLICT_DYNAMICS task type", () => {
      expect(TaskType.CONFLICT_DYNAMICS).toBe("conflict_dynamics");
    });

    it("should have ADAPTIVE_REWRITING task type", () => {
      expect(TaskType.ADAPTIVE_REWRITING).toBe("adaptive_rewriting");
    });

    it("should have SCENE_GENERATOR task type", () => {
      expect(TaskType.SCENE_GENERATOR).toBe("scene_generator");
    });

    it("should have CHARACTER_VOICE task type", () => {
      expect(TaskType.CHARACTER_VOICE).toBe("character_voice");
    });

    it("should have WORLD_BUILDER task type", () => {
      expect(TaskType.WORLD_BUILDER).toBe("world_builder");
    });

    it("should have PLOT_PREDICTOR task type", () => {
      expect(TaskType.PLOT_PREDICTOR).toBe("plot_predictor");
    });

    it("should have TENSION_OPTIMIZER task type", () => {
      expect(TaskType.TENSION_OPTIMIZER).toBe("tension_optimizer");
    });

    it("should have AUDIENCE_RESONANCE task type", () => {
      expect(TaskType.AUDIENCE_RESONANCE).toBe("audience_resonance");
    });

    it("should have PLATFORM_ADAPTER task type", () => {
      expect(TaskType.PLATFORM_ADAPTER).toBe("platform_adapter");
    });

    it("should have advanced module task types", () => {
      expect(TaskType.CHARACTER_DEEP_ANALYZER).toBe("character_deep_analyzer");
      expect(TaskType.DIALOGUE_ADVANCED_ANALYZER).toBe(
        "dialogue_advanced_analyzer"
      );
      expect(TaskType.VISUAL_CINEMATIC_ANALYZER).toBe(
        "visual_cinematic_analyzer"
      );
      expect(TaskType.THEMES_MESSAGES_ANALYZER).toBe(
        "themes_messages_analyzer"
      );
      expect(TaskType.CULTURAL_HISTORICAL_ANALYZER).toBe(
        "cultural_historical_analyzer"
      );
      expect(TaskType.PRODUCIBILITY_ANALYZER).toBe("producibility_analyzer");
      expect(TaskType.TARGET_AUDIENCE_ANALYZER).toBe(
        "target_audience_analyzer"
      );
      expect(TaskType.LITERARY_QUALITY_ANALYZER).toBe(
        "literary_quality_analyzer"
      );
      expect(TaskType.RECOMMENDATIONS_GENERATOR).toBe(
        "recommendations_generator"
      );
    });
  });

  describe("TaskCategory", () => {
    it("should have CORE category", () => {
      expect(TaskCategory.CORE).toBe("المهام الأساسية");
    });

    it("should have ANALYSIS category", () => {
      expect(TaskCategory.ANALYSIS).toBe("التحليل");
    });

    it("should have CREATIVE category", () => {
      expect(TaskCategory.CREATIVE).toBe("الإبداع");
    });

    it("should have PREDICTIVE category", () => {
      expect(TaskCategory.PREDICTIVE).toBe("التنبؤ");
    });

    it("should have ADVANCED_MODULES category", () => {
      expect(TaskCategory.ADVANCED_MODULES).toBe("الوحدات المتقدمة");
    });

    it("should have all categories as Arabic strings", () => {
      const categories = Object.values(TaskCategory);

      categories.forEach((category) => {
        expect(typeof category).toBe("string");
        expect(category.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Type Safety", () => {
    it("should allow valid TaskType values", () => {
      const task: TaskType = TaskType.ANALYSIS;
      expect(task).toBe("analysis");
    });

    it("should allow valid TaskCategory values", () => {
      const category: TaskCategory = TaskCategory.CORE;
      expect(category).toBe("المهام الأساسية");
    });

    it("should have unique task type values", () => {
      const taskTypes = Object.values(TaskType);
      const uniqueTypes = new Set(taskTypes);

      expect(uniqueTypes.size).toBe(taskTypes.length);
    });

    it("should have unique category values", () => {
      const categories = Object.values(TaskCategory);
      const uniqueCategories = new Set(categories);

      expect(uniqueCategories.size).toBe(categories.length);
    });
  });
});
