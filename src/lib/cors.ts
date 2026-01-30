import { NextRequest, NextResponse } from 'next/server';

export function withCors(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const response = await handler(req);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-CSRF-Token');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  };
}

export function handleCorsOptions() {
  return NextResponse.json({}, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  });
}
