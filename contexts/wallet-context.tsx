'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { createWalletForUser, getEnhancedWalletDetails, getUserWallet, requestFaucetFunds as requestFaucet, sendTransaction as sendTransactionService } from '@/lib/walletService';

type WalletType = 'eoa' | 'smart';

interface Wallet {
  id: string;
  address: string;
  type: WalletType;
  ownerAddress?: string;
  networkId: string;
  balance: string;
  created_at: string;
  last_accessed?: string;
}

type WalletContextType = {
  wallet: Wallet | null;
  isLoading: boolean;  // General loading state for wallet initialization
  isRefreshing: boolean; // For balance refreshes
  isTransacting: boolean; // For transaction operations 
  isFauceting: boolean; // For faucet operations
  error: string | null;
  refreshWallet: () => Promise<void>;
  createWallet: (type: WalletType) => Promise<void>;
  sendTransaction: (toAddress: string, amount: string) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  requestFaucetFunds: () => Promise<{ success: boolean; message?: string; error?: string }>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [isFauceting, setIsFauceting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  const fetchWallet = async () => {
    if (!user) {
      setWallet(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check if the user already has a wallet
      const existingWallet = await getUserWallet(user.id);
      
      if (existingWallet) {
        // Get enhanced wallet details including blockchain data
        const enhancedWallet = await getEnhancedWalletDetails(existingWallet);
        setWallet(enhancedWallet);
        return;
      }
      
      // If no wallet found, we don't auto-create one - let the user choose to create one
      setWallet(null);
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      setError('Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const createWallet = async (type: WalletType = 'smart') => {
    if (!user) {
      setError('You must be logged in to create a wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createWalletForUser(user.id, type);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create wallet');
      }
      
      // Fetch the wallet again to get updated data
      await fetchWallet();
    } catch (err: any) {
      console.error('Error creating wallet:', err);
      setError('Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallet = async () => {
    setIsRefreshing(true);
    try {
      await fetchWallet();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to send transaction from the current wallet
  const sendTransaction = async (toAddress: string, amount: string) => {
    if (!wallet) {
      return { success: false, error: 'No wallet available' };
    }

    setIsTransacting(true);
    try {
      const result = await sendTransactionService(
        wallet.address,
        toAddress,
        amount,
        wallet.type === 'smart',
        wallet.ownerAddress
      );
      
      if (result.success) {
        // Schedule a wallet refresh to update balance
        setTimeout(() => refreshWallet(), 1000);
        
        // Handle different possible response formats
        let txHash = '';
        if ('transactionHash' in result) {
          txHash = typeof result.transactionHash === 'string' 
            ? result.transactionHash 
            : String(result.transactionHash || '');
        }
          
        return { 
          success: true, 
          transactionHash: txHash
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Transaction failed' 
        };
      }
    } catch (err: any) {
      console.error('Error sending transaction:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to send transaction' 
      };
    } finally {
      setIsTransacting(false);
    }
  };

  // Function to request funds from faucet
  const requestFaucetFunds = async () => {
    if (!wallet) {
      return { success: false, error: 'No wallet available' };
    }

    setIsFauceting(true);
    try {
      const result = await requestFaucet(
        wallet.address,
        wallet.type === 'smart'
      );
      
      if (result.success) {
        // Schedule a wallet refresh to update balance after faucet funds arrive
        setTimeout(() => refreshWallet(), 3000);
        
        // Handle the response safely
        const message = 'message' in result ? result.message : 'Funds requested successfully';
        
        return { 
          success: true, 
          message
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to request funds' 
        };
      }
    } catch (err: any) {
      console.error('Error requesting faucet funds:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to request faucet funds' 
      };
    } finally {
      setIsFauceting(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  // Set up realtime subscription for wallet changes
  useEffect(() => {
    if (!user) return;
    
    const subscription = supabase
      .channel('wallets_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`,
      }, (payload: { new: any; old: any }) => {
        console.log('Wallet change detected:', payload);
        fetchWallet();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <WalletContext.Provider value={{ 
      wallet, 
      isLoading,
      isRefreshing,
      isTransacting,
      isFauceting,
      error, 
      refreshWallet, 
      createWallet,
      sendTransaction,
      requestFaucetFunds
    }}>
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