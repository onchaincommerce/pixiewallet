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
  const { wallet, isLoading, error, refreshWallet, createWallet, sendTransaction, requestFaucetFunds } = useWallet();
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

  // Loading state
  if (isLoading) {
    return (
      <div className="pixel-container bg-indigo-900 border-8 border-indigo-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto p-6">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // No wallet yet - display wallet creation UI
  if (!wallet) {
    return (
      <div className="bg-indigo-900 border-8 border-indigo-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto">
        <div className="bg-purple-700 border-b-4 border-purple-900 p-4 text-white">
          <h2 className="text-center text-2xl font-bold text-yellow-300 mb-2">PIXIE WALLET</h2>
          <p className="text-center text-blue-300">Powered by Coinbase CDP SDK</p>
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-center mb-6 text-yellow-300">
            Choose your wallet type to begin your adventure!
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="inline-flex" role="group">
              <button
                type="button"
                onClick={() => setWalletCreationMode('eoa')}
                className={`px-6 py-3 text-sm ${
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
                className={`px-6 py-3 text-sm ${
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
              <div className="bg-gray-800 border-4 border-yellow-500 p-3 text-white">
                A basic wallet with a single key.
                <br/>Simple but powerful!
              </div>
            ) : (
              <div className="bg-gray-800 border-4 border-blue-500 p-3 text-white">
                An advanced wallet with special powers.
                <br/>Contract-based magic!
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreateWallet}
            disabled={creating}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50"
          >
            {creating ? 
              <span className="inline-flex items-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></span> SUMMONING...
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
    <div className="bg-indigo-900 border-8 border-indigo-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto">
      <div className="bg-purple-700 border-b-4 border-purple-900 p-4 text-white">
        <h2 className="text-center text-2xl font-bold text-yellow-300 mb-2">PIXIE WALLET</h2>
        <p className="text-center text-blue-300">Powered by Coinbase CDP SDK</p>
      </div>

      <div className="flex border-b-4 border-indigo-700">
        <button
          className={`flex-1 py-3 uppercase ${
            activeTab === 'wallet'
              ? 'bg-purple-600 text-yellow-300 border-b-4 border-purple-800'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
        <button
          className={`flex-1 py-3 uppercase ${
            activeTab === 'send'
              ? 'bg-purple-600 text-yellow-300 border-b-4 border-purple-800'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('send')}
        >
          Send
        </button>
        <button
          className={`flex-1 py-3 uppercase ${
            activeTab === 'activity'
              ? 'bg-purple-600 text-yellow-300 border-b-4 border-purple-800'
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
                  <h3 className="text-sm text-yellow-300">ADDRESS</h3>
                  {wallet.type === 'smart' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-900 text-blue-300 text-xs border-2 border-blue-800">
                      SMART CONTRACT
                    </span>
                  )}
                </div>
                <button 
                  className="text-green-400 text-sm bg-gray-900 border-2 border-gray-700 px-2 py-1 hover:bg-gray-800"
                  onClick={() => navigator.clipboard.writeText(wallet.address)}
                >
                  Copy
                </button>
              </div>
              <p className="text-green-400 break-all text-sm font-mono bg-gray-900 border-2 border-gray-700 p-2 tracking-tighter leading-tight">
                {wallet.address}
              </p>
              
              {wallet.type === 'smart' && wallet.ownerAddress && (
                <div className="mt-3">
                  <h3 className="text-sm text-yellow-300">OWNER ACCOUNT</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-green-400 text-xs break-all font-mono bg-gray-900 border-2 border-gray-700 p-2 flex-1 tracking-tighter leading-tight">
                      {wallet.ownerAddress}
                    </p>
                    <button 
                      className="text-green-400 text-xs bg-gray-900 border-2 border-gray-700 px-2 py-1 hover:bg-gray-800 ml-2"
                      onClick={() => navigator.clipboard.writeText(wallet.ownerAddress || '')}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                <h3 className="text-sm text-yellow-300">NETWORK</h3>
                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-900 text-green-300 border-2 border-green-800">
                  {wallet.networkId}
                </span>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm text-yellow-300">BALANCE</h3>
                <div className="flex items-end">
                  <p className="text-2xl font-bold text-white mt-1 shadow-sm text-shadow-glow">
                    {wallet.balance || '0.0'} ETH
                  </p>
                  <button 
                    onClick={refreshWallet}
                    className="ml-2 text-xs bg-gray-900 border-2 border-gray-700 px-2 py-1 text-blue-400 hover:bg-gray-800"
                    disabled={isLoading}
                  >
                    {isLoading ? '...' : '↻'}
                  </button>
                </div>
                
                {/* Faucet Button */}
                <div className="mt-4">
                  <button
                    onClick={handleRequestFaucet}
                    disabled={isLoading || requestingFunds}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white border-b-4 border-green-800 disabled:opacity-50 text-sm flex justify-center items-center"
                  >
                    {requestingFunds ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></span>
                        REQUESTING...
                      </>
                    ) : (
                      'GET TEST COINS'
                    )}
                  </button>
                  
                  {faucetMessage && (
                    <div className="mt-2 text-sm text-green-300 bg-green-900 border-2 border-green-800 p-2">
                      {faucetMessage}
                    </div>
                  )}
                  
                  {faucetError && (
                    <div className="mt-2 text-sm text-red-300 bg-red-900 border-2 border-red-800 p-2">
                      {faucetError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {wallet.type === 'smart' && (
              <div className="bg-blue-900 border-4 border-blue-800 p-3">
                <p className="text-sm text-blue-300">
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
                <label htmlFor="recipient" className="block text-sm text-yellow-300 mb-1">
                  RECIPIENT ADDRESS
                </label>
                <input
                  id="recipient"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2 border-4 border-gray-700 bg-gray-900 text-green-400 font-mono tracking-tighter"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm text-yellow-300 mb-1">
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
                  className="w-full p-2 border-4 border-gray-700 bg-gray-900 text-green-400 font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleSendTransaction}
              disabled={sendingTx || !recipientAddress || !amount}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white border-b-4 border-blue-800 disabled:opacity-50"
            >
              {sendingTx ? 
                <span className="inline-flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></span>
                  SENDING...
                </span> : 
                'SEND COINS'
              }
            </button>
            
            {txHash && (
              <div className="mt-4 p-3 bg-green-900 border-4 border-green-800">
                <p className="text-green-300 text-sm">
                  ✨ Transaction sent! Hash:
                </p>
                <p className="text-green-300 text-xs font-mono tracking-tighter leading-tight break-all mt-2 bg-green-950 p-2 border-2 border-green-800">
                  {txHash}
                </p>
                <a 
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-xs mt-3 block underline"
                >
                  View on BaseScan
                </a>
              </div>
            )}
            
            {txError && (
              <div className="mt-4 p-3 bg-red-900 border-4 border-red-800">
                <p className="text-red-300 text-sm">
                  Error: {txError}
                </p>
              </div>
            )}
            
            {wallet.type === 'smart' && (
              <div className="mt-4 p-3 bg-blue-900 border-4 border-blue-800">
                <p className="text-sm text-blue-300">
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
              <p className="text-yellow-300">Your adventure log will appear here</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mt-4 bg-red-900 border-4 border-red-800 text-red-300 text-sm">
          Error: {error}
        </div>
      )}

      <style jsx>{`
        .text-shadow-glow {
          text-shadow: 0 0 5px #7DF9FF, 0 0 10px #7DF9FF;
        }
      `}</style>
    </div>
  );
};

export default function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { } = useWallet();
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

  if (authLoading || processingAuth) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div></div>
          <div className="flex items-center space-x-4">
            <span className="text-yellow-300 font-pixel text-xs tracking-wide">
              {user.email}
            </span>
            <button 
              onClick={async () => {
                try {
                  await signOut();
                  router.push('/login');
                } catch (error) {
                  console.error('Error signing out:', error);
                }
              }}
              className="px-3 py-2 pixel-button bg-red-600 hover:bg-red-700 text-white font-pixel text-xs border-b-4 border-red-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletDashboard />
      </main>
    </div>
  );
} 