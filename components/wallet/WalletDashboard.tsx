'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/wallet-context';

export default function WalletDashboard() {
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
      <div className="pixel-container bg-indigo-900 border-8 border-indigo-800 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto p-6">
        <div className="flex justify-center items-center h-48">
          <div className="pixel-spinner h-16 w-16 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // No wallet yet - display wallet creation UI
  if (!wallet) {
    return (
      <div className="pixel-container bg-indigo-900 border-8 border-indigo-800 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto">
        <div className="bg-purple-700 border-b-4 border-purple-900 p-4 text-white">
          <div className="pixel-title text-center my-2">PIXIE WALLET</div>
          <p className="text-center text-yellow-300 pixel-text">Powered by Coinbase CDP SDK</p>
        </div>
        
        <div className="pixel-content p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="pixel-art mb-6">
            <div className="chest-icon mx-auto"></div>
          </div>
          
          <p className="text-center mb-6 text-yellow-300 pixel-text">
            Choose your wallet type to begin your adventure!
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="pixel-buttons-group" role="group">
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
              <div className="bg-gray-800 border-4 border-yellow-500 p-3 text-white pixel-text">
                A basic wallet with a single key.
                <br/>Simple but powerful!
              </div>
            ) : (
              <div className="bg-gray-800 border-4 border-blue-500 p-3 text-white pixel-text">
                An advanced wallet with special powers.
                <br/>Contract-based magic!
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreateWallet}
            disabled={creating}
            className="pixel-button bg-green-500 hover:bg-green-600 text-white font-pixel px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50"
          >
            {creating ? 
              <span className="inline-flex items-center">
                <span className="pixel-spinner-sm mr-2"></span> SUMMONING...
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
    <div className="pixel-container bg-indigo-900 border-8 border-indigo-800 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto">
      <div className="bg-purple-700 border-b-4 border-purple-900 p-4 text-white">
        <div className="pixel-title text-center my-2">PIXIE WALLET</div>
        <p className="text-center text-yellow-300 pixel-text">Powered by Coinbase CDP SDK</p>
      </div>

      <div className="flex border-b-4 border-indigo-700">
        <button
          className={`flex-1 py-3 font-pixel uppercase ${
            activeTab === 'wallet'
              ? 'bg-purple-600 text-yellow-300 border-b-4 border-purple-800'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
        <button
          className={`flex-1 py-3 font-pixel uppercase ${
            activeTab === 'send'
              ? 'bg-purple-600 text-yellow-300 border-b-4 border-purple-800'
              : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
          }`}
          onClick={() => setActiveTab('send')}
        >
          Send
        </button>
        <button
          className={`flex-1 py-3 font-pixel uppercase ${
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
            <div className="bg-gray-800 border-4 border-gray-700 rounded-none p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h3 className="text-sm font-pixel text-yellow-300">ADDRESS</h3>
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
              <p className="text-green-400 break-all text-sm font-mono bg-gray-900 border-2 border-gray-700 p-2 font-pixel tracking-tighter leading-tight">
                {wallet.address}
              </p>
              
              {wallet.type === 'smart' && wallet.ownerAddress && (
                <div className="mt-3">
                  <h3 className="text-sm font-pixel text-yellow-300">OWNER ACCOUNT</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-green-400 text-xs break-all font-mono bg-gray-900 border-2 border-gray-700 p-2 flex-1 font-pixel tracking-tighter leading-tight">
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
                <h3 className="text-sm font-pixel text-yellow-300">NETWORK</h3>
                <span className="inline-flex items-center px-2 py-1 text-xs font-pixel bg-green-900 text-green-300 border-2 border-green-800">
                  {wallet.networkId}
                </span>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-pixel text-yellow-300">BALANCE</h3>
                <div className="flex items-end">
                  <p className="text-2xl font-bold font-pixel text-white mt-1 pixel-glow">
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
                
                {/* Add Faucet Button */}
                <div className="mt-4">
                  <button
                    onClick={handleRequestFaucet}
                    disabled={isLoading || requestingFunds}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white border-b-4 border-green-800 disabled:opacity-50 text-sm font-pixel flex justify-center items-center"
                  >
                    {requestingFunds ? (
                      <>
                        <span className="pixel-spinner-sm mr-2"></span>
                        REQUESTING...
                      </>
                    ) : (
                      'GET TEST COINS'
                    )}
                  </button>
                  
                  {faucetMessage && (
                    <div className="mt-2 text-sm text-green-300 bg-green-900 border-2 border-green-800 p-2 pixel-text">
                      {faucetMessage}
                    </div>
                  )}
                  
                  {faucetError && (
                    <div className="mt-2 text-sm text-red-300 bg-red-900 border-2 border-red-800 p-2 pixel-text">
                      {faucetError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {wallet.type === 'smart' && (
              <div className="bg-blue-900 border-4 border-blue-800 p-3">
                <p className="text-sm text-blue-300 pixel-text">
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
                  className="w-full p-2 border-4 border-gray-700 bg-gray-900 text-green-400 font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleSendTransaction}
              disabled={sendingTx || !recipientAddress || !amount}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white border-b-4 border-blue-800 disabled:opacity-50 font-pixel"
            >
              {sendingTx ? 'CASTING SPELL...' : 'SEND COINS'}
            </button>
            
            {txHash && (
              <div className="mt-4 p-3 bg-green-900 border-4 border-green-800">
                <p className="text-green-300 text-sm pixel-text">
                  ✨ Transaction sent! Hash:
                </p>
                <p className="text-green-300 text-xs font-mono font-pixel tracking-tighter leading-tight break-all mt-2 bg-green-950 p-2 border-2 border-green-800">
                  {txHash}
                </p>
                <a 
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-xs mt-3 block pixel-text underline"
                >
                  View on BaseScan
                </a>
              </div>
            )}
            
            {txError && (
              <div className="mt-4 p-3 bg-red-900 border-4 border-red-800">
                <p className="text-red-300 text-sm pixel-text">
                  Error: {txError}
                </p>
              </div>
            )}
            
            {wallet.type === 'smart' && (
              <div className="mt-4 p-3 bg-blue-900 border-4 border-blue-800">
                <p className="text-sm text-blue-300 pixel-text">
                  Smart Contract wallets cast spells using the UserOperation protocol for maximum magic efficiency.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6 flex justify-center items-center h-60 bg-gray-800 border-4 border-gray-700">
            <div className="pixel-text text-center">
              <div className="scroll-icon mx-auto mb-4"></div>
              <p className="text-yellow-300">Your adventure log will appear here</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mt-4 bg-red-900 border-4 border-red-800 text-red-300 text-sm pixel-text">
          Error: {error}
        </div>
      )}

      <style jsx>{`
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
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.7rem;
          line-height: 1.5;
        }
        .pixel-glow {
          text-shadow: 0 0 5px #7DF9FF, 0 0 10px #7DF9FF;
        }
        
        .pixel-button {
          transition: all 0.1s;
          position: relative;
          top: 0;
        }
        
        .pixel-button:active {
          top: 4px;
          box-shadow: 0px 0px 0px 0px rgba(0,0,0,0.5);
        }
        
        .pixel-spinner {
          width: 32px;
          height: 32px;
          background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='6' y='3' width='4' height='4' fill='white'/%3E%3Crect x='10' y='3' width='4' height='4' fill='white'/%3E%3Crect x='14' y='3' width='4' height='4' fill='white'/%3E%3Crect x='18' y='3' width='4' height='4' fill='white'/%3E%3Crect x='22' y='3' width='4' height='4' fill='white'/%3E%3Crect x='22' y='7' width='4' height='4' fill='white'/%3E%3Crect x='22' y='11' width='4' height='4' fill='white'/%3E%3Crect x='22' y='15' width='4' height='4' fill='white'/%3E%3Crect x='22' y='19' width='4' height='4' fill='white'/%3E%3Crect x='22' y='23' width='4' height='4' fill='white'/%3E%3Crect x='18' y='23' width='4' height='4' fill='white'/%3E%3Crect x='14' y='23' width='4' height='4' fill='white'/%3E%3Crect x='10' y='23' width='4' height='4' fill='white'/%3E%3Crect x='6' y='23' width='4' height='4' fill='white'/%3E%3Crect x='6' y='19' width='4' height='4' fill='white'/%3E%3Crect x='6' y='15' width='4' height='4' fill='white'/%3E%3Crect x='6' y='11' width='4' height='4' fill='white'/%3E%3Crect x='6' y='7' width='4' height='4' fill='white'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          animation: spin 1s steps(8) infinite;
        }
        
        .pixel-spinner-sm {
          width: 16px;
          height: 16px;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='3' y='1' width='2' height='2' fill='white'/%3E%3Crect x='5' y='1' width='2' height='2' fill='white'/%3E%3Crect x='7' y='1' width='2' height='2' fill='white'/%3E%3Crect x='9' y='1' width='2' height='2' fill='white'/%3E%3Crect x='11' y='1' width='2' height='2' fill='white'/%3E%3Crect x='11' y='3' width='2' height='2' fill='white'/%3E%3Crect x='11' y='5' width='2' height='2' fill='white'/%3E%3Crect x='11' y='7' width='2' height='2' fill='white'/%3E%3Crect x='11' y='9' width='2' height='2' fill='white'/%3E%3Crect x='11' y='11' width='2' height='2' fill='white'/%3E%3Crect x='9' y='11' width='2' height='2' fill='white'/%3E%3Crect x='7' y='11' width='2' height='2' fill='white'/%3E%3Crect x='5' y='11' width='2' height='2' fill='white'/%3E%3Crect x='3' y='11' width='2' height='2' fill='white'/%3E%3Crect x='3' y='9' width='2' height='2' fill='white'/%3E%3Crect x='3' y='7' width='2' height='2' fill='white'/%3E%3Crect x='3' y='5' width='2' height='2' fill='white'/%3E%3Crect x='3' y='3' width='2' height='2' fill='white'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          animation: spin 1s steps(8) infinite;
        }
        
        .chest-icon {
          width: 64px;
          height: 64px;
          background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='16' y='32' width='32' height='16' fill='%23A86432'/%3E%3Crect x='16' y='24' width='32' height='8' fill='%238B5524'/%3E%3Crect x='20' y='28' width='24' height='4' fill='%23FFD700'/%3E%3Crect x='28' y='36' width='8' height='8' fill='%23FFD700'/%3E%3Crect x='20' y='44' width='24' height='4' fill='%23C87137'/%3E%3Crect x='16' y='48' width='32' height='4' fill='%23B96331'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
        }
        
        .scroll-icon {
          width: 48px;
          height: 48px;
          background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='12' y='8' width='24' height='32' fill='%23F0E6D2'/%3E%3Crect x='12' y='8' width='24' height='4' fill='%23BFA76F'/%3E%3Crect x='12' y='36' width='24' height='4' fill='%23BFA76F'/%3E%3Crect x='16' y='16' width='16' height='2' fill='%23998456'/%3E%3Crect x='16' y='20' width='16' height='2' fill='%23998456'/%3E%3Crect x='16' y='24' width='8' height='2' fill='%23998456'/%3E%3C/svg%3E");
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