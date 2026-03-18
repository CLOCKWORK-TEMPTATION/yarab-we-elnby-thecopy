import { describe, it, expect, beforeEach } from "vitest";
import { VisualCinematicAnalyzerAgent } from "./VisualCinematicAnalyzerAgent";
import { TaskType } from "@core/types";

describe("VisualCinematicAnalyzerAgent", () => {
  let agent: VisualCinematicAnalyzerAgent;

  beforeEach(() => {
    agent = new VisualCinematicAnalyzerAgent();
  });

  it("should have correct configuration", () => {
    const config = agent.getConfig();
    expect(config.name).toBeTruthy();
    expect(config.taskType).toBe(TaskType.VISUAL_CINEMATIC_ANALYZER);
  });

  it("should execute task successfully", async () => {
    const result = await agent.executeTask({
      input: "وصف مشهد بصري",
      options: { enableRAG: false },
    });
    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
