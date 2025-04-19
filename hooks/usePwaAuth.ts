import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export function usePwaAuth() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkForAuthCode() {
      try {
        // Check if there's an auth code in localStorage
        const code = localStorage.getItem('magiclink_auth_code');
        const timestamp = localStorage.getItem('magiclink_timestamp');
        
        // If no code or timestamp, nothing to do
        if (!code || !timestamp) {
          return;
        }
        
        // Check if the timestamp is recent (within the last 5 minutes)
        const parsedTimestamp = parseInt(timestamp, 10);
        const now = Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;
        
        if (now - parsedTimestamp > fiveMinutesMs) {
          // Code is too old, remove it
          localStorage.removeItem('magiclink_auth_code');
          localStorage.removeItem('magiclink_timestamp');
          return;
        }
        
        // We have a valid code, let's process it
        setIsProcessing(true);
        
        console.log('PWA: Found authentication code in localStorage, processing...');
        
        // Initialize Supabase client
        const supabase = createBrowserSupabaseClient();
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        // Clean up regardless of success or failure
        localStorage.removeItem('magiclink_auth_code');
        localStorage.removeItem('magiclink_timestamp');
        
        if (error) {
          console.error('PWA auth error:', error);
          setError(error.message);
          setIsProcessing(false);
          return;
        }
        
        if (!data.session) {
          setError('No session returned from authentication');
          setIsProcessing(false);
          return;
        }
        
        // Success!
        console.log('PWA: Successfully authenticated');
        setIsSuccess(true);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('PWA auth unexpected error:', err);
        setError(err.message || 'An unexpected error occurred');
        setIsProcessing(false);
        
        // Clean up on error
        localStorage.removeItem('magiclink_auth_code');
        localStorage.removeItem('magiclink_timestamp');
      }
    }
    
    // Check for auth code when the hook is initialized
    checkForAuthCode();
  }, []);

  return { isProcessing, isSuccess, error };
} 