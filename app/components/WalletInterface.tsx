'use client';

import { useState, useEffect } from 'react';
import { createEVMWallet, getWalletDetails, sendTransaction, getTransactionStatus, requestFaucetFunds } from '../actions/wallet-actions';

interface WalletData {
  walletId?: string;
  address?: string;
  networkId?: string;
  error?: string;
  balance?: string;
  isSmartWallet?: boolean;
  ownerAccountId?: string;
}

interface Transaction {
  hash: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export default function WalletInterface() {
  const [walletInfo, setWalletInfo] = useState<WalletData>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletCreationMode, setWalletCreationMode] = useState<'eoa' | 'smart'>('eoa');
  const [showDeploymentProgress, setShowDeploymentProgress] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [requestingFunds, setRequestingFunds] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState('');

  // Define refreshWalletDetails before using it in useEffect
  const refreshWalletDetails = async (id?: string, isSmartWallet?: boolean) => {
    const walletId = id || walletInfo.walletId;
    if (!walletId) {
      setWalletInfo(prev => ({ ...prev, error: 'No wallet ID available' }));
      return;
    }

    setLoading(true);
    try {
      const result = await getWalletDetails(walletId, isSmartWallet || walletInfo.isSmartWallet);
      if (result.success) {
        setWalletInfo(prev => ({
          ...prev,
          walletId: result.walletId,
          address: result.address,
          networkId: result.networkId,
          balance: result.balance || prev.balance,
          isSmartWallet: result.isSmartWallet,
          error: undefined,
        }));
      } else {
        setWalletInfo(prev => ({ ...prev, error: result.error }));
      }
    } catch (_) {
      setWalletInfo(prev => ({ ...prev, error: 'Failed to retrieve wallet details' }));
    } finally {
      setLoading(false);
    }
  };

  // Try to load wallet from localStorage on component mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('superWallet');
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet);
        setWalletInfo(parsed);
        refreshWalletDetails(parsed.walletId, parsed.isSmartWallet);
      } catch (e) {
        console.error('Failed to parse saved wallet', e);
      }
    }
    
    // Load saved transactions
    const savedTxs = localStorage.getItem('superWalletTransactions');
    if (savedTxs) {
      try {
        const parsed = JSON.parse(savedTxs);
        setTransactions(parsed);
      } catch (e) {
        console.error('Failed to parse saved transactions', e);
      }
    }
  }, []);  // Empty dependency array since refreshWalletDetails is defined inside the component

  // Save wallet to localStorage when it changes
  useEffect(() => {
    if (walletInfo.walletId) {
      localStorage.setItem('superWallet', JSON.stringify(walletInfo));
    }
  }, [walletInfo]);
  
  // Save transactions to localStorage when they change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('superWalletTransactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const handleCreateWallet = async (useSmartWallet: boolean = false) => {
    setLoading(true);
    
    if (useSmartWallet) {
      // Show deployment progress for smart wallets
      setShowDeploymentProgress(true);
      setDeploymentStep(1);
      
      // Simulate a slight delay to show progress steps
      await new Promise(resolve => setTimeout(resolve, 800));
      setDeploymentStep(2);
    }
    
    try {
      const result = await createEVMWallet(useSmartWallet);
      
      if (result.success) {
        setWalletInfo({
          walletId: result.walletId,
          address: result.address,
          networkId: result.networkId,
          isSmartWallet: result.isSmartWallet,
          ownerAccountId: result.ownerAccountId,
        });
        
        if (useSmartWallet) {
          setDeploymentStep(3);
          // Hide deployment progress after a delay
          setTimeout(() => {
            setShowDeploymentProgress(false);
          }, 1000);
        }
      } else {
        setWalletInfo({ error: result.error });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setWalletInfo({ error: 'Failed to create wallet' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!walletInfo.address || !recipientAddress || !amount) {
      setWalletInfo(prev => ({ ...prev, error: 'Missing transaction details' }));
      return;
    }
    
    // Show a message for standard EOA wallets, guiding users to use Smart Wallets
    if (!walletInfo.isSmartWallet) {
      setWalletInfo(prev => ({ 
        ...prev, 
        error: 'Direct EOA transactions are coming soon. Please use a Smart Wallet for now.'
      }));
      return;
    }
    
    setLoading(true);
    try {
      const result = await sendTransaction(
        walletInfo.address || '',
        recipientAddress,
        amount,
        walletInfo.isSmartWallet,
        walletInfo.ownerAccountId
      );
      
      if (result.success) {
        // Convert any transaction hash to string to ensure type safety
        const hashString = typeof result.transactionHash === 'string' 
          ? result.transactionHash 
          : String(result.transactionHash || '');
          
        // Add the new transaction to the transactions list
        const newTx: Transaction = {
          hash: hashString,
          to: recipientAddress,
          amount: amount,
          timestamp: Date.now(),
          status: 'pending',
        };
        
        setTransactions(prev => [newTx, ...prev]);
        setTransactionHash(hashString);
        
        // Update the UI to show the transaction tab
        setTimeout(() => {
          setActiveTab('activity');
        }, 1000);
        
        // Reset form
        setRecipientAddress('');
        setAmount('');
        
        // Set up polling to check transaction status
        if (hashString) {
          const pollInterval = setInterval(async () => {
            try {
              const statusResult = await getTransactionStatus(hashString);
              
              if (statusResult.success) {
                if (statusResult.status !== 'pending') {
                  // Transaction is no longer pending, update its status
                  setTransactions(prev => 
                    prev.map(tx => 
                      tx.hash === hashString 
                        ? { ...tx, status: statusResult.status as 'confirmed' | 'failed' } 
                        : tx
                    )
                  );
                  
                  // Clear the interval once we have a final status
                  clearInterval(pollInterval);
                  
                  // Refresh wallet details to get updated balance
                  refreshWalletDetails();
                }
              }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
              console.error('Error polling transaction status:', err);
            }
          }, 3000); // Poll every 3 seconds
          
          // Set a timeout to clear the interval after a reasonable time (2 minutes)
          setTimeout(() => {
            clearInterval(pollInterval);
          }, 120000);
        }
      } else {
        setWalletInfo(prev => ({ ...prev, error: result.error }));
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setWalletInfo(prev => ({ ...prev, error: 'Failed to send transaction' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('superWallet');
    setWalletInfo({});
    setActiveTab('wallet');
  };

  const handleRequestFunds = async () => {
    if (!walletInfo.address) {
      setWalletInfo(prev => ({ ...prev, error: 'No wallet address available' }));
      return;
    }
    
    setRequestingFunds(true);
    setFaucetMessage('');
    
    try {
      const result = await requestFaucetFunds(
        walletInfo.address,
        walletInfo.isSmartWallet || false
      );
      
      if (result.success) {
        setFaucetMessage(`Successfully requested funds! ${result.message || ''}`);
        // Refresh wallet details to show updated balance
        setTimeout(() => refreshWalletDetails(), 3000);
      } else {
        setFaucetMessage(`Failed to request funds: ${result.error || 'Unknown error'}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setFaucetMessage('Error requesting funds from faucet');
    } finally {
      setRequestingFunds(false);
    }
  };

  // Helper to truncate address for display
  const truncateAddress = (address?: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format date for transaction list
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Function to display deployment steps
  const renderDeploymentSteps = () => {
    const steps = [
      { label: 'Creating owner account...' },
      { label: 'Deploying smart wallet contract...' },
      { label: 'Finalizing setup...' },
    ];
    
    return (
      <div className="mt-4 w-full">
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <li 
              key={index} 
              className={`flex items-center space-x-2 ${
                deploymentStep > index 
                  ? 'text-green-600 dark:text-green-400' 
                  : deploymentStep === index 
                    ? 'text-blue-600 dark:text-blue-400 animate-pulse' 
                    : 'text-gray-400'
              }`}
            >
              {deploymentStep > index ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                </svg>
              )}
              <span>{step.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden max-w-md w-full mx-auto">
      {/* Wallet Header */}
      <div className="bg-blue-600 p-4 text-white">
        <h2 className="text-2xl font-bold">Pixie Wallet</h2>
        <p className="text-blue-100">Powered by Coinbase CDP SDK</p>
      </div>

      {!walletInfo.walletId ? (
        // Wallet Creation UI
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-center mb-6 text-gray-600 dark:text-gray-300">
            Create a new wallet to get started
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setWalletCreationMode('eoa')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  walletCreationMode === 'eoa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                EOA Wallet
              </button>
              <button
                type="button"
                onClick={() => setWalletCreationMode('smart')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  walletCreationMode === 'smart'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                Smart Wallet
              </button>
            </div>
          </div>
          
          <div className="mb-6 text-sm text-center">
            {walletCreationMode === 'eoa' ? (
              <p className="text-gray-600 dark:text-gray-400">
                An Externally Owned Account (EOA) is a traditional wallet controlled by a private key.
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                A Smart Wallet is a contract-based wallet with advanced features like account recovery and batched transactions.
              </p>
            )}
          </div>
          
          <button
            onClick={() => handleCreateWallet(walletCreationMode === 'smart')}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium text-lg shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Creating...' : `Create ${walletCreationMode === 'smart' ? 'Smart' : 'EOA'} Wallet`}
          </button>
          
          {showDeploymentProgress && renderDeploymentSteps()}
        </div>
      ) : (
        // Wallet Interface
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 py-3 font-medium text-sm ${
                activeTab === 'wallet'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('wallet')}
            >
              Wallet
            </button>
            <button
              className={`flex-1 py-3 font-medium text-sm ${
                activeTab === 'send'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('send')}
            >
              Send
            </button>
            <button
              className={`flex-1 py-3 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'wallet' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                      {walletInfo.isSmartWallet && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200">
                          Smart Contract
                        </span>
                      )}
                    </div>
                    <button 
                      className="text-blue-500 text-sm hover:text-blue-700"
                      onClick={() => navigator.clipboard.writeText(walletInfo.address || '')}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 break-all text-sm">{walletInfo.address}</p>
                  
                  {walletInfo.isSmartWallet && walletInfo.ownerAccountId && (
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner Account</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400 text-xs break-all">{walletInfo.ownerAccountId}</p>
                        <button 
                          className="text-blue-500 text-xs hover:text-blue-700"
                          onClick={() => navigator.clipboard.writeText(walletInfo.ownerAccountId || '')}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Network</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      {walletInfo.networkId}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {walletInfo.balance || '0.0'} ETH
                      </p>
                      <button 
                        onClick={() => refreshWalletDetails()}
                        className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                        disabled={loading}
                      >
                        {loading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    
                    {/* Add Faucet Button */}
                    <div className="mt-4">
                      <button
                        onClick={handleRequestFunds}
                        disabled={loading || requestingFunds}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex justify-center items-center"
                      >
                        {requestingFunds ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Requesting Funds...
                          </>
                        ) : (
                          'Request Test Funds'
                        )}
                      </button>
                      
                      {faucetMessage && (
                        <p className={`mt-2 text-sm ${faucetMessage.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                          {faucetMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => refreshWalletDetails()}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 text-sm font-medium"
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
                
                {walletInfo.isSmartWallet && (
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      This is a contract wallet on Base Sepolia. You can view it on 
                      <a 
                        href={`https://sepolia.basescan.org/address/${walletInfo.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline ml-1"
                      >
                        BaseScan
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'send' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipient Address
                    </label>
                    <input
                      id="recipient"
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (ETH)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      min="0"
                      step="0.000001"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendTransaction}
                  disabled={loading || !recipientAddress || !amount}
                  className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Sending...' : 'Send Transaction'}
                </button>
                {transactionHash && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      Transaction sent! Hash: {truncateAddress(transactionHash)}
                    </p>
                  </div>
                )}
                
                {walletInfo.isSmartWallet && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      Smart Contract wallets use the UserOperation protocol for transactions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Your transaction history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Sent {tx.amount} ETH
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              To: {truncateAddress(tx.to)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(tx.timestamp)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${tx.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : tx.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 break-all">
                          Hash: {tx.hash}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {walletInfo.error && (
        <div className="p-4 mt-4 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
          Error: {walletInfo.error}
        </div>
      )}
    </div>
  );
} 