import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const headersList = headers();
  const host = headersList.get('host') || 'unknown';
  const referer = headersList.get('referer') || 'unknown';
  
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    },
    request: {
      host,
      referer,
    },
    time: new Date().toISOString(),
  });
} 