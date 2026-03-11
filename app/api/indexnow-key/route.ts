import { NextResponse } from 'next/server';

const INDEXNOW_KEY = '7821142901764bd4891905591fd65eb1';

export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
