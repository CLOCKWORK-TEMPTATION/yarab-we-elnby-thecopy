import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // تحديد TypeScript config للاختبارات - Specify TypeScript config for tests
    typecheck: {
      tsconfig: './tsconfig.vitest.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/test/**',
        '**/test/**/*.ts',
        '**/*.config.*',
        '**/*.mock.*',
        '**/mcp-server.ts',
        'src/db/migrations/**',
      ],
      all: true,
      perFile: true,
      skipFull: false,
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        each: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
