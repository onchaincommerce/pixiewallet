import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create supabase client inline to avoid import issues
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return session info and environment details for debugging
    return NextResponse.json({
      session: data.session ? {
        user: data.session.user,
        expires_at: data.session.expires_at,
        hasSession: true
      } : null,
      env: {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 