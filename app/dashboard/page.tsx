'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/contexts/wallet-context';
// Import the WalletDashboard component directly from components folder
// without using path aliases to avoid potential import issues
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { isPwaMode, isMobileDevice } from '@/lib/site-config';

// Enhanced WalletDashboard component with full functionality
const WalletDashboard = () => {
  const { wallet, isLoading, isRefreshing, isTransacting, isFauceting, error, refreshWallet, createWallet, sendTransaction, requestFaucetFunds } = useWallet();
  const [activeTab, setActiveTab] = useState('wallet');
  const [walletCreationMode, setWalletCreationMode] = useState<'eoa' | 'smart'>('smart');
  const [creating, setCreating] = useState(false);
  
  // State for faucet
  const [requestingFunds, setRequestingFunds] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState('');
  const [faucetError, setFaucetError] = useState('');
  
  // State for sending
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [txError, setTxError] = useState('');

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      await createWallet(walletCreationMode);
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setCreating(false);
    }
  };
  
  const handleRequestFaucet = async () => {
    setRequestingFunds(true);
    setFaucetMessage('');
    setFaucetError('');
    
    try {
      const result = await requestFaucetFunds();
      if (result.success) {
        setFaucetMessage(result.message || 'Funds requested successfully. Balance will update shortly.');
      } else {
        setFaucetError(result.error || 'Failed to request funds');
      }
    } catch (error: any) {
      setFaucetError(error.message || 'An error occurred requesting funds');
    } finally {
      setRequestingFunds(false);
    }
  };
  
  const handleSendTransaction = async () => {
    if (!recipientAddress || !amount) {
      setTxError('Please enter recipient address and amount');
      return;
    }
    
    setSendingTx(true);
    setTxHash('');
    setTxError('');
    
    try {
      const result = await sendTransaction(recipientAddress, amount);
      if (result.success && result.transactionHash) {
        setTxHash(result.transactionHash);
        // Reset form fields on success
        setRecipientAddress('');
        setAmount('');
      } else {
        setTxError(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      setTxError(error.message || 'An error occurred sending the transaction');
    } finally {
      setSendingTx(false);
    }
  };
  
  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Loading state - only for initial wallet load when no wallet exists
  if (isLoading && !wallet) {
    return (
      <div className="bg-indigo-900 w-full mx-auto p-6 md:border-8 md:border-indigo-800 md:rounded-lg md:shadow-lg md:max-w-md">
        <div className="flex justify-center items-center h-48">
          <div className="pixel-spinner h-16 w-16"></div>
        </div>
      </div>
    );
  }

  // No wallet yet - display wallet creation UI
  if (!wallet) {
    return (
      <div className="bg-indigo-900 w-full mx-auto md:border-8 md:border-indigo-800 md:rounded-lg md:shadow-lg md:max-w-md">
        <div className="bg-purple-700 border-b-4 border-purple-900 p-4 text-white">
          {/* Remove title here since it's already in the page header */}
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-center mb-6 text-yellow-300 font-pixel">
            Choose your wallet type to begin your adventure!
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="inline-flex" role="group">
              <button
                type="button"
                onClick={() => setWalletCreationMode('eoa')}
                className={`px-6 py-3 text-sm font-pixel ${
                  walletCreationMode === 'eoa'
                    ? 'bg-green-500 text-white border-b-4 border-green-700'
                    : 'bg-gray-800 text-gray-300 border-b-4 border-gray-900'
                }`}
              >
                EOA WALLET
              </button>
              <button
                type="button"
                onClick={() => setWalletCreationMode('smart')}
                className={`px-6 py-3 text-sm font-pixel ${
                  walletCreationMode === 'smart'
                    ? 'bg-blue-500 text-white border-b-4 border-blue-700'
                    : 'bg-gray-800 text-gray-300 border-b-4 border-gray-900'
                }`}
              >
                SMART WALLET
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            {walletCreationMode === 'eoa' ? (
              <div className="bg-gray-800 border-4 border-yellow-500 p-3 text-white font-pixel">
                A basic wallet with a single key.
                <br/>Simple but powerful!
              </div>
            ) : (
              <div className="bg-gray-800 border-4 border-blue-500 p-3 text-white font-pixel">
                An advanced wallet with special powers.
                <br/>Contract-based magic!
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreateWallet}
            disabled={creating}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 shadow-lg disabled:opacity-50 rounded font-pixel pixel-button shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
          >
            {creating ? 
              <span className="inline-flex items-center">
                <span className="pixel-spinner-sm mr-2"></span> <span className="font-pixel">SUMMONING...</span>
              </span> : 
              `CREATE ${walletCreationMode === 'smart' ? 'SMART' : 'EOA'} WALLET`
            }
          </button>
        </div>
      </div>
    );
  }

  // Wallet exists - show wallet UI with tabs
  return (
    <div className="bg-indigo-900 w-full mx-auto md:border-8 md:border-indigo-800 md:rounded-lg md:shadow-lg md:max-w-md relative">
      <div className="bg-purple-700 border-b-4 border-purple-900 p-4 text-white">
        {/* Removed the title here */}
      </div>

      <div className="flex border-b-4 border-indigo-700">
        <button
          className={`flex-1 py-3 uppercase font-pixel ${
            activeTab === 'wallet'
              ? 'bg-purple-600 text-yellow-300'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
        <button
          className={`flex-1 py-3 uppercase font-pixel ${
            activeTab === 'send'
              ? 'bg-purple-600 text-yellow-300'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('send')}
        >
          Send
        </button>
        <button
          className={`flex-1 py-3 uppercase font-pixel ${
            activeTab === 'activity'
              ? 'bg-purple-600 text-yellow-300'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <div className="bg-gray-800 border-4 border-gray-700 p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h3 className="text-sm text-yellow-300 font-pixel">ADDRESS</h3>
                  {wallet.type === 'smart' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-900 text-blue-300 text-xs border-2 border-blue-800 font-pixel">
                      SMART CONTRACT
                    </span>
                  )}
                </div>
                <button 
                  className="text-green-400 text-sm bg-gray-900 border-2 border-gray-700 px-2 py-1 hover:bg-gray-800 font-pixel"
                  onClick={() => navigator.clipboard.writeText(wallet.address)}
                >
                  Copy
                </button>
              </div>
              <p className="text-green-400 break-all text-sm font-mono bg-gray-900 border-2 border-gray-700 p-2 tracking-tighter leading-tight font-pixel">
                {truncateAddress(wallet.address)}
              </p>
              
              {wallet.type === 'smart' && wallet.ownerAddress && (
                <div className="mt-3">
                  <h3 className="text-sm text-yellow-300 font-pixel">OWNER ACCOUNT</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-green-400 text-xs break-all font-mono bg-gray-900 border-2 border-gray-700 p-2 flex-1 tracking-tighter leading-tight font-pixel">
                      {truncateAddress(wallet.ownerAddress)}
                    </p>
                    <button 
                      className="text-green-400 text-xs bg-gray-900 border-2 border-gray-700 px-2 py-1 hover:bg-gray-800 ml-2 font-pixel"
                      onClick={() => navigator.clipboard.writeText(wallet.ownerAddress || '')}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                <h3 className="text-sm text-yellow-300 font-pixel">NETWORK</h3>
                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-900 text-green-300 border-2 border-green-800 font-pixel">
                  {wallet.networkId}
                </span>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-pixel text-yellow-300">BALANCE</h3>
                <div className="flex items-end">
                  <p className="text-2xl font-bold text-white mt-1 text-glow font-pixel">
                    {wallet.balance || '0.0'} ETH
                  </p>
                  <button 
                    onClick={refreshWallet}
                    className="ml-2 text-xs bg-gray-900 border-2 border-gray-700 px-2 py-1 text-blue-400 hover:bg-gray-800 font-pixel"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 
                      <span className="inline-flex items-center">
                        <span className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></span>
                      </span> : 
                      '↻'
                    }
                  </button>
                </div>
                
                {/* Add Faucet Button */}
                <div className="mt-4">
                  <button
                    onClick={handleRequestFaucet}
                    disabled={requestingFunds || isFauceting}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-sm flex justify-center items-center rounded font-pixel pixel-button"
                  >
                    {requestingFunds || isFauceting ? (
                      <>
                        <span className="pixel-spinner-sm mr-2"></span>
                        REQUESTING...
                      </>
                    ) : (
                      'GET TEST COINS'
                    )}
                  </button>
                  
                  {faucetMessage && (
                    <div className="mt-2 text-sm text-green-300 bg-green-900 border-2 border-green-800 p-2 font-pixel">
                      {faucetMessage}
                    </div>
                  )}
                  
                  {faucetError && (
                    <div className="mt-2 text-sm text-red-300 bg-red-900 border-2 border-red-800 p-2 font-pixel">
                      {faucetError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {wallet.type === 'smart' && (
              <div className="bg-blue-900 border-4 border-blue-800 p-3">
                <p className="text-sm text-blue-300 font-pixel">
                  This is a magical contract wallet on Base Sepolia with special powers! It can batch spells and provide gas for your adventures.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'send' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="recipient" className="block text-sm text-yellow-300 mb-1 font-pixel">
                  RECIPIENT ADDRESS
                </label>
                <input
                  id="recipient"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2 border-4 border-gray-700 bg-gray-900 text-green-400 font-mono tracking-tighter font-pixel"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm text-yellow-300 mb-1 font-pixel">
                  AMOUNT (ETH)
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.000001"
                  className="w-full p-2 border-4 border-gray-700 bg-gray-900 text-green-400 font-mono font-pixel"
                />
              </div>
            </div>
            <button
              onClick={handleSendTransaction}
              disabled={sendingTx || isTransacting || !recipientAddress || !amount}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 font-pixel rounded pixel-button"
            >
              {sendingTx || isTransacting ? 
                <span className="inline-flex items-center justify-center">
                  <span className="pixel-spinner-sm mr-2"></span>
                  SENDING...
                </span> : 
                'SEND COINS'
              }
            </button>
            
            {txHash && (
              <div className="mt-4 p-3 bg-green-900 border-4 border-green-800">
                <p className="text-green-300 text-sm font-pixel">
                  ✨ Transaction sent! Hash:
                </p>
                <p className="text-green-300 text-xs font-mono tracking-tighter leading-tight break-all mt-2 bg-green-950 p-2 border-2 border-green-800 font-pixel">
                  {txHash}
                </p>
                <a 
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-xs mt-3 block underline font-pixel"
                >
                  View on BaseScan
                </a>
              </div>
            )}
            
            {txError && (
              <div className="mt-4 p-3 bg-red-900 border-4 border-red-800">
                <p className="text-red-300 text-sm font-pixel">
                  Error: {txError}
                </p>
              </div>
            )}
            
            {wallet.type === 'smart' && (
              <div className="mt-4 p-3 bg-blue-900 border-4 border-blue-800">
                <p className="text-sm text-blue-300 font-pixel">
                  Smart Contract wallets cast spells using the UserOperation protocol for maximum magic efficiency.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6 flex justify-center items-center h-60 bg-gray-800 border-4 border-gray-700">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 opacity-50 border-4 border-yellow-500 rounded-full"></div>
              <p className="text-yellow-300 font-pixel">Your adventure log will appear here</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mt-4 bg-red-900 border-4 border-red-800 text-red-300 text-sm font-pixel">
          Error: {error}
        </div>
      )}

      <style jsx>{`
        .text-glow {
          text-shadow: 0 0 5px #7DF9FF, 0 0 10px #7DF9FF;
        }
      `}</style>
    </div>
  );
};

export default function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { wallet, isLoading: walletLoading, isRefreshing, isTransacting, isFauceting } = useWallet();
  const router = useRouter();
  const [processingAuth, setProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle auth code from local storage (for PWA deep linking)
  useEffect(() => {
    const checkForStoredAuthCode = async () => {
      try {
        // Check if there's a stored auth code from the PWA opener
        const authCode = localStorage.getItem('magiclink_auth_code');
        const timestamp = localStorage.getItem('magiclink_timestamp');
        
        // Only process recent codes (within last 5 minutes)
        const isRecent = timestamp && 
          (Date.now() - parseInt(timestamp)) < 5 * 60 * 1000;
        
        if (authCode && isRecent && !user) {
          console.log('Found stored auth code, attempting to exchange for session');
          setProcessingAuth(true);
          
          const supabase = createBrowserSupabaseClient();
          
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(authCode);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            setAuthError('Failed to authenticate with stored code');
          } else {
            console.log('Successfully authenticated with stored code');
          }
          
          // Clear the stored code regardless of success/failure
          localStorage.removeItem('magiclink_auth_code');
          localStorage.removeItem('magiclink_timestamp');
          
          setProcessingAuth(false);
        }
      } catch (error) {
        console.error('Error processing stored auth code:', error);
        setProcessingAuth(false);
        setAuthError('Error processing authentication');
        
        // Clean up in case of error
        localStorage.removeItem('magiclink_auth_code');
        localStorage.removeItem('magiclink_timestamp');
      }
    };
    
    // Only run this in PWA mode or on mobile
    if (isPwaMode() || isMobileDevice()) {
      checkForStoredAuthCode();
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !processingAuth && !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [user, authLoading, processingAuth, router]);

  // Only show the loading screen for initial auth/user loading, not for wallet operations
  if ((authLoading || processingAuth) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950 pixel-pattern">
        <div className="text-center">
          <div className="pixel-spinner h-16 w-16 mx-auto mb-4"></div>
          <p className="pixel-text text-yellow-300">
            {processingAuth ? 'AUTHENTICATING...' : 'LOADING...'}
          </p>
          
          {authError && (
            <p className="pixel-text text-red-400 mt-4 max-w-xs mx-auto">
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected to login
  }

  return (
    <div className="min-h-screen bg-indigo-950 pixel-pattern relative">
      <div className="stars"></div>
      <header className="bg-purple-800 border-b-4 border-purple-900 shadow-md">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile-friendly header layout */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h1 className="text-xl font-bold text-yellow-300 font-pixel">Pixie Wallet</h1>
              
              {/* Mobile menu button - only visible on small screens */}
              <div className="sm:hidden">
                <button 
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push('/login');
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded border-b-2 border-red-800 font-pixel"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
            
            {/* User info and sign out button - row layout for mobile, more space on desktop */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <div className="bg-indigo-900 border-2 border-indigo-800 rounded px-3 py-1.5 max-w-full">
                <span className="text-yellow-300 text-xs block truncate font-pixel" style={{ maxWidth: '80vw', wordBreak: 'break-all' }}>
                  {user.email}
                </span>
              </div>
              <div className="hidden sm:block z-10">
                <button 
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push('/login');
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded border-b-2 border-red-800 font-pixel pixel-button shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-0 md:px-4 sm:px-6 lg:px-8 py-0 sm:py-8 relative z-0">
        <WalletDashboard />
      </main>
    </div>
  );
} 