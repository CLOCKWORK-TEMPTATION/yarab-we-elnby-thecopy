import { describe, expect, it } from "vitest";

import pagesManifest from "./pages.manifest.json";
import { platformApps } from "./apps.config";

describe("central app registry", () => {
  it("covers all published tool routes except helper pages", () => {
    const ignoredPaths = new Set([
      "/apps-overview",
    ]);

    const publishedToolPaths = pagesManifest.pages
      .map((page) => page.path)
      .filter((path) => !ignoredPaths.has(path));

    const registeredPaths = new Set(platformApps.map((app) => app.path));

    expect(publishedToolPaths.every((path) => registeredPaths.has(path))).toBe(true);
  });

  it("keeps registry paths unique", () => {
    const paths = platformApps.map((app) => app.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
