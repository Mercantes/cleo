import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.error('[client-error]', JSON.stringify(body));
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}
