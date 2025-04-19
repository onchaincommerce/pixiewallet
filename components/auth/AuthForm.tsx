'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { getAuthCallbackUrl, isMobileDevice } from '@/lib/site-config';

export default function AuthForm() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [redirectUrl, setRedirectUrl] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Calculate the redirect URL and check if mobile
  useEffect(() => {
    // Get the auth callback URL using our utility
    const callbackUrl = getAuthCallbackUrl();
    
    // Detect if on mobile
    const mobileDevice = isMobileDevice();
    
    // Enhanced logging for debugging
    console.log('Auth configuration:');
    console.log('- Auth callback URL:', callbackUrl);
    console.log('- Window location origin:', window.location.origin);
    console.log('- NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
    console.log('- Mobile device:', mobileDevice ? 'Yes' : 'No');
    
    setRedirectUrl(callbackUrl);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Signing in with email:', email);
      
      // Always use OTP flow for all devices
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: undefined,
          shouldCreateUser: true
        }
      });
      
      if (error) throw error;
      
      setShowOtpInput(true);
      setMessage('Verification code sent! Check your email inbox');
      console.log('OTP code sent successfully');
    } catch (error: any) {
      console.error('Error sending auth email:', error);
      setMessage(`Error: ${error.message || 'Could not send verification email'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setMessage('');
    
    try {
      console.log('Verifying OTP code');
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      if (error) throw error;
      
      console.log('OTP verified successfully');
      setMessage('Login successful!');
      
      // Redirect to dashboard after successful OTP verification
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setMessage(`Error: ${error.message || 'Invalid verification code'}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 pixel-container relative z-20">
      <div className="pixel-border bg-indigo-900 p-6 border-8 border-purple-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <h2 className="pixel-title text-center text-2xl font-bold mb-2">PIXIE WALLET</h2>
          <div className="divider-pixel mb-4 mt-2"></div>
          {!showOtpInput ? (
            <p className="mt-2 text-yellow-300 pixel-text">Enter your email to begin your magical adventure</p>
          ) : (
            <p className="mt-2 text-yellow-300 pixel-text">Enter the verification code from your email</p>
          )}
        </div>
        
        {!showOtpInput ? (
          // Email form
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-pixel mb-1 text-yellow-300">EMAIL ADDRESS</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="wizard@example.com"
                required
                className="w-full p-2 border-4 border-purple-800 bg-indigo-950 text-green-400 font-mono pixel-input tracking-tighter"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full pixel-button bg-purple-600 hover:bg-purple-700 text-white font-pixel mt-4 px-4 py-3 border-b-4 border-purple-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="pixel-spinner-sm mr-2"></span> SENDING...
                </span>
              ) : (
                'SEND VERIFICATION CODE'
              )}
            </button>
          </form>
        ) : (
          // OTP verification form
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-pixel mb-1 text-yellow-300">VERIFICATION CODE</label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full p-2 border-4 border-purple-800 bg-indigo-950 text-green-400 font-mono pixel-input tracking-tighter text-center text-2xl letter-spacing-wide"
              />
            </div>
            
            <button
              type="submit"
              disabled={verifying || token.length < 6}
              className="w-full pixel-button bg-purple-600 hover:bg-purple-700 text-white font-pixel mt-4 px-4 py-3 border-b-4 border-purple-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] disabled:opacity-50"
            >
              {verifying ? (
                <span className="inline-flex items-center">
                  <span className="pixel-spinner-sm mr-2"></span> VERIFYING...
                </span>
              ) : (
                'VERIFY CODE'
              )}
            </button>
            
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowOtpInput(false);
                  setToken('');
                  setMessage('');
                }}
                className="text-blue-300 underline pixel-text text-xs"
              >
                Back to email
              </button>
            </div>
          </form>
        )}
        
        {message && (
          <div className={`mt-4 p-3 border-4 ${message.includes('Error') ? 'bg-red-900 border-red-800 text-red-300' : 'bg-green-900 border-green-800 text-green-300'} pixel-text text-sm`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-center text-xs pixel-text text-blue-300">
          <div className="coin-icon mx-auto mb-2"></div>
          <p>By signing up, you agree to our Terms & Privacy Policy</p>
        </div>
      </div>

      <style jsx>{`
        .pixel-container {
          image-rendering: pixelated;
        }
        
        .pixel-border {
          position: relative;
        }
        
        .divider-pixel {
          height: 4px;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='4' viewBox='0 0 16 4' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%23FFD700'/%3E%3Crect x='8' width='4' height='4' fill='%23FFD700'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          background-size: 16px 4px;
          margin: 0 auto;
          width: 80%;
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
        
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.7rem;
          line-height: 1.5;
        }
        
        .pixel-input {
          outline: none;
          font-family: 'Press Start 2P', monospace;
          font-size: 0.7rem;
        }
        
        .pixel-input:focus {
          box-shadow: 0 0 0 2px #FFD700;
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
        
        .pixel-spinner-sm {
          width: 16px;
          height: 16px;
          display: inline-block;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='3' y='1' width='2' height='2' fill='white'/%3E%3Crect x='5' y='1' width='2' height='2' fill='white'/%3E%3Crect x='7' y='1' width='2' height='2' fill='white'/%3E%3Crect x='9' y='1' width='2' height='2' fill='white'/%3E%3Crect x='11' y='1' width='2' height='2' fill='white'/%3E%3Crect x='11' y='3' width='2' height='2' fill='white'/%3E%3Crect x='11' y='5' width='2' height='2' fill='white'/%3E%3Crect x='11' y='7' width='2' height='2' fill='white'/%3E%3Crect x='11' y='9' width='2' height='2' fill='white'/%3E%3Crect x='11' y='11' width='2' height='2' fill='white'/%3E%3Crect x='9' y='11' width='2' height='2' fill='white'/%3E%3Crect x='7' y='11' width='2' height='2' fill='white'/%3E%3Crect x='5' y='11' width='2' height='2' fill='white'/%3E%3Crect x='3' y='11' width='2' height='2' fill='white'/%3E%3Crect x='3' y='9' width='2' height='2' fill='white'/%3E%3Crect x='3' y='7' width='2' height='2' fill='white'/%3E%3Crect x='3' y='5' width='2' height='2' fill='white'/%3E%3Crect x='3' y='3' width='2' height='2' fill='white'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          animation: spin 1s steps(8) infinite;
        }
        
        .coin-icon {
          width: 24px;
          height: 24px;
          background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='8' y='4' width='8' height='2' fill='%23FFD700'/%3E%3Crect x='6' y='6' width='12' height='2' fill='%23FFD700'/%3E%3Crect x='6' y='8' width='12' height='2' fill='%23FFD700'/%3E%3Crect x='6' y='10' width='12' height='2' fill='%23FFD700'/%3E%3Crect x='6' y='12' width='12' height='2' fill='%23FFD700'/%3E%3Crect x='6' y='14' width='12' height='2' fill='%23FFD700'/%3E%3Crect x='6' y='16' width='12' height='2' fill='%23FFD700'/%3E%3Crect x='8' y='18' width='8' height='2' fill='%23FFD700'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
        }
        
        .letter-spacing-wide {
          letter-spacing: 0.25em;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 