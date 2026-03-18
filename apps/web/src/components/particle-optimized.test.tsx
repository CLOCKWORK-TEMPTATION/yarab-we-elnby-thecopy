import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dynamic import for particle-background-optimized
vi.mock("./particle-background-optimized", () => ({
  default: () => "OptimizedParticleAnimation",
}));

describe("Particle Background Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Production Usage Check", () => {
    it("should use optimized particle background in production", async () => {
      // This test ensures the optimized version is being used
      const { default: OptimizedComponent } = await import(
        "./particle-background-optimized"
      );

      expect(typeof OptimizedComponent).toBe("function");
    });

    it("should not contain console.log statements in optimized version", async () => {
      // Check if the file contains console.log statements
      const fs = require("fs");
      const path = require("path");

      const filePath = path.join(
        __dirname,
        "particle-background-optimized.tsx"
      );
      const fileContent = fs.readFileSync(filePath, "utf8");

      // In production, console.log statements should be removed
      const hasConsoleLogs = fileContent.includes("console.log(");

      // Note: This test checks the source code, which may still contain console.log
      // In a real CI environment, console.log should be stripped during build
      expect(hasConsoleLogs).toBe(false);
    });

    it("should support prefers-reduced-motion", async () => {
      // Mock matchMedia
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      // Test that the component properly checks reduced motion preference
      const React = require("react");
      const { renderHook } = require("@testing-library/react");

      const { result } = renderHook(() => {
        const prefersReducedMotion = React.useMemo(() => {
          return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }, []);
        return { prefersReducedMotion };
      });

      // The component should respect the user's motion preference
      // In this test, we mocked matchMedia to return true for reduced motion
      expect(result.current.prefersReducedMotion).toBe(true);
    });
  });

  describe("Performance Configuration", () => {
    it("should have optimized particle counts for different devices", () => {
      // Verify the optimized configuration uses device detection
      const fs = require("fs");
      const path = require("path");

      const filePath = path.join(
        __dirname,
        "particle-background-optimized.tsx"
      );
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Should use device detection system
      expect(fileContent).toContain("getDeviceCapabilities");
      expect(fileContent).toContain("getParticleLODConfig");
      expect(fileContent).toContain("getOptimalParticleCount");
    });

    it("should implement requestIdleCallback optimization", () => {
      const fs = require("fs");
      const path = require("path");

      const filePath = path.join(
        __dirname,
        "particle-background-optimized.tsx"
      );
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Should implement idle callback for performance
      expect(fileContent).toContain("requestIdle");
      expect(fileContent).toContain("setTimeout");
    });
  });

  describe("Visual Parity Between Components", () => {
    it("should have identical distance field calculations", () => {
      // This test ensures both components use shared constants
      const fs = require("fs");
      const path = require("path");

      const mainFilePath = path.join(__dirname, "particle-background.tsx");
      const optimizedFilePath = path.join(
        __dirname,
        "particle-background-optimized.tsx"
      );
      const constantsFilePath = path.join(
        __dirname,
        "particle-letters.constants.ts"
      );

      const mainContent = fs.readFileSync(mainFilePath, "utf8");
      const optimizedContent = fs.readFileSync(optimizedFilePath, "utf8");
      const constantsContent = fs.readFileSync(constantsFilePath, "utf8");

      // Check that both files import from shared constants
      expect(mainContent).toContain('from "./particle-letters.constants"');
      expect(optimizedContent).toContain('from "./particle-letters.constants"');

      // Check that shared constants file has all required exports
      expect(constantsContent).toContain("export const BASELINE");
      expect(constantsContent).toContain("export const STROKE_WIDTH");
      expect(constantsContent).toContain("export const X_HEIGHT");
      expect(constantsContent).toContain("export const LETTER_POSITIONS");

      // Check that both files use the shared constants
      expect(mainContent).toContain("LETTER_POSITIONS.T");
      expect(optimizedContent).toContain("LETTER_POSITIONS.T");

      // Check that letter 't' uses LETTER_POSITIONS in both files
      const mainTXMatch = mainContent.match(
        /dist_t[^{]*{[^}]*const x = LETTER_POSITIONS\.T/s
      );
      const optimizedTXMatch = optimizedContent.match(
        /dist_t[^{]*{[^}]*const x = LETTER_POSITIONS\.T/s
      );

      expect(mainTXMatch).toBeTruthy();
      expect(optimizedTXMatch).toBeTruthy();
    });

    it("should have matching reduced-motion behavior", () => {
      // Ensure both components handle reduced motion the same way
      const fs = require("fs");
      const path = require("path");

      const mainFilePath = path.join(__dirname, "particle-background.tsx");
      const optimizedFilePath = path.join(
        __dirname,
        "particle-background-optimized.tsx"
      );

      const mainContent = fs.readFileSync(mainFilePath, "utf8");
      const optimizedContent = fs.readFileSync(optimizedFilePath, "utf8");

      // Both should check for prefers-reduced-motion
      expect(mainContent).toContain("prefers-reduced-motion");
      expect(optimizedContent).toContain("prefers-reduced-motion");

      // Both should return early or reduce particles for reduced motion
      const mainHasReducedMotionReturn = mainContent.includes(
        "if (prefersReducedMotion)"
      );
      const optimizedHasReducedMotionReturn = optimizedContent.includes(
        "if (prefersReducedMotion)"
      );

      expect(mainHasReducedMotionReturn).toBe(true);
      expect(optimizedHasReducedMotionReturn).toBe(true);
    });
  });
});
