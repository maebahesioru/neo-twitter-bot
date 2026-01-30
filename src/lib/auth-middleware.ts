import { NextRequest, NextResponse } from 'next/server';

// Simple API key authentication for this demo
// In production, use proper JWT or session-based authentication

function getApiKey(): string {
  return process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'your-secret-api-key-change-in-production';
}

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const apiKey = req.headers.get('x-api-key');
    const validApiKey = getApiKey();
    
    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}

export function generateApiKey(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
