import { describe, it, expect, vi } from "vitest";
import { buildPrompt } from "./promptBuilder";
import { AIRequest } from "@core/types";
import { TaskType } from "@core/enums";

// Mock the orchestration module
vi.mock("./orchestration", () => ({
  aiAgentOrchestra: {
    getAgentConfig: vi.fn(),
  },
}));

describe("Prompt Builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildPrompt", () => {
    it("should build prompt for analysis task", () => {
      const request: AIRequest = {
        agent: TaskType.ANALYSIS,
        files: [
          {
            name: "test.txt",
            content: "This is a test dramatic text.",
            type: "text",
            size: 100,
          },
        ],
      };

      const prompt = buildPrompt(request);

      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain("تحليل");
    });

    it("should handle multiple files", () => {
      const request: AIRequest = {
        agent: TaskType.CREATIVE,
        files: [
          {
            name: "file1.txt",
            content: "First file content",
            type: "text",
            size: 100,
          },
          {
            name: "file2.txt",
            content: "Second file content",
            type: "text",
            size: 200,
          },
        ],
      };

      const prompt = buildPrompt(request);

      expect(prompt).toContain("إبداع");
    });

    it("should handle completion tasks with parameters", () => {
      const request: AIRequest = {
        agent: TaskType.COMPLETION,
        files: [
          {
            name: "script.txt",
            content: "Incomplete script...",
            type: "text",
            size: 100,
          },
        ],
        parameters: {
          completionScope: "full",
          style: "formal",
        },
      };

      const prompt = buildPrompt(request);

      expect(prompt).toContain("استكمال");
    });

    it("should handle creative tasks", () => {
      const request: AIRequest = {
        agent: TaskType.CREATIVE,
        files: [
          {
            name: "story.txt",
            content: "A dramatic story...",
            type: "text",
            size: 150,
          },
        ],
      };

      const prompt = buildPrompt(request);

      expect(prompt).toContain("إبداع");
    });

    it("should handle integrated tasks", () => {
      const request: AIRequest = {
        agent: TaskType.INTEGRATED,
        files: [
          {
            name: "play.txt",
            content: "A complete play...",
            type: "text",
            size: 200,
          },
        ],
      };

      const prompt = buildPrompt(request);

      expect(prompt).toContain("متكامل");
    });

    it("should handle tasks with no files gracefully", () => {
      const request: AIRequest = {
        agent: TaskType.ANALYSIS,
        files: [],
      };

      const prompt = buildPrompt(request);

      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });

    it("should handle tasks with parameters", () => {
      const request: AIRequest = {
        agent: TaskType.ANALYSIS,
        files: [
          {
            name: "test.txt",
            content: "Test content",
            type: "text",
            size: 100,
          },
        ],
        parameters: {
          style: "formal",
        },
      };

      const prompt = buildPrompt(request);

      expect(prompt).toContain("تحليل");
      expect(typeof prompt).toBe("string");
    });
  });
});
