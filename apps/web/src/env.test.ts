import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("web environment validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      NODE_ENV: "test",
      NEXT_PUBLIC_APP_ENV: "development",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("accepts documented public and server-side runtime variables", async () => {
    const originalWindow = globalThis.window;

    process.env = {
      ...process.env,
      AGENT_REVIEW_MODEL: "anthropic:claude-sonnet-4-6",
      FINAL_REVIEW_MODEL: "openai:gpt-5-mini",
      AI_DOUBT_ENABLED: "false",
      ALLOWED_DEV_ORIGIN: "http://localhost:5000",
      NEXT_PUBLIC_ENVIRONMENT: "development",
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:3001",
      NEXT_PUBLIC_FILE_IMPORT_BACKEND_URL: "http://127.0.0.1:8787/api/file-extract",
      NEXT_PUBLIC_FINAL_REVIEW_BACKEND_URL: "http://127.0.0.1:8787/api/final-review",
      NEXT_PUBLIC_AI_DOUBT_ENABLED: "false",
      NEXT_PUBLIC_ENABLE_CDN: "false",
      NEXT_PUBLIC_TRACING_ENABLED: "false",
      NEXT_PUBLIC_SERVICE_NAME: "thecopy-frontend",
      NEXT_PUBLIC_APP_VERSION: "1.0.0",
      NEXT_PUBLIC_FIREBASE_API_KEY: "firebase-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "the-copy.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "the-copy",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "the-copy.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-TEST123",
      FILE_IMPORT_HOST: "127.0.0.1",
      FILE_IMPORT_PORT: "8787",
      LOG_LEVEL: "info",
      SKIP_ENV_VALIDATION: "false",
    };

    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
    });

    const { serverEnv, clientEnv } = await import("./env");

    expect(serverEnv.AGENT_REVIEW_MODEL).toBe("anthropic:claude-sonnet-4-6");
    expect(serverEnv.ALLOWED_DEV_ORIGIN).toBe("http://localhost:5000");
    expect(serverEnv.FILE_IMPORT_PORT).toBe("8787");
    expect(clientEnv.NEXT_PUBLIC_BACKEND_URL).toBe("http://localhost:3001");
    expect(clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID).toBe("1:123:web:abc");

    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
    });
  });
});
