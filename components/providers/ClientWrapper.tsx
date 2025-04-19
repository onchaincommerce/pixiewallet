'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { WalletProvider } from '@/contexts/wallet-context';
import { Providers } from '@/app/providers';

// Simple PWA Auth Handler component
const PwaAuthHandler = () => {
  const [isHandled, setIsHandled] = useState(false);

  useEffect(() => {
    // Check if there's any auth code in URL or localStorage that needs to be handled
    const checkForAuthCode = async () => {
      try {
        // Logic to handle auth code would go here in a real implementation
        console.log('PWA Auth Handler: checking for auth code');
        
        // Mark as handled so we don't check again
        setIsHandled(true);
      } catch (error) {
        console.error('Error in PWA auth handling:', error);
      }
    };

    if (!isHandled) {
      checkForAuthCode();
    }
  }, [isHandled]);

  return null; // This component doesn't render anything
};

interface ClientWrapperProps {
  children: React.ReactNode;
}

// Define an interface for Navigator with standalone property 
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  // Check if we're in standalone mode (PWA)
  const isPwa = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
  
  // Log some diagnostic info in development
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('Client environment:');
      console.log('- Running as PWA:', isPwa ? 'Yes' : 'No');
      console.log('- Window location:', window.location.href);
      console.log('- User agent:', window.navigator.userAgent);
    }
  }, [isPwa]);

  return (
    <AuthProvider>
      <WalletProvider>
        {/* Add PWA auth handler that will automatically authenticate if code is present */}
        {isPwa && <PwaAuthHandler />}
        <Providers>{children}</Providers>
      </WalletProvider>
    </AuthProvider>
  );
} 