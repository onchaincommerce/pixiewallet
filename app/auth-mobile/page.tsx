'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/site-config';

// Define type for Navigator with standalone property
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function AuthMobilePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pwa-transfer'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function handleAuth() {
      try {
        // Get the code from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          setStatus('error');
          setErrorMessage('No authentication code found in URL');
          return;
        }
        
        console.log('Mobile auth: received code', code);
        
        // Detect if we're in standalone mode (PWA)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as NavigatorWithStandalone).standalone === true;
        
        console.log('Mobile auth: running as PWA?', isPWA ? 'Yes' : 'No');
        
        // If we're not in the PWA context, offer to transfer to the PWA instead
        if (!isPWA) {
          setStatus('pwa-transfer');
          return;
        }
        
        // We're in the PWA, proceed with auth
        // Create a Supabase client
        const supabase = createBrowserSupabaseClient();
        
        // Exchange the code for a session
        console.log('Mobile auth: exchanging code for session');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Mobile auth: error exchanging code for session', error);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }
        
        if (!data.session) {
          console.error('Mobile auth: no session returned');
          setStatus('error');
          setErrorMessage('No session returned from authentication provider');
          return;
        }
        
        // Success!
        console.log('Mobile auth: success! Redirecting to dashboard');
        setStatus('success');
        
        // Redirect to dashboard after a short delay to show success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (error) {
        console.error('Mobile auth: unexpected error', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    }
    
    handleAuth();
  }, [searchParams, router]);

  // Function to open the PWA with the auth code
  const openPWA = () => {
    const code = searchParams.get('code');
    const appUrl = getSiteUrl();
    
    // Create a dedicated link for the PWA
    const pwaDeepLink = `${appUrl}/pwa-auth?code=${code}`;
    
    console.log('Opening PWA with deep link:', pwaDeepLink);
    window.location.href = pwaDeepLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 px-4 relative overflow-hidden">
      <div className="w-full max-w-md p-6">
        <div className="bg-indigo-900 p-6 border-8 border-purple-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h2 className="text-center text-2xl font-bold mb-2 text-yellow-300 font-pixel">PIXIE WALLET</h2>
            <div className="h-1 bg-yellow-500 w-32 mx-auto my-4"></div>
            
            {status === 'loading' && (
              <div className="text-center">
                <div className="pixel-spinner mx-auto mb-4"></div>
                <p className="text-yellow-300 pixel-text">Completing your magical sign-in...</p>
              </div>
            )}
            
            {status === 'pwa-transfer' && (
              <div className="text-center">
                <div className="pwa-icon mx-auto mb-4"></div>
                <p className="text-yellow-300 pixel-text">Magic detected!</p>
                <p className="text-green-300 pixel-text mt-4">You need to open the app to complete authentication</p>
                <button 
                  onClick={openPWA}
                  className="mt-6 px-6 py-3 bg-purple-600 text-white border-b-4 border-purple-800 font-pixel hover:bg-purple-700 transition-colors"
                >
                  OPEN PIXIE WALLET ✨
                </button>
                <p className="text-blue-300 pixel-text mt-4 text-xs">
                  If you haven&apos;t added Pixie Wallet to your home screen yet,
                  please do so first and then click this button.
                </p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-center">
                <div className="success-icon mx-auto mb-4"></div>
                <p className="text-green-300 pixel-text">Authentication successful!</p>
                <p className="text-yellow-300 pixel-text mt-2">Summoning your dashboard...</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <div className="error-icon mx-auto mb-4"></div>
                <p className="text-red-300 pixel-text">Authentication failed</p>
                <p className="text-red-300 pixel-text mt-2">{errorMessage}</p>
                <button 
                  onClick={() => router.push('/login')}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white border-b-4 border-purple-800 font-pixel"
                >
                  RETURN TO LOGIN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
        }
        
        .pixel-text {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.7rem;
          line-height: 1.5;
        }
        
        .pixel-spinner {
          width: 32px;
          height: 32px;
          background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='6' y='3' width='4' height='4' fill='white'/%3E%3Crect x='10' y='3' width='4' height='4' fill='white'/%3E%3Crect x='14' y='3' width='4' height='4' fill='white'/%3E%3Crect x='18' y='3' width='4' height='4' fill='white'/%3E%3Crect x='22' y='3' width='4' height='4' fill='white'/%3E%3Crect x='22' y='7' width='4' height='4' fill='white'/%3E%3Crect x='22' y='11' width='4' height='4' fill='white'/%3E%3Crect x='22' y='15' width='4' height='4' fill='white'/%3E%3Crect x='22' y='19' width='4' height='4' fill='white'/%3E%3Crect x='22' y='23' width='4' height='4' fill='white'/%3E%3Crect x='18' y='23' width='4' height='4' fill='white'/%3E%3Crect x='14' y='23' width='4' height='4' fill='white'/%3E%3Crect x='10' y='23' width='4' height='4' fill='white'/%3E%3Crect x='6' y='23' width='4' height='4' fill='white'/%3E%3Crect x='6' y='19' width='4' height='4' fill='white'/%3E%3Crect x='6' y='15' width='4' height='4' fill='white'/%3E%3Crect x='6' y='11' width='4' height='4' fill='white'/%3E%3Crect x='6' y='7' width='4' height='4' fill='white'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          animation: spin 1s steps(8) infinite;
        }
        
        .success-icon {
          width: 32px;
          height: 32px;
          background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='12' y='16' width='4' height='4' fill='%2322C55E'/%3E%3Crect x='16' y='20' width='4' height='4' fill='%2322C55E'/%3E%3Crect x='20' y='16' width='4' height='4' fill='%2322C55E'/%3E%3Crect x='24' y='12' width='4' height='4' fill='%2322C55E'/%3E%3Crect x='8' y='12' width='16' height='4' fill='%2322C55E'/%3E%3Crect x='8' y='8' width='16' height='4' fill='%2322C55E'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
        }
        
        .error-icon {
          width: 32px;
          height: 32px;
          background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='8' y='8' width='4' height='4' fill='%23EF4444'/%3E%3Crect x='12' y='12' width='4' height='4' fill='%23EF4444'/%3E%3Crect x='16' y='16' width='4' height='4' fill='%23EF4444'/%3E%3Crect x='20' y='12' width='4' height='4' fill='%23EF4444'/%3E%3Crect x='24' y='8' width='4' height='4' fill='%23EF4444'/%3E%3Crect x='12' y='20' width='4' height='4' fill='%23EF4444'/%3E%3Crect x='20' y='20' width='4' height='4' fill='%23EF4444'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
        }
        
        .pwa-icon {
          width: 32px;
          height: 32px;
          background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4' y='4' width='24' height='24' fill='%23805AD5'/%3E%3Crect x='8' y='8' width='16' height='16' fill='%236B46C1'/%3E%3Crect x='12' y='12' width='8' height='8' fill='%23D6BCFA'/%3E%3Crect x='16' y='24' width='4' height='4' fill='%23D6BCFA'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 