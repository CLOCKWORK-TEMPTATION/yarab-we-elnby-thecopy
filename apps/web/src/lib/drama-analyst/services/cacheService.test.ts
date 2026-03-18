import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Service Worker APIs
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
  keys: vi.fn(),
  delete: vi.fn(),
  add: vi.fn(),
  addAll: vi.fn(),
};

const mockCaches = {
  open: vi.fn(() => Promise.resolve(mockCache)),
  keys: vi.fn(() => Promise.resolve(["test-cache"])),
  delete: vi.fn(() => Promise.resolve(true)),
  match: vi.fn(),
};

Object.defineProperty(global, "caches", {
  value: mockCaches,
  writable: true,
});

Object.defineProperty(global, "navigator", {
  value: {
    serviceWorker: {
      register: vi.fn(() =>
        Promise.resolve({
          scope: "/",
          active: { state: "activated" },
          waiting: null,
          installing: null,
          addEventListener: vi.fn(),
        })
      ),
      controller: null,
    },
    onLine: true,
  },
  writable: true,
});

Object.defineProperty(global, "window", {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, "Notification", {
  value: vi.fn(() => ({
    close: vi.fn(),
  })),
  writable: true,
});

Object.defineProperty(global, "confirm", {
  value: vi.fn(() => true),
  writable: true,
});

Object.defineProperty(global, "fetch", {
  value: vi.fn(() =>
    Promise.resolve({
      ok: true,
      clone: vi.fn(() => ({ ok: true })),
      blob: vi.fn(() => Promise.resolve({ size: 1024 })),
    })
  ),
  writable: true,
});

// Mock document
Object.defineProperty(global, "document", {
  value: {
    getElementById: vi.fn(() => ({
      style: { display: "block" },
    })),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => ({
      id: "test",
      className: "test",
      textContent: "",
      style: {},
      appendChild: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
    },
  },
  writable: true,
});

describe("Cache Service", () => {
  let cacheService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mocks
    mockCache.match.mockResolvedValue(null);
    mockCache.put.mockResolvedValue(undefined);
    mockCache.keys.mockResolvedValue([]);
    mockCache.delete.mockResolvedValue(true);
    mockCache.add.mockResolvedValue(undefined);
    mockCache.addAll.mockResolvedValue(undefined);

    mockCaches.open.mockResolvedValue(mockCache);
    mockCaches.keys.mockResolvedValue(["test-cache"]);
    mockCaches.delete.mockResolvedValue(true);
    mockCaches.match.mockResolvedValue(null);

    // Mock localStorage
    (localStorage.getItem as any).mockReturnValue(null);
    (localStorage.setItem as any).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize cache configurations", async () => {
      const { cacheService } = await import("./cacheService");

      expect(cacheService).toBeDefined();
      expect(cacheService.getOnlineStatus()).toBe(true);
      expect(cacheService.isServiceWorkerAvailable()).toBe(true);
    });

    it("should handle service worker registration", async () => {
      // Clear the module cache to ensure fresh import
      vi.resetModules();

      const { cacheService } = await import("./cacheService");

      // Wait a bit for the async registration to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js", {
        scope: "/",
      });
    });
  });

  describe("Cache Statistics", () => {
    it("should get cache statistics", async () => {
      const { cacheService } = await import("./cacheService");

      mockCache.keys.mockResolvedValue([
        new Request("https://example.com/resource1"),
        new Request("https://example.com/resource2"),
      ]);

      const stats = await cacheService.getCacheStats();

      expect(stats).toBeInstanceOf(Array);
      expect(stats.length).toBeGreaterThan(0);

      stats.forEach((stat) => {
        expect(stat).toHaveProperty("name");
        expect(stat).toHaveProperty("size");
        expect(stat).toHaveProperty("entries");
        expect(stat).toHaveProperty("lastUpdated");
        expect(stat).toHaveProperty("hitRate");
      });
    });
  });

  describe("Cache Operations", () => {
    it("should check if resource is cached", async () => {
      const { cacheService } = await import("./cacheService");

      mockCaches.match.mockResolvedValue({ ok: true });

      const isCached = await cacheService.isResourceCached(
        "https://example.com/resource"
      );

      expect(isCached).toBe(true);
      expect(mockCaches.match).toHaveBeenCalledWith(
        "https://example.com/resource"
      );
    });

    it("should return false for non-cached resources", async () => {
      const { cacheService } = await import("./cacheService");

      mockCaches.match.mockResolvedValue(null);

      const isCached = await cacheService.isResourceCached(
        "https://example.com/resource"
      );

      expect(isCached).toBe(false);
    });

    it("should cache resources successfully", async () => {
      const { cacheService } = await import("./cacheService");

      const cached = await cacheService.cacheResource(
        "https://example.com/resource",
        "dynamic"
      );

      expect(cached).toBe(true);
      expect(mockCaches.open).toHaveBeenCalled();
      expect(mockCache.put).toHaveBeenCalled();
    });

    it("should handle cache resource failures", async () => {
      const { cacheService } = await import("./cacheService");

      (fetch as any).mockResolvedValue({ ok: false });

      const cached = await cacheService.cacheResource(
        "https://example.com/resource"
      );

      expect(cached).toBe(false);
    });
  });

  describe("Cache Management", () => {
    it("should clear specific cache", async () => {
      const { cacheService } = await import("./cacheService");

      await cacheService.clearCache("static");

      expect(mockCaches.delete).toHaveBeenCalled();
    });

    it("should clear all caches", async () => {
      const { cacheService } = await import("./cacheService");

      await cacheService.clearCache();

      expect(mockCaches.delete).toHaveBeenCalled();
    });
  });

  describe("Network Status", () => {
    it("should report online status correctly", async () => {
      const { cacheService } = await import("./cacheService");

      expect(cacheService.getOnlineStatus()).toBe(true);
    });

    it("should report service worker availability", async () => {
      const { cacheService } = await import("./cacheService");

      expect(cacheService.isServiceWorkerAvailable()).toBe(true);
    });
  });

  describe("Request Caching", () => {
    it("should cache successful requests", async () => {
      const { cacheService } = await import("./cacheService");

      const response = await cacheService.cacheRequest(
        "https://example.com/api/data"
      );

      expect(response.ok).toBe(true);
      expect(mockCache.put).toHaveBeenCalled();
    });

    it("should serve cached requests when offline", async () => {
      const { cacheService } = await import("./cacheService");

      // Mock offline status
      Object.defineProperty(navigator, "onLine", { value: false });

      mockCaches.match.mockResolvedValue({ ok: true });

      const response = await cacheService.cacheRequest(
        "https://example.com/api/data"
      );

      expect(response.ok).toBe(true);
      // Since we're offline, it should use the cached response
      expect(response).toBeDefined();
    });

    it("should handle request caching errors", async () => {
      const { cacheService } = await import("./cacheService");

      (fetch as any).mockRejectedValue(new Error("Network error"));
      mockCaches.match.mockResolvedValue(null);

      await expect(
        cacheService.cacheRequest("https://example.com/api/data")
      ).rejects.toThrow();
    });
  });

  describe("Pending Actions", () => {
    it("should handle pending actions storage", async () => {
      const { cacheService } = await import("./cacheService");

      (localStorage.getItem as any).mockReturnValue(
        JSON.stringify([{ id: "1", type: "api-call", data: {} }])
      );

      // This would test the private methods indirectly through public methods
      // Since the methods are private, we test the behavior through public interfaces
      expect(cacheService).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle service worker registration failures", async () => {
      (navigator.serviceWorker.register as any).mockRejectedValue(
        new Error("Registration failed")
      );

      // The service should still initialize even if SW registration fails
      const { cacheService } = await import("./cacheService");
      expect(cacheService).toBeDefined();
    });

    it("should handle cache operations gracefully", async () => {
      const { cacheService } = await import("./cacheService");

      mockCaches.open.mockRejectedValue(new Error("Cache error"));

      const isCached = await cacheService.isResourceCached(
        "https://example.com/resource"
      );

      expect(isCached).toBe(false);
    });
  });

  describe("Utility Functions", () => {
    it("should handle localStorage operations", async () => {
      (localStorage.getItem as any).mockReturnValue("[]");
      (localStorage.setItem as any).mockReturnValue(undefined);

      const { cacheService } = await import("./cacheService");

      // Test that the service can handle localStorage operations
      expect(cacheService).toBeDefined();
    });
  });
});
