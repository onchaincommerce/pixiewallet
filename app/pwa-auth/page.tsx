'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function PwaAuthPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function handleAuth() {
      try {
        // Get the code from the URL
        const code = searchParams.get('code');
        
        // Collect debug information
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
        const userAgent = window.navigator.userAgent;
        const debug = {
          isPWA,
          userAgent,
          href: window.location.href,
          origin: window.location.origin,
          code: code ? code.substring(0, 8) + '...' : null // Only show partial code for security
        };
        setDebugInfo(debug);
        
        console.log('PWA auth debug info:', debug);
        
        if (!code) {
          setStatus('error');
          setErrorMessage('No authentication code found');
          return;
        }
        
        // We're in the PWA, proceed with auth
        console.log('PWA auth: exchanging code for session...');
        const supabase = createBrowserSupabaseClient();
        
        // Try to exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('PWA auth error:', error);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }
        
        if (!data.session) {
          setStatus('error');
          setErrorMessage('No session returned from authentication');
          return;
        }
        
        // Success! We got a session
        setStatus('success');
        console.log('PWA auth: success!');
        
        // Give a moment to show the success message before redirecting
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (error: any) {
        console.error('PWA auth unexpected error:', error);
        setStatus('error');
        setErrorMessage(`Unexpected error: ${error.message}`);
      }
    }
    
    handleAuth();
  }, [searchParams, router]);

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
                <p className="text-yellow-300 pixel-text">Casting authentication spell...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-center">
                <div className="success-icon mx-auto mb-4"></div>
                <p className="text-green-300 pixel-text">Magic link activated!</p>
                <p className="text-yellow-300 pixel-text mt-2">Entering your magical realm...</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <div className="error-icon mx-auto mb-4"></div>
                <p className="text-red-300 pixel-text">Spell failed</p>
                <p className="text-red-300 pixel-text mt-2">{errorMessage}</p>
                <button 
                  onClick={() => router.push('/login')}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white border-b-4 border-purple-800 font-pixel"
                >
                  TRY AGAIN
                </button>
                
                {/* Debug information collapsible section */}
                <div className="mt-6 border-t border-purple-700 pt-4">
                  <details className="text-left">
                    <summary className="text-blue-300 pixel-text text-xs cursor-pointer">Show debug info</summary>
                    <div className="mt-2 bg-gray-900 p-2 rounded text-xs font-mono text-gray-300 text-left overflow-x-auto">
                      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                  </details>
                </div>
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
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 