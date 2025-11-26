import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security middleware to add CSP and Permissions-Policy headers
 * This protects against XSS, clickjacking, and unauthorized API access
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Generate a nonce for inline scripts (for CSP)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Content Security Policy (CSP)
  // This prevents XSS attacks and restricts resource loading
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://apis.google.com https://docs.googleapis.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com",
    "frame-src 'self' https://docs.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ];

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  // Permissions Policy - blocks unnecessary browser APIs
  // This prevents permission-based attacks and unwanted feature detection
  const permissionsPolicy = [
    'accelerometer=()',
    'autoplay=(self)',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()',
    'clipboard-read=()',
    'clipboard-write=(self)',
    'gamepad=()',
    'speaker-selection=()',
    'conversion-measurement=()',
    'focus-without-user-activation=()',
    'hid=()',
    'idle-detection=()',
    'interest-cohort=()',
    'serial=()',
    'sync-script=()',
    'trust-token-redemption=()',
    'unload=()',
    'window-management=()',
    'vertical-scroll=()'
  ];

  response.headers.set(
    'Permissions-Policy',
    permissionsPolicy.join(', ')
  );

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Store nonce for use in pages (via request headers)
  response.headers.set('x-nonce', nonce);

  return response;
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
