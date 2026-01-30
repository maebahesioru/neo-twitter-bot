import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Simple CSRF protection using tokens
// In production, use a more robust solution like csrf-csrf or similar

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(token: string): boolean {
  const record = csrfTokens.get(token);
  
  if (!record) {
    return false;
  }
  
  const now = Date.now();
  if (now > record.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }
  
  return true;
}

export function storeCsrfToken(token: string): void {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  csrfTokens.set(token, { token, expiresAt });
}

export function withCsrf(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return handler(req);
    }
    
    const csrfToken = req.headers.get('x-csrf-token');
    
    if (!csrfToken || !validateCsrfToken(csrfToken)) {
      return NextResponse.json(
        { error: 'CSRFトークンが無効です' },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}

export function withCsrfOptional(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return handler(req);
    }
    
    const csrfToken = req.headers.get('x-csrf-token');
    
    // If no token provided, proceed anyway (for backward compatibility)
    if (!csrfToken) {
      return handler(req);
    }
    
    // If token provided, validate it
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json(
        { error: 'CSRFトークンが無効です' },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}
