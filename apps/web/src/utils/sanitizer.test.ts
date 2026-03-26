import { describe, expect, it } from "vitest";

import { generateCSPHeader } from "./sanitizer";

describe("sanitizer CSP config", () => {
  it("does not allow inline scripts or eval", () => {
    const header = generateCSPHeader();

    expect(header).not.toContain("unsafe-inline");
    expect(header).not.toContain("unsafe-eval");
  });
});
