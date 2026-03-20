import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log each field separately to avoid Vercel truncation
    console.error('[client-error] boundary:', body.boundary);
    console.error('[client-error] message:', body.message);
    console.error('[client-error] url:', body.url);
    console.error('[client-error] userAgent:', body.userAgent);
    if (body.stack) {
      console.error('[client-error] stack:', body.stack);
    }
    if (body.digest) {
      console.error('[client-error] digest:', body.digest);
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}
