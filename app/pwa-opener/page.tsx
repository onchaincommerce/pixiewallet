'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSiteUrl } from '@/lib/site-config';

export default function PwaOpenerPage() {
  const [countdown, setCountdown] = useState(5);
  const [authCodeStored, setAuthCodeStored] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Get the authentication code from URL
    const code = searchParams.get('code');
    
    if (!code) {
      console.error('No authentication code provided');
      router.push('/login');
      return;
    }
    
    // Store the auth code temporarily in localStorage so the PWA can access it
    localStorage.setItem('magiclink_auth_code', code);
    localStorage.setItem('magiclink_timestamp', Date.now().toString());
    
    console.log('Auth code stored for PWA');
    setAuthCodeStored(true);
    
    // Check if already running as PWA
    const isPwa = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    console.log('Is PWA already:', isPwa);
    
    // If already in PWA, we can redirect faster
    if (isPwa) {
      console.log('Already in PWA, redirecting immediately');
      setTimeout(() => openPWA(), 1000);
      return;
    }
    
    // If not in PWA, show help automatically after a short delay
    setTimeout(() => setShowHelp(true), 2000);
    
    // Start countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Attempt to open the PWA
          openPWA();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [searchParams, router]);
  
  // Function to open the PWA
  const openPWA = () => {
    const appUrl = getSiteUrl();
    const pwaUrl = `${appUrl}/dashboard`;
    
    // Try to open the PWA
    console.log('Opening PWA:', pwaUrl);
    window.location.href = pwaUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="stars"></div>
      </div>
      
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="bg-indigo-900 p-6 border-8 border-purple-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h2 className="text-center text-2xl font-bold mb-2 text-yellow-300 font-pixel">PIXIE WALLET</h2>
            <div className="divider-pixel mb-4 mt-2"></div>
            
            {authCodeStored ? (
              <>
                <div className="portal-icon mx-auto mb-6 animate-pulse"></div>
                
                <p className="text-yellow-300 pixel-text">Magic link activated!</p>
                <p className="text-green-300 pixel-text mt-4">
                  {countdown > 0 
                    ? "Opening your wallet app..." 
                    : "Redirecting to wallet..."}
                </p>
                
                {countdown > 0 && (
                  <div className="mt-4 text-3xl text-white font-pixel">
                    {countdown}
                  </div>
                )}
                
                <button 
                  onClick={openPWA}
                  className="mt-6 px-6 py-3 bg-purple-600 text-white border-b-4 border-purple-800 font-pixel hover:bg-purple-700 transition-colors w-full"
                >
                  OPEN NOW
                </button>
              </>
            ) : (
              <div className="text-yellow-300 pixel-text">
                Loading...
              </div>
            )}
            
            <div className={`mt-8 text-blue-300 pixel-text text-sm border-4 border-blue-800 bg-blue-950 p-4 ${showHelp ? 'block' : 'hidden'}`}>
              <p>To complete login:</p>
              <div className="mt-4 text-left space-y-2">
                <p className="flex items-baseline">
                  <span className="text-yellow-400 mr-2">1.</span>
                  <span>Add this app to your Home Screen first</span>
                </p>
                <p className="flex items-baseline">
                  <span className="text-yellow-400 mr-2">2.</span>
                  <span>Open the app from your Home Screen</span>
                </p>
                <p className="flex items-baseline">
                  <span className="text-yellow-400 mr-2">3.</span>
                  <span>You'll be automatically signed in</span>
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                className="text-sm text-purple-300 pixel-text underline"
                onClick={() => setShowHelp(!showHelp)}
              >
                {showHelp ? "Hide installation help" : "Need help installing?"}
              </button>
              
              {showHelp && (
                <div className="mt-4 text-left bg-indigo-950 border-4 border-indigo-800 p-4">
                  <h3 className="text-yellow-300 pixel-text mb-2">On iOS Safari:</h3>
                  <div className="space-y-1 text-white pixel-text text-xs">
                    <p>1. Tap the share icon ⬆️</p>
                    <p>2. Scroll down to "Add to Home Screen"</p>
                    <p>3. Tap "Add" in the top-right corner</p>
                  </div>
                  
                  <h3 className="text-yellow-300 pixel-text mt-4 mb-2">On Android Chrome:</h3>
                  <div className="space-y-1 text-white pixel-text text-xs">
                    <p>1. Tap the menu icon ⋮</p>
                    <p>2. Tap "Add to Home screen"</p>
                    <p>3. Tap "Add" to confirm</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stars {
          width: 100%;
          height: 100%;
          position: absolute;
          background-image: 
            radial-gradient(1px 1px at 10px 10px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 150px 150px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 300px 300px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 400px 400px, white, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 80px 180px, white, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 250px 100px, white, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 450px 280px, white, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 500px 500px;
          animation: twinkle 4s ease infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
        }
        
        .pixel-text {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.7rem;
          line-height: 1.5;
        }
        
        .divider-pixel {
          height: 4px;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='4' viewBox='0 0 16 4' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%23FFD700'/%3E%3Crect x='8' width='4' height='4' fill='%23FFD700'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          background-size: 16px 4px;
          margin: 0 auto;
          width: 80%;
        }
        
        .portal-icon {
          width: 64px;
          height: 64px;
          background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='32' cy='32' rx='24' ry='24' fill='%236B46C1'/%3E%3Cellipse cx='32' cy='32' rx='16' ry='16' fill='%234C1D95'/%3E%3Cellipse cx='32' cy='32' rx='8' ry='8' fill='%238B5CF6'/%3E%3Crect x='31' y='48' width='2' height='8' fill='%23D8B4FE'/%3E%3Crect x='31' y='8' width='2' height='8' fill='%23D8B4FE'/%3E%3Crect x='48' y='33' width='2' height='8' transform='rotate(-90 48 33)' fill='%23D8B4FE'/%3E%3Crect x='8' y='33' width='2' height='8' transform='rotate(-90 8 33)' fill='%23D8B4FE'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          margin: 0 auto;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
} 