'use client';

import { useState, useEffect } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { isMobileDevice, isPwaMode } from '@/lib/site-config';

export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  
  useEffect(() => {
    // Use our utility functions for consistency
    setIsMobile(isMobileDevice());
    setIsPwa(isPwaMode());
    
    console.log('Device detection:', { 
      isMobile: isMobileDevice(), 
      isPwa: isPwaMode() 
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 px-4 pixel-pattern relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="stars"></div>
      </div>
      
      {isMobile && !isPwa ? (
        <div className="w-full max-w-md mx-auto p-6 pixel-container relative z-20">
          <div className="pixel-border bg-indigo-900 p-6 border-8 border-purple-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-8">
              <h2 className="pixel-title text-center text-2xl font-bold mb-2">PIXIE WALLET</h2>
              <div className="divider-pixel mb-4 mt-2"></div>
              <p className="mt-2 text-yellow-300 pixel-text">Your Magical Crypto Adventure Awaits!</p>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="pwa-icon mx-auto mb-4"></div>
                <p className="text-green-300 pixel-text">Add Pixie Wallet to your home screen to begin your journey</p>
              </div>
              
              {/* iOS Instructions */}
              <div className="bg-indigo-950 border-4 border-indigo-800 p-4 mt-6">
                <h3 className="text-yellow-300 pixel-text mb-2">HOW TO INSTALL:</h3>
                <div className="space-y-2 text-white pixel-text text-xs">
                  <p className="flex items-baseline">
                    <span className="text-green-400 mr-2">1.</span> 
                    <span>Tap the share button in your browser</span>
                  </p>
                  <p className="flex items-baseline">
                    <span className="text-green-400 mr-2">2.</span> 
                    <span>Scroll down and select "Add to Home Screen"</span>
                  </p>
                  <p className="flex items-baseline">
                    <span className="text-green-400 mr-2">3.</span> 
                    <span>Open the app from your home screen to continue</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => setIsPwa(false)} // This is just for testing; in real usage the isPwa detection should work
                  className="w-full pixel-button bg-blue-600 hover:bg-blue-700 text-white font-pixel px-4 py-3 border-b-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                >
                  CONTINUE ANYWAY
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <AuthForm />
      )}
      
      <style jsx>{`
        .pixel-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234B0082' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
          image-rendering: pixelated;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
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
        
        .pixel-container {
          image-rendering: pixelated;
        }
        
        .pixel-title {
          font-family: 'Press Start 2P', system-ui, sans-serif;
          font-size: 1.5rem;
          line-height: 1.5;
          letter-spacing: 0.05em;
          color: #FFD700;
          text-shadow: 3px 3px 0px #000;
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
        
        .pwa-icon {
          width: 64px;
          height: 64px;
          background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='64' height='64' rx='12' fill='%23312E81'/%3E%3Crect x='12' y='12' width='40' height='40' rx='4' fill='%235B21B6'/%3E%3Crect x='20' y='20' width='24' height='24' fill='%23FBBF24'/%3E%3Crect x='28' y='12' width='8' height='8' fill='%23FBBF24'/%3E%3Crect x='28' y='44' width='8' height='8' fill='%23FBBF24'/%3E%3Crect x='12' y='28' width='8' height='8' fill='%23FBBF24'/%3E%3Crect x='44' y='28' width='8' height='8' fill='%23FBBF24'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
        }
        
        .pixel-button {
          transition: all 0.1s;
          position: relative;
          top: 0;
        }
        
        .pixel-button:active {
          top: 4px;
          box-shadow: 0px 0px 0px 0px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
} 