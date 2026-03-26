// Suppress deprecated middleware warning
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('The "middleware" file convention is deprecated') || msg.includes('Please use "proxy" instead')) {
    return;
  }
  originalWarn.apply(console, args);
};

const { NextConfig } = require("next");
const path = require("path");

// Remote image patterns configuration
const remoteImagePatterns = process.env.NEXT_IMAGE_REMOTE_PATTERNS
  ? JSON.parse(process.env.NEXT_IMAGE_REMOTE_PATTERNS)
  : [
    {
      protocol: "https",
      hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "*.public.blob.vercel-storage.com",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "placehold.co",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "picsum.photos",
      port: "",
      pathname: "/**",
    },
  ];

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// CDN Configuration
const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
const enableCdn = process.env.NEXT_PUBLIC_ENABLE_CDN === "true";
const assetPrefix = enableCdn && cdnUrl ? cdnUrl : undefined;

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@the-copy/shared',
    '@the-copy/ui',
    '@the-copy/brain-storm-ai',
    '@the-copy/styleist',
    '@the-copy/breakdown',
    '@the-copy/art-director',
    '@the-copy/cinefit',
    '@the-copy/budget',
    '@the-copy/directors-studio',
    '@the-copy/editor',
    '@the-copy/breakapp',
    '@the-copy/prompt-engineering',
    '@the-copy/creative-writing',
    '@the-copy/actorai',
    '@the-copy/cinematography',
  ],
  poweredByHeader: false,
  compress: true,
  
  allowedDevOrigins: ['*'],
  
  // Force @google/genai to only be loaded server-side
  serverExternalPackages: ['@google/genai', 'puppeteer', 'sharp'],
  
  // Enable production browser sourcemaps
  productionBrowserSourceMaps: false,

  // Ensure correct root when multiple lockfiles exist (silences Next.js warning)
  // يؤشر إلى جذر الـ monorepo لتتبع الملفات من packages/ و apps/ معًا
  outputFileTracingRoot: path.join(__dirname, "../.."),

  // CDN support for static assets
  assetPrefix,

  // Performance optimizations
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  experimental: {
    sri: {
      algorithm: "sha256",
    },
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "recharts",
    ],
  },

  // Performance Budget - Fail build if exceeded
  // Ensures bundle sizes stay within acceptable limits
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // In development: force no-cache on all routes so browser always fetches fresh content
    if (isDev) {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
            {
              key: "Pragma",
              value: "no-cache",
            },
            {
              key: "Expires",
              value: "0",
            },
          ],
        },
      ];
    }

    // Production headers — security + aggressive caching
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
              "payment=()",
              "usb=()",
            ].join(", "),
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache Next.js static files (JS, CSS, etc.)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache fonts with long TTL
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
      // Cache directors-studio images
      {
        source: "/directors-studio/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache optimized images
      {
        source: "/directors-studio/optimized/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
      // Cache API responses with stale-while-revalidate
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=120",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: remoteImagePatterns,
  },

  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      "@editor/*": "./src/app/(main)/editor/src/*",
    },
  },

  // Webpack configuration for handling Node.js built-in modules and critical dependency warnings
  // Note: In Next.js 16, Turbopack is default. Webpack config is kept for fallback compatibility.
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Don't resolve Node.js modules on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        http2: false,
        child_process: false,
        stream: false,
        crypto: false,
        path: false,
        os: false,
        dgram: false,
        async_hooks: false,
        "node:async_hooks": false,
        "graceful-fs": false,
      };
    }

    // Suppress critical dependency warnings from OpenTelemetry and Sentry
    config.ignoreWarnings = [
      // Ignore OpenTelemetry instrumentation warnings
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /require-in-the-middle/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
      // Ignore Sentry related warnings
      {
        module: /@sentry/,
        message: /Critical dependency/,
      },
      // Ignore all OpenTelemetry related warnings
      {
        module: /@opentelemetry/,
      },
      // Generic critical dependency warnings for known safe modules
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Ignore ESLint configuration warnings
      {
        message: /Unknown options: useEslintrc, extensions/,
      },
    ];

    // Additional webpack optimizations to reduce warnings
    config.stats = {
      ...config.stats,
      warnings: false,
      warningsFilter: [
        /Critical dependency/,
        /Unknown options/,
        /@opentelemetry/,
        /@sentry/,
      ],
    };

    return config;
  },
};

// Sentry configuration
const { withSentryConfig } = require("@sentry/nextjs");

const shouldUseSentry = true; // Enabled after fixing version conflict

const sentryConfig = shouldUseSentry
  ? {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    hideSourceMaps: process.env.NODE_ENV === "production",
    tunnelRoute: "/monitoring",
    sourcemaps: {
      disable: false,
      ignore: [
        "**/*manifest*.js",
        "**/*reference-manifest*.js"
      ]
    },
  }
  : null;

// Export config with Sentry wrapper if configured
const configWithAnalyzer = withBundleAnalyzer(nextConfig);
export default sentryConfig
  ? withSentryConfig(configWithAnalyzer, sentryConfig)
  : configWithAnalyzer;
