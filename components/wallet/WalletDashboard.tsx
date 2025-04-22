'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { useRouter } from 'next/navigation';

export default function WalletDashboard() {
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
  
  // Helper function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Full screen loading state only for initial wallet load
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
          {/* Removed the title here */}
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
            disabled={creating || isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 shadow-lg disabled:opacity-50 rounded font-pixel pixel-button shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
          >
            {creating || isLoading ? 
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
                  <h3 className="text-sm font-pixel text-yellow-300">ADDRESS</h3>
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
              <div className="break-all text-sm mb-4 font-pixel">
                {wallet.address ? truncateAddress(wallet.address) : 'No wallet connected'}
              </div>
              
              {wallet.type === 'smart' && wallet.ownerAddress && (
                <div className="mt-3">
                  <h3 className="text-sm font-pixel text-yellow-300">OWNER ACCOUNT</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-green-400 text-xs font-pixel bg-gray-900 border-2 border-gray-700 p-2 flex-1 tracking-tighter leading-tight">
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
                <h3 className="text-sm font-pixel text-yellow-300">NETWORK</h3>
                <span className="inline-flex items-center px-2 py-1 text-xs font-pixel bg-green-900 text-green-300 border-2 border-green-800">
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
                <label htmlFor="recipient" className="block text-sm font-pixel text-yellow-300 mb-1">
                  RECIPIENT ADDRESS
                </label>
                <input
                  id="recipient"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2 border-4 border-gray-700 bg-gray-900 text-green-400 font-mono font-pixel tracking-tighter"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-pixel text-yellow-300 mb-1">
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
                <p className="text-green-300 text-xs font-pixel font-mono tracking-tighter leading-tight break-all mt-2 bg-green-950 p-2 border-2 border-green-800">
                  {truncateAddress(txHash)}
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
} 