/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
    // Production optimizations - simplified for compatibility
    ...(process.env.NODE_ENV === "production" && {
      cssnano: {
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            minifySelectors: true,
            colormin: true,
            discardDuplicates: true,
            discardEmpty: true,
            mergeLonghand: true,
            mergeRules: true,
            normalizeUrl: true,
            uniqueSelectors: true,
          },
        ],
      },
    }),
  },
};

export default config;
