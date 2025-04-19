# Super Wallet Implementation Guide

This guide outlines the steps to implement the Super Wallet application using the Coinbase Developer Platform SDK.

## Project Setup

1. **Create a Next.js project with TypeScript**:

```bash
npx create-next-app@latest super_wallet --typescript
cd super_wallet
```

2. **Install required dependencies**:

```bash
npm install @coinbase/wallet-sdk axios react-icons tailwindcss postcss autoprefixer
```

3. **Initialize Tailwind CSS**:

```bash
npx tailwindcss init -p
```

4. **Configure environment variables**:

Create a `.env.local` file:

```
NEXT_PUBLIC_COINBASE_API_KEY=your_api_key
```

## Project Structure

Organize the project with this folder structure:

```
super_wallet/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AccountsList.tsx
│   ├── CreateAccount.tsx
│   ├── CreateSmartWallet.tsx
│   ├── Header.tsx
│   ├── SendTransaction.tsx
│   ├── SmartWalletList.tsx
│   ├── TransactionHistory.tsx
│   └── WalletDashboard.tsx
├── contexts/
│   └── WalletContext.tsx
├── hooks/
│   ├── useCoinbaseSDK.ts
│   └── useTransactions.ts
├── lib/
│   ├── api.ts
│   └── utils.ts
├── public/
│   ├── logo.svg
│   └── favicon.ico
└── styles/
    └── components.css
```

## SDK Integration

### Step 1: Create a custom hook for SDK access

Create a custom hook in `hooks/useCoinbaseSDK.ts`:

```typescript
import { useState, useEffect } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

export function useCoinbaseSDK() {
  const [sdk, setSdk] = useState<CoinbaseWalletSDK | null>(null);
  const [client, setClient] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSDK = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const sdkInstance = new CoinbaseWalletSDK({
        appName: 'Super Wallet',
        appLogoUrl: '/logo.svg',
        apiKey: process.env.NEXT_PUBLIC_COINBASE_API_KEY as string,
      });
      
      setSdk(sdkInstance);
      
      const clientInstance = await sdkInstance.connect();
      setClient(clientInstance);

      return clientInstance;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize SDK');
      console.error('SDK initialization error:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    sdk,
    client,
    isConnecting,
    error,
    initializeSDK,
  };
}
```

### Step 2: Create a context provider for wallet state

Create a context provider in `contexts/WalletContext.tsx`:

```typescript
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useCoinbaseSDK } from '../hooks/useCoinbaseSDK';

interface Account {
  id: string;
  address: string;
  chainId: string;
  name?: string;
  balance?: string;
}

interface SmartWallet {
  id: string;
  address?: string;
  status: 'pending' | 'deployed' | 'failed';
  ownerAccountId: string;
  chainId: string;
  name?: string;
}

interface WalletContextType {
  accounts: Account[];
  smartWallets: SmartWallet[];
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  refreshSmartWallets: () => Promise<void>;
  createAccount: (name: string, chainId: string) => Promise<Account | null>;
  createSmartWallet: (name: string, chainId: string, ownerId: string) => Promise<SmartWallet | null>;
  selectAccount: (account: Account) => void;
  getClient: () => any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { client, initializeSDK, isConnecting } = useCoinbaseSDK();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [smartWallets, setSmartWallets] = useState<SmartWallet[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSDK().then(client => {
      if (client) {
        refreshAccounts();
        refreshSmartWallets();
      }
    });
  }, []);

  const refreshAccounts = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const accountList = await client.listAccounts();
      setAccounts(accountList);
      if (accountList.length > 0 && !selectedAccount) {
        setSelectedAccount(accountList[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSmartWallets = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const walletList = await client.listSmartWallets();
      setSmartWallets(walletList);
    } catch (err: any) {
      setError(err.message || 'Failed to load smart wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (name: string, chainId: string) => {
    if (!client) return null;
    setIsLoading(true);
    try {
      const newAccount = await client.createAccount({
        name,
        chainId,
      });
      await refreshAccounts();
      return newAccount;
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createSmartWallet = async (name: string, chainId: string, ownerId: string) => {
    if (!client) return null;
    setIsLoading(true);
    try {
      const smartWallet = await client.createSmartWallet({
        name,
        chainId,
        owner: ownerId,
      });
      await refreshSmartWallets();
      return smartWallet;
    } catch (err: any) {
      setError(err.message || 'Failed to create smart wallet');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
  };

  const getClient = () => client;

  return (
    <WalletContext.Provider
      value={{
        accounts,
        smartWallets,
        selectedAccount,
        isLoading: isLoading || isConnecting,
        error,
        refreshAccounts,
        refreshSmartWallets,
        createAccount,
        createSmartWallet,
        selectAccount,
        getClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
```

## Component Implementation

### Step 1: Create Account Component

Create a component to allow users to create EOA accounts:

```typescript
// components/CreateAccount.tsx
import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

export default function CreateAccount() {
  const [name, setName] = useState('');
  const [chainId, setChainId] = useState('eip155:1'); // Default to Ethereum Mainnet
  const [isCreating, setIsCreating] = useState(false);
  const { createAccount } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createAccount(name, chainId);
      setName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Create EOA Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Account Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Network</label>
          <select
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="eip155:1">Ethereum Mainnet</option>
            <option value="eip155:5">Ethereum Goerli</option>
            <option value="eip155:8453">Base Mainnet</option>
            <option value="eip155:84531">Base Goerli</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isCreating || !name}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isCreating ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
```

### Step 2: Create Smart Wallet Component

Create a component for creating Smart Wallets:

```typescript
// components/CreateSmartWallet.tsx
import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

export default function CreateSmartWallet() {
  const [name, setName] = useState('');
  const [chainId, setChainId] = useState('eip155:1'); // Default to Ethereum Mainnet
  const [ownerId, setOwnerId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const { createSmartWallet, accounts, getClient } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setDeploymentStep(1);
    
    try {
      const smartWallet = await createSmartWallet(name, chainId, ownerId);
      
      if (smartWallet) {
        setDeploymentStep(2);
        
        // Deploy the wallet
        const client = getClient();
        const deployTx = await client.deploySmartWallet(smartWallet.id);
        
        // Poll for deployment status
        const checkDeployment = async () => {
          try {
            const txStatus = await client.getTransaction(deployTx.id);
            
            if (txStatus.status === 'confirmed') {
              setDeploymentStep(3);
              setIsCreating(false);
            } else if (txStatus.status === 'failed') {
              setIsCreating(false);
              console.error('Deployment failed');
            } else {
              setTimeout(checkDeployment, 3000); // Poll every 3 seconds
            }
          } catch (error) {
            console.error('Error checking deployment:', error);
            setIsCreating(false);
          }
        };
        
        checkDeployment();
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Create Smart Wallet</h2>
      
      {deploymentStep === 0 && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Wallet Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Network</label>
            <select
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="eip155:1">Ethereum Mainnet</option>
              <option value="eip155:5">Ethereum Goerli</option>
              <option value="eip155:8453">Base Mainnet</option>
              <option value="eip155:84531">Base Goerli</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Owner Account</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an owner account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name || account.address.substring(0, 10) + '...'}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={isCreating || !name || !ownerId}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isCreating ? 'Creating...' : 'Create Smart Wallet'}
          </button>
        </form>
      )}
      
      {deploymentStep > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-3">Deployment Progress</h3>
          <div className="flex flex-col gap-2">
            <div className={`flex items-center ${deploymentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${deploymentStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {deploymentStep >= 1 ? '✓' : '1'}
              </div>
              Creating wallet
            </div>
            <div className={`flex items-center ${deploymentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${deploymentStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {deploymentStep >= 2 ? '✓' : '2'}
              </div>
              Initiating deployment
            </div>
            <div className={`flex items-center ${deploymentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${deploymentStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {deploymentStep >= 3 ? '✓' : '3'}
              </div>
              {deploymentStep >= 3 ? 'Deployment complete!' : 'Waiting for confirmation...'}
            </div>
          </div>
          
          {deploymentStep < 3 && (
            <div className="mt-4">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(deploymentStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Send Transaction Component

Create a component for sending transactions:

```typescript
// components/SendTransaction.tsx
import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

export default function SendTransaction() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  
  const { selectedAccount, getClient } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    
    setIsSending(true);
    setError('');
    setTxHash('');
    
    try {
      const client = getClient();
      
      const transaction = {
        from: selectedAccount.id,
        to: recipient,
        value: amount,
        chainId: selectedAccount.chainId
      };
      
      const response = await client.signAndSendTransaction(transaction);
      setTxHash(response.hash);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedAccount) {
    return <div>Please select an account first</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Send Transaction</h2>
      
      <div className="mb-4 p-3 bg-gray-100 rounded-md">
        <p className="text-sm text-gray-600">From</p>
        <p className="font-medium">{selectedAccount.name || selectedAccount.address}</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Amount (ETH)</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.01"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSending}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSending ? 'Sending...' : 'Send Transaction'}
        </button>
      </form>
      
      {txHash && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          <p className="font-medium">Transaction sent!</p>
          <p className="text-sm break-all">Hash: {txHash}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Main Dashboard Component

Create a dashboard that integrates all the components:

```typescript
// components/WalletDashboard.tsx
import { useWallet } from '../contexts/WalletContext';
import { useState, useEffect } from 'react';
import CreateAccount from './CreateAccount';
import CreateSmartWallet from './CreateSmartWallet';
import SendTransaction from './SendTransaction';

export default function WalletDashboard() {
  const { accounts, smartWallets, selectedAccount, selectAccount, refreshAccounts, refreshSmartWallets, isLoading } = useWallet();
  const [activeTab, setActiveTab] = useState('accounts');

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccounts();
      refreshSmartWallets();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshAccounts, refreshSmartWallets]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
            {isLoading && accounts.length === 0 ? (
              <p>Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <p>No accounts found. Create your first account.</p>
            ) : (
              <div className="space-y-2">
                {accounts.map(account => (
                  <div 
                    key={account.id}
                    className={`p-3 rounded-md cursor-pointer hover:bg-gray-100 ${selectedAccount?.id === account.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                    onClick={() => selectAccount(account)}
                  >
                    <p className="font-medium">{account.name || 'Account'}</p>
                    <p className="text-sm text-gray-600 truncate">{account.address}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={refreshAccounts}
              disabled={isLoading}
              className="mt-4 text-blue-600 text-sm hover:underline flex items-center"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Accounts'}
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Smart Wallets</h2>
            {isLoading && smartWallets.length === 0 ? (
              <p>Loading smart wallets...</p>
            ) : smartWallets.length === 0 ? (
              <p>No smart wallets found. Create your first smart wallet.</p>
            ) : (
              <div className="space-y-2">
                {smartWallets.map(wallet => (
                  <div 
                    key={wallet.id}
                    className="p-3 rounded-md bg-gray-50"
                  >
                    <p className="font-medium">{wallet.name || 'Smart Wallet'}</p>
                    <p className="text-sm text-gray-600">{wallet.address || 'Deploying...'}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      wallet.status === 'deployed' ? 'bg-green-100 text-green-800' : 
                      wallet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {wallet.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={refreshSmartWallets}
              disabled={isLoading}
              className="mt-4 text-blue-600 text-sm hover:underline flex items-center"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Smart Wallets'}
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="w-full md:w-2/3">
          <div className="mb-6">
            <div className="flex border-b">
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'accounts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('accounts')}
              >
                Create Account
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'smartwallet' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('smartwallet')}
              >
                Create Smart Wallet
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'send' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('send')}
              >
                Send Transaction
              </button>
            </div>
          </div>
          
          {activeTab === 'accounts' && <CreateAccount />}
          {activeTab === 'smartwallet' && <CreateSmartWallet />}
          {activeTab === 'send' && <SendTransaction />}
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Create App Entry

Update the `app/page.tsx` file:

```typescript
// app/page.tsx
'use client';

import WalletDashboard from '../components/WalletDashboard';
import { WalletProvider } from '../contexts/WalletContext';

export default function Home() {
  return (
    <WalletProvider>
      <main className="min-h-screen bg-gray-50">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Super Wallet</h1>
            <p className="text-gray-600">Manage both EOA and Smart Wallet accounts</p>
          </div>
          
          <WalletDashboard />
        </div>
      </main>
    </WalletProvider>
  );
}
```

## Security Considerations

1. **API Key Security**:
   - Never expose API keys in client-side code for production
   - Use server-side API routes to interact with the Coinbase API

2. **Error Handling**:
   - Implement robust error handling for all SDK operations
   - Present user-friendly error messages

3. **Transaction Confirmation**:
   - Always inform users about transaction status
   - Implement proper polling for transaction confirmation

4. **Smart Wallet Deployment**:
   - Educate users about the two-step process (creation and deployment)
   - Clearly indicate deployment status

## Production Deployment

1. **Server-Side Authentication**:
   - Move SDK initialization to a server component or API route
   - Use secure token exchange for client-server communication

2. **Environment Configuration**:
   - Use different API keys for development and production
   - Configure proper CORS settings

3. **Error Monitoring**:
   - Implement logging and monitoring solutions
   - Set up alerts for critical failures

4. **Performance Optimization**:
   - Implement caching strategies for API calls
   - Optimize component rendering

## Testing

1. **Unit Tests**:
   - Test each component functionality
   - Mock SDK responses

2. **Integration Tests**:
   - Test full user flows
   - Verify wallet creation, transaction sending, etc.

3. **Testnet Environment**:
   - Use testnets like Goerli or Base Goerli for testing
   - Request testnet funds for transaction testing 