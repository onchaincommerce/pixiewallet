import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware ensures users are redirected to the appropriate pages based on their authentication status
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name: string, options: any) => {
          res.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );
  
  // Get the user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the pathname from the URL
  const pathname = req.nextUrl.pathname;

  // Define routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  
  // Define routes that are only for non-authenticated users
  const authRoutes = ['/login', '/signup'];
  
  // Skip checking and redirects for auth callback routes
  if (pathname.startsWith('/auth/callback') || 
      pathname.startsWith('/auth-mobile') || 
      pathname.startsWith('/pwa-auth') || 
      pathname.startsWith('/pwa-opener')) {
    return res;
  }

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // Redirect unauthenticated users to login if trying to access protected routes
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users to dashboard if trying to access auth routes
  if (isAuthRoute && session) {
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect root to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    const redirectUrl = new URL(session ? '/dashboard' : '/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|auth/callback|auth-mobile|pwa-auth|pwa-opener).*)',
  ],
}; 