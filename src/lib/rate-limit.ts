import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
// In production, use Redis or a proper rate limiting service
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const MAX_REQUESTS = 100; // 100 requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      // Create or reset the record
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + WINDOW_MS
      });
    } else {
      // Increment the count
      record.count++;
      
      if (record.count > MAX_REQUESTS) {
        return NextResponse.json(
          { error: 'リクエストが多すぎます。しばらく待ってください。' },
          { status: 429 }
        );
      }
    }
    
    return handler(req);
  };
}

export function withRateLimitStrict(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      // Create or reset the record
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + WINDOW_MS
      });
    } else {
      // Increment the count
      record.count++;
      
      if (record.count > 10) { // 10 requests per minute for sensitive operations
        return NextResponse.json(
          { error: 'リクエストが多すぎます。しばらく待ってください。' },
          { status: 429 }
        );
      }
    }
    
    return handler(req);
  };
}
