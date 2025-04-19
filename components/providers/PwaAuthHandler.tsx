'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePwaAuth } from '@/hooks/usePwaAuth';
import { useAuth } from '@/contexts/auth-context';

// This component doesn't render anything, it just handles PWA authentication
export default function PwaAuthHandler() {
  const { isProcessing, isSuccess, error } = usePwaAuth();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // If authentication is successful, redirect to dashboard
  useEffect(() => {
    if (isSuccess) {
      console.log('PWA auth successful, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [isSuccess, router]);
  
  // If there's an error, show a notification or handle it
  useEffect(() => {
    if (error) {
      console.error('PWA auth error:', error);
      
      // Optionally, you could show a toast notification here
      // or redirect to an error page
    }
  }, [error]);
  
  return null; // This component doesn't render anything
} 