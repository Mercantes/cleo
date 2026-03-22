import { NextResponse } from 'next/server';

// Store last error in memory for diagnostic endpoint
let lastError: Record<string, unknown> | null = null;

export async function POST(request: Request) {
  try {
    // Reject oversized payloads early
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > 50_000) {
      return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
    }

    const body = await request.json();
    lastError = {
      boundary: typeof body.boundary === 'string' ? body.boundary.substring(0, 200) : undefined,
      message: typeof body.message === 'string' ? body.message.substring(0, 500) : undefined,
      url: typeof body.url === 'string' ? body.url.substring(0, 500) : undefined,
      userAgent: typeof body.userAgent === 'string' ? body.userAgent.substring(0, 300) : undefined,
      digest: typeof body.digest === 'string' ? body.digest.substring(0, 100) : undefined,
      stack: typeof body.stack === 'string' ? body.stack.substring(0, 500) : undefined,
      timestamp: new Date().toISOString(),
    };
    console.error(`[CLIENT_ERROR] ${lastError.boundary} | ${lastError.message} | ${lastError.url} | ${lastError.userAgent} | digest:${lastError.digest || 'none'}`);
    if (lastError.stack) {
      console.error(`[CLIENT_STACK] ${lastError.stack}`);
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(lastError || { message: 'No errors recorded' });
}
