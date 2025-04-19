'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function DebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true);
        
        // Client-side check
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Also fetch server-side check
        const serverResponse = await fetch('/api/auth/debug');
        const serverData = await serverResponse.json();
        
        setSessionData({
          clientSession: data.session ? {
            user: data.session.user,
            expires_at: data.session.expires_at,
          } : null,
          serverSession: serverData
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      {loading ? (
        <p>Loading session data...</p>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          <p>Error: {error}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Client-side Session</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto mb-6">
            {JSON.stringify(sessionData?.clientSession, null, 2)}
          </pre>
          
          <h2 className="text-xl font-semibold mb-2">Server-side Session</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(sessionData?.serverSession, null, 2)}
          </pre>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Actions</h2>
            <div className="flex space-x-4">
              <a 
                href="/dashboard" 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Dashboard
              </a>
              <a 
                href="/login" 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Go to Login
              </a>
              <button 
                onClick={async () => {
                  const supabase = createBrowserSupabaseClient();
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 