/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Next.js
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_APP_URL?: string;
    readonly NEXT_PUBLIC_API_URL?: string;

    // API Keys
    readonly NEXT_PUBLIC_MISTRAL_API_KEY?: string;
    readonly MISTRAL_API_KEY?: string;
    readonly OPENAI_API_KEY?: string;
    readonly ANTHROPIC_API_KEY?: string;

    // Database
    readonly DATABASE_URL?: string;
    readonly POSTGRES_URL?: string;
    readonly POSTGRES_PRISMA_URL?: string;
    readonly POSTGRES_URL_NON_POOLING?: string;

    // Redis
    readonly REDIS_URL?: string;
    readonly UPSTASH_REDIS_REST_URL?: string;
    readonly UPSTASH_REDIS_REST_TOKEN?: string;

    // Auth
    readonly NEXTAUTH_URL?: string;
    readonly NEXTAUTH_SECRET?: string;
    readonly AUTH_SECRET?: string;

    // Analytics
    readonly NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
    readonly NEXT_PUBLIC_GOOGLE_ANALYTICS?: string;

    // Feature Flags
    readonly NEXT_PUBLIC_ENABLE_ANALYTICS?: string;
    readonly NEXT_PUBLIC_ENABLE_OFFLINE?: string;

    // Other
    readonly PORT?: string;
    readonly VERCEL?: string;
    readonly VERCEL_URL?: string;
    readonly VERCEL_ENV?: 'production' | 'preview' | 'development';

    // Backend URL
    readonly NEXT_PUBLIC_BACKEND_URL?: string;
    readonly BACKEND_URL?: string;

    // Sentry
    readonly NEXT_PUBLIC_SENTRY_DSN?: string;
    readonly SENTRY_DSN?: string;
    readonly SENTRY_AUTH_TOKEN?: string;

    // Storage
    readonly STORAGE_URL?: string;
    readonly STORAGE_BUCKET?: string;

    [key: string]: string | undefined;
  }
}
