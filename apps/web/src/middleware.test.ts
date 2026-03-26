import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./middleware";

describe("content security policy builder", () => {
  it("removes unsafe inline execution and eval in production", () => {
    const header = buildContentSecurityPolicy({
      isDevelopment: false,
      allowedDevOrigin: "",
      sentryOrigin: "https://o0.ingest.sentry.io",
      cdnOrigin: "https://cdn.example.com",
    });

    expect(header).toContain("script-src 'self'");
    expect(header).toContain("style-src 'self' https://fonts.googleapis.com https://cdn.example.com");
    expect(header).not.toContain("unsafe-inline");
    expect(header).not.toContain("unsafe-eval");
  });
});
