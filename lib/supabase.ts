import { createBrowserClient } from '@supabase/ssr';
import { getSiteUrl } from './site-config';

// Create a Supabase client for browser usage with the anon key
export const createBrowserSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Get site URL with improved mobile PWA support
  const siteUrl = getSiteUrl();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Log the site URL being used for debugging
  if (typeof window !== 'undefined') {
    console.log('Creating Supabase client with:');
    console.log('- Current origin:', window.location.origin);
    console.log('- Using site URL:', siteUrl);
    
    // Log additional PWA information for debugging
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    console.log('- Running as PWA:', isPWA ? 'Yes' : 'No');
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('- Mobile device:', isMobile ? 'Yes' : 'No');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    // For PWA environments, we need to make sure cookies are properly managed
    cookieOptions: {
      sameSite: 'lax',
      path: '/',
      secure: window.location.protocol === 'https:'
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true, 
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

// Create a Supabase client for server actions (browser environment)
export const createActionClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
}; 