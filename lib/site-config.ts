/**
 * Site configuration with utilities for working with URLs
 */

/**
 * Check if the current device is mobile
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if the app is currently running as a PWA
 */
export function isPwaMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

/**
 * Get the base site URL, ensuring consistency across the application
 * With improved support for mobile PWA environments
 */
export function getSiteUrl() {
  // Server-side: Use the environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }
  
  // Client-side: Prefer environment variable for specific cases
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // For ngrok tunnels, always use the environment URL
  if (envUrl && envUrl.includes('ngrok')) {
    console.log('Using ngrok URL:', envUrl);
    return envUrl;
  }
  
  // For PWA on mobile, we need to check origin vs env URL
  if (isPwaMode() && isMobileDevice()) {
    console.log('In PWA mode on mobile device');
    
    // If we're not on localhost, prefer the environment URL if available
    if (!window.location.origin.includes('localhost') && envUrl) {
      return envUrl;
    }
  }
  
  // For all other cases, use the current origin
  return window.location.origin;
}

/**
 * Get the auth callback URL for magic links
 */
export function getAuthCallbackUrl() {
  // Build the callback URL using the site URL
  const baseUrl = getSiteUrl();
  
  // Log this for debugging
  console.log('Auth callback URL set to:', `${baseUrl}/auth/callback`);
  
  // For mobile PWA and Supabase auth, we need a fully qualified URL
  return `${baseUrl}/auth/callback`;
}

/**
 * Check if we're currently on the ngrok URL
 */
export function isNgrokUrl() {
  if (typeof window === 'undefined') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return siteUrl.includes('ngrok');
  }
  
  return window.location.origin.includes('ngrok');
}

/**
 * Get dashboard URL
 */
export function getDashboardUrl() {
  return `${getSiteUrl()}/dashboard`;
}

/**
 * Get login URL
 */
export function getLoginUrl() {
  return `${getSiteUrl()}/login`;
}

/**
 * Get PWA opener URL with auth code
 */
export function getPwaOpenerUrl(code: string) {
  return `${getSiteUrl()}/pwa-opener?code=${encodeURIComponent(code)}`;
} 