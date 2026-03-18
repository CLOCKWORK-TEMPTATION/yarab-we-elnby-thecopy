/**
 * Next.js Middleware
 *
 * This middleware adds security headers including Content Security Policy (CSP)
 * with development environment support.
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Development mode detection
  const isDevelopment = process.env.NODE_ENV === "development";
  const allowedDevOrigin = process.env.ALLOWED_DEV_ORIGIN || "";

  // Build CSP directives
  const cspDirectives: string[] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data:",
    "img-src 'self' data: blob: https: https://placehold.co https://images.unsplash.com https://picsum.photos",
    "media-src 'self' https://cdn.pixabay.com https://*.pixabay.com blob: data:",
  ];

  // Build connect-src with dev origin support
  const connectSrcParts = [
    "'self'",
    "https://apis.google.com",
    "https://*.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    process.env.NEXT_PUBLIC_SENTRY_DSN ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin : "",
    "wss:",
    "ws:",
  ].filter(Boolean);

  if (isDevelopment && allowedDevOrigin) {
    connectSrcParts.push(allowedDevOrigin);
  }

  cspDirectives.push(`connect-src ${connectSrcParts.join(" ")}`);

  // Build frame-ancestors with dev origin support
  if (isDevelopment && allowedDevOrigin) {
    cspDirectives.push(`frame-ancestors 'self' ${allowedDevOrigin}`);
  } else {
    cspDirectives.push("frame-ancestors 'none'");
  }

  cspDirectives.push(
    "frame-src 'self' https://apis.google.com https://*.googleapis.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  );

  // Set CSP header
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

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
