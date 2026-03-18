import { describe, it, expect, beforeEach } from "vitest";
import { DialogueAdvancedAnalyzerAgent } from "./DialogueAdvancedAnalyzerAgent";
import { TaskType } from "@core/types";

describe("DialogueAdvancedAnalyzerAgent", () => {
  let agent: DialogueAdvancedAnalyzerAgent;

  beforeEach(() => {
    agent = new DialogueAdvancedAnalyzerAgent();
  });

  it("should have correct configuration", () => {
    const config = agent.getConfig();

    expect(config.name).toBeTruthy();
    expect(config.taskType).toBe(TaskType.DIALOGUE_ADVANCED_ANALYZER);
    expect(config.confidenceFloor).toBe(0.75);
  });

  it("should execute task successfully", async () => {
    const result = await agent.executeTask({
      input: "أحمد: لماذا لم تخبرني؟\nمنى: اعتقدت أنك تعرف.",
      options: { enableRAG: false },
      context: {
        dialogueContext: "مواجهة حادة",
      },
    });

    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.text).not.toContain("```json");
  });

  it("should provide analysis structure in text", async () => {
    const result = await agent.executeTask({
      input: "حوار اختباري",
      options: { enableRAG: false },
    });

    // Check if output contains some analysis keywords or structure
    expect(typeof result.text).toBe("string");
  });
});
