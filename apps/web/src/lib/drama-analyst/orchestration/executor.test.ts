import { describe, it, expect, vi, beforeEach } from "vitest";
import { prepareFiles, submitTask } from "./executor";
import { readFiles } from "@services/fileReaderService";
import { callModel } from "@services/apiService";
import { AIRequest, ProcessedFile } from "@core/types";

// Mock dependencies
vi.mock("@services/fileReaderService");
vi.mock("@services/apiService");

const mockReadFiles = vi.mocked(readFiles);
const mockCallModel = vi.mocked(callModel);

describe("Executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("prepareFiles", () => {
    it("should handle empty file list", async () => {
      const result = await prepareFiles({ files: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NO_FILES");
      }
    });

    it("should handle oversized files", async () => {
      const oversizedFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });
      Object.defineProperty(oversizedFile, "size", { value: 21 * 1024 * 1024 });

      const result = await prepareFiles({ files: [oversizedFile] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FILE_TOO_LARGE");
        expect(result.error.message).toContain("20MB");
      }
    });

    it("should process files successfully", async () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      Object.defineProperty(file, "size", { value: 100 });

      const mockProcessedFiles: ProcessedFile[] = [
        {
          name: "test.txt",
          content: "content",
          type: "text",
          size: 100,
        },
      ];

      mockReadFiles.mockResolvedValueOnce({
        ok: true,
        value: mockProcessedFiles,
      });

      const result = await prepareFiles({ files: [file] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockProcessedFiles);
      }
      expect(mockReadFiles).toHaveBeenCalledWith([file]);
    });

    it("should handle file processing errors", async () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      Object.defineProperty(file, "size", { value: 100 });

      mockReadFiles.mockResolvedValueOnce({
        ok: false,
        error: {
          code: "FILE_READ_ERROR",
          message: "Failed to read file",
          cause: new Error("Read error"),
        },
      });

      const result = await prepareFiles({ files: [file] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FILE_READ_ERROR");
      }
    });

    it("should handle multiple files", async () => {
      const file1 = new File(["content1"], "test1.txt", { type: "text/plain" });
      const file2 = new File(["content2"], "test2.txt", { type: "text/plain" });

      Object.defineProperty(file1, "size", { value: 100 });
      Object.defineProperty(file2, "size", { value: 200 });

      const mockProcessedFiles: ProcessedFile[] = [
        { name: "test1.txt", content: "content1", type: "text", size: 100 },
        { name: "test2.txt", content: "content2", type: "text", size: 200 },
      ];

      mockReadFiles.mockResolvedValueOnce({
        ok: true,
        value: mockProcessedFiles,
      });

      const result = await prepareFiles({ files: [file1, file2] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe("submitTask", () => {
    const mockRequest: AIRequest = {
      agent: "analysis",
      files: [
        {
          name: "test.txt",
          content: "test content",
          type: "text",
          size: 100,
        },
      ],
    };

    it("should handle empty files list", async () => {
      const request = { ...mockRequest, files: [] };

      const result = await submitTask(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NO_FILES");
      }
    });

    it("should handle undefined files", async () => {
      const request = { ...mockRequest, files: undefined as any };

      const result = await submitTask(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NO_FILES");
      }
    });

    it("should submit task successfully", async () => {
      mockCallModel.mockResolvedValueOnce({
        ok: true,
        value: {
          agent: "analysis",
          raw: "analysis result",
          meta: {
            provider: "gemini",
            model: "gemini-1.5-flash",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const result = await submitTask(mockRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.agent).toBe("analysis");
        expect(result.value.raw).toBe("analysis result");
      }
      expect(mockCallModel).toHaveBeenCalledWith(mockRequest);
    });

    it("should handle API errors", async () => {
      mockCallModel.mockResolvedValueOnce({
        ok: false,
        error: {
          code: "API_ERROR",
          message: "API call failed",
          cause: new Error("Network error"),
        },
      });

      const result = await submitTask(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("API_ERROR");
      }
    });

    it("should handle different agents", async () => {
      const creativeRequest = { ...mockRequest, agent: "creative" };

      mockCallModel.mockResolvedValueOnce({
        ok: true,
        value: {
          agent: "creative",
          raw: "creative result",
          meta: {
            provider: "gemini",
            model: "gemini-1.5-flash",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const result = await submitTask(creativeRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.agent).toBe("creative");
      }
    });

    it("should handle multiple files", async () => {
      const multiFileRequest: AIRequest = {
        agent: "analysis",
        files: [
          { name: "test1.txt", content: "content1", type: "text", size: 100 },
          { name: "test2.txt", content: "content2", type: "text", size: 200 },
        ],
      };

      mockCallModel.mockResolvedValueOnce({
        ok: true,
        value: {
          agent: "analysis",
          raw: "multi-file analysis result",
          meta: {
            provider: "gemini",
            model: "gemini-1.5-flash",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const result = await submitTask(multiFileRequest);

      expect(result.ok).toBe(true);
      expect(mockCallModel).toHaveBeenCalledWith(multiFileRequest);
    });

    it("should handle requests with parameters", async () => {
      const requestWithParams: AIRequest = {
        ...mockRequest,
        parameters: {
          completionScope: "full",
          style: "formal",
        },
      };

      mockCallModel.mockResolvedValueOnce({
        ok: true,
        value: {
          agent: "analysis",
          raw: "parameterized result",
          meta: {
            provider: "gemini",
            model: "gemini-1.5-flash",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const result = await submitTask(requestWithParams);

      expect(result.ok).toBe(true);
      expect(mockCallModel).toHaveBeenCalledWith(requestWithParams);
    });
  });
});
