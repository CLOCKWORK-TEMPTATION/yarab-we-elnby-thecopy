/**
 * Next.js Middleware
 *
 * This middleware adds security headers including Content Security Policy (CSP)
 * with development environment support.
 */

import { NextRequest, NextResponse } from "next/server";

interface ContentSecurityPolicyOptions {
  isDevelopment: boolean;
  allowedDevOrigin?: string;
  sentryOrigin?: string;
  cdnOrigin?: string;
}

function getOriginFromUrl(url: string | undefined): string {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

export function buildContentSecurityPolicy({
  isDevelopment,
  allowedDevOrigin,
  sentryOrigin,
  cdnOrigin,
}: ContentSecurityPolicyOptions): string | null {
  if (isDevelopment) {
    return null;
  }

  const connectSrcParts = [
    "'self'",
    "https://apis.google.com",
    "https://*.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://www.googleapis.com",
    sentryOrigin,
    cdnOrigin,
  ].filter(Boolean);

  const frameAncestors = allowedDevOrigin
    ? `frame-ancestors 'self' ${allowedDevOrigin}`
    : "frame-ancestors 'none'";

  return [
    "default-src 'self'",
    [
      "script-src",
      "'self'",
      "https://apis.google.com",
      "https://www.gstatic.com",
      "https://*.googleapis.com",
      "https://*.sentry.io",
      cdnOrigin,
    ]
      .filter(Boolean)
      .join(" "),
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    [
      "style-src",
      "'self'",
      "https://fonts.googleapis.com",
      cdnOrigin,
    ]
      .filter(Boolean)
      .join(" "),
    [
      "font-src",
      "'self'",
      "https://fonts.gstatic.com",
      "https://r2cdn.perplexity.ai",
      "data:",
      cdnOrigin,
    ]
      .filter(Boolean)
      .join(" "),
    [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://placehold.co",
      "https://images.unsplash.com",
      "https://picsum.photos",
      "https://www.gstatic.com",
      "https://*.googleapis.com",
      cdnOrigin,
    ]
      .filter(Boolean)
      .join(" "),
    "media-src 'self' https://cdn.pixabay.com https://*.pixabay.com blob: data:",
    `connect-src ${connectSrcParts.join(" ")}`,
    "frame-src 'self' https://apis.google.com https://*.googleapis.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    frameAncestors,
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Development mode detection
  const isDevelopment = process.env.NODE_ENV === "development";
  const allowedDevOrigin = process.env.ALLOWED_DEV_ORIGIN || "";
  const sentryOrigin = getOriginFromUrl(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const cdnOrigin = getOriginFromUrl(process.env.NEXT_PUBLIC_CDN_URL);
  const contentSecurityPolicy = buildContentSecurityPolicy({
    isDevelopment,
    allowedDevOrigin,
    sentryOrigin,
    cdnOrigin,
  });

  if (contentSecurityPolicy) {
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  }

  // Additional security headers
  if (!isDevelopment) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
