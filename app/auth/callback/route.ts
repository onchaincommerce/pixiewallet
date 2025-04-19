import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDashboardUrl, getPwaOpenerUrl } from '@/lib/site-config';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    console.log('Auth callback received at URL:', requestUrl.toString());
    const code = requestUrl.searchParams.get('code');
    
    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if this is likely coming from a mobile device by looking at the user agent
    const userAgent = request.headers.get('user-agent') || '';
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Get the hostname we're running on
    const hostname = requestUrl.hostname;
    const isLocalhost = hostname === 'localhost' || hostname.includes('127.0.0.1');
    
    console.log('Callback request details:');
    console.log('- Hostname:', hostname);
    console.log('- Is localhost:', isLocalhost);
    console.log('- Is mobile device:', isMobileDevice);
    console.log('- Auth code:', code.substring(0, 5) + '...');
    
    // For mobile devices, we'll redirect to our PWA opener
    if (isMobileDevice) {
      // Create the PWA opener URL with the auth code
      const pwaOpenerUrl = getPwaOpenerUrl(code);
      console.log('Redirecting to PWA opener:', pwaOpenerUrl);
      
      // Set cache headers to prevent caching
      const response = NextResponse.redirect(pwaOpenerUrl);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }
    
    // For desktop or if already in the correct context, proceed with the regular flow
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
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!data.session) {
      console.error('No session returned after code exchange');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('Session established successfully for user:', data.session.user.email);
    
    // Get the dashboard URL using our utility
    const dashboardUrl = getDashboardUrl();
    console.log('Redirecting to dashboard URL:', dashboardUrl);
    
    const response = NextResponse.redirect(dashboardUrl);
    
    // Set cache headers to prevent caching issues
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error in auth callback:', error);
    const fallbackUrl = new URL('/login', request.url);
    return NextResponse.redirect(fallbackUrl);
  }
} 