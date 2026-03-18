import { describe, it, expect, beforeEach } from "vitest";
import { ProducibilityAnalyzerAgent } from "./ProducibilityAnalyzerAgent";
import { TaskType } from "@core/types";

describe("ProducibilityAnalyzerAgent", () => {
  let agent: ProducibilityAnalyzerAgent;

  beforeEach(() => {
    agent = new ProducibilityAnalyzerAgent();
  });

  it("should have correct configuration", () => {
    const config = agent.getConfig();
    expect(config.name).toBeTruthy();
    expect(config.taskType).toBe(TaskType.PRODUCIBILITY_ANALYZER);
  });

  it("should execute task successfully", async () => {
    const result = await agent.executeTask({
      input: "تحليل إنتاجي لمشهد مكلف",
      options: { enableRAG: false },
    });
    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
