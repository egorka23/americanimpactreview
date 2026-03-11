import { NextResponse } from 'next/server';

export async function GET() {
  const xml = `<?xml version="1.0"?>
<users>
	<user>BA9F6790800A3909ACF33124CD44E141</user>
</users>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
