import { NextResponse } from 'next/server';

// Store last error in memory for diagnostic endpoint
let lastError: Record<string, unknown> | null = null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    lastError = { ...body, timestamp: new Date().toISOString() };
    console.error(`[CLIENT_ERROR] ${body.boundary} | ${body.message} | ${body.url} | ${body.userAgent} | digest:${body.digest || 'none'}`);
    if (body.stack) {
      console.error(`[CLIENT_STACK] ${body.stack.substring(0, 500)}`);
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(lastError || { message: 'No errors recorded' });
}
