import { describe, it, expect } from "vitest";
import { sanitization } from "./sanitizationService";

describe("SanitizationService", () => {
  describe("sanitizeHTML", () => {
    it("should remove script tags", () => {
      const malicious = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitization.html(malicious);
      expect(result).toBe("<p>Safe content</p>");
    });

    it("should remove iframe tags", () => {
      const malicious =
        '<iframe src="javascript:alert(1)"></iframe><p>Safe</p>';
      const result = sanitization.html(malicious);
      expect(result).toBe("<p>Safe</p>");
    });

    it("should remove event handlers", () => {
      const malicious = '<div onclick="alert(1)">Click me</div>';
      const result = sanitization.html(malicious);
      expect(result).toBe("<div >Click me</div>");
    });

    it("should remove javascript: protocol", () => {
      const malicious = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitization.html(malicious);
      expect(result).toBe('<a href="alert(1)">Link</a>');
    });
  });

  describe("sanitizeText", () => {
    it("should escape HTML entities", () => {
      const text = '<script>alert("xss")</script>';
      const result = sanitization.text(text);
      expect(result).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
      );
    });

    it("should handle empty input", () => {
      expect(sanitization.text("")).toBe("");
      expect(sanitization.text(null as any)).toBe("");
      expect(sanitization.text(undefined as any)).toBe("");
    });
  });

  describe("sanitizeFileName", () => {
    it("should remove dangerous characters", () => {
      const dangerous = "../../../etc/passwd<script>";
      const result = sanitization.fileName(dangerous);
      expect(result).toBe("______etc_passwd_script_");
    });

    it("should prevent directory traversal", () => {
      const traversal = "../../../../secret.txt";
      const result = sanitization.fileName(traversal);
      expect(result).toBe("________secret.txt");
    });

    it("should handle empty input", () => {
      expect(sanitization.fileName("")).toBe("unknown.txt");
      expect(sanitization.fileName(null as any)).toBe("unknown.txt");
    });
  });

  describe("sanitizeURL", () => {
    it("should allow valid URLs", () => {
      const valid = "https://example.com";
      const result = sanitization.url(valid);
      expect(result).toBe("https://example.com/");
    });

    it("should reject javascript: URLs", () => {
      const malicious = "javascript:alert(1)";
      const result = sanitization.url(malicious);
      expect(result).toBe("");
    });

    it("should reject data: URLs", () => {
      const malicious = "data:text/html,<script>alert(1)</script>";
      const result = sanitization.url(malicious);
      expect(result).toBe("");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize nested objects", () => {
      const obj = {
        name: "<script>alert(1)</script>",
        data: {
          content: '<iframe src="javascript:alert(1)"></iframe>',
          safe: "normal text",
        },
      };
      const result = sanitization.object(obj);

      expect(result.name).toBe("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
      expect(result.data.content).toBe(
        "&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;&#x2F;iframe&gt;"
      );
      expect(result.data.safe).toBe("normal text");
    });

    it("should sanitize arrays", () => {
      const arr = ["<script>alert(1)</script>", "safe text"];
      const result = sanitization.object(arr);

      expect(result[0]).toBe("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
      expect(result[1]).toBe("safe text");
    });
  });

  describe("sanitizeAIRequest", () => {
    it("should sanitize request data", () => {
      const request = {
        agent: "<script>alert(1)</script>",
        files: [
          {
            name: "../../../malicious.txt",
            content: "<script>alert(1)</script>",
            type: "text",
          },
        ],
        parameters: {
          content: '<iframe src="javascript:alert(1)"></iframe>',
        },
      };

      const result = sanitization.aiRequest(request);

      expect(result.agent).toBe("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
      expect(result.files[0].name).toBe("______malicious.txt");
      expect(result.files[0].content).toBe(
        "&lt;script&gt;alert(1)&lt;&#x2F;script&gt;"
      );
      expect(result.parameters.content).toBe(
        "&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;&#x2F;iframe&gt;"
      );
    });
  });

  describe("validation", () => {
    it("should validate text input", () => {
      expect(sanitization.validation.isValidTextInput("valid text")).toBe(true);
      expect(sanitization.validation.isValidTextInput("")).toBe(false);
      expect(sanitization.validation.isValidTextInput(null)).toBe(false);
      expect(sanitization.validation.isValidTextInput("x".repeat(10001))).toBe(
        false
      );
    });

    it("should validate file names", () => {
      expect(sanitization.validation.isValidFileName("valid.txt")).toBe(true);
      expect(sanitization.validation.isValidFileName("")).toBe(false);
      expect(sanitization.validation.isValidFileName(null)).toBe(false);
    });

    it("should validate file sizes", () => {
      expect(sanitization.validation.isValidFileSize(1024)).toBe(true);
      expect(sanitization.validation.isValidFileSize(0)).toBe(false);
      expect(sanitization.validation.isValidFileSize(21 * 1024 * 1024)).toBe(
        false
      );
    });
  });
});
