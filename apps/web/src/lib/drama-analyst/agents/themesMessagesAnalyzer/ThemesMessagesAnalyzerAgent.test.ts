import { describe, it, expect, beforeEach } from "vitest";
import { ThemesMessagesAnalyzerAgent } from "./ThemesMessagesAnalyzerAgent";
import { TaskType } from "@core/types";

describe("ThemesMessagesAnalyzerAgent", () => {
  let agent: ThemesMessagesAnalyzerAgent;

  beforeEach(() => {
    agent = new ThemesMessagesAnalyzerAgent();
  });

  it("should have correct configuration", () => {
    const config = agent.getConfig();
    expect(config.name).toBeTruthy();
    expect(config.taskType).toBe(TaskType.THEMES_MESSAGES_ANALYZER);
  });

  it("should execute task successfully", async () => {
    const result = await agent.executeTask({
      input: "نص اختباري للتحليل الموضوعي",
      options: { enableRAG: false },
    });
    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
