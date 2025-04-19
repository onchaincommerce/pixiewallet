import { createBrowserSupabaseClient } from './supabase';
import { createEVMWallet, getWalletDetails as getWalletDetailsFromAPI, requestFaucetFunds as requestFaucetFromAPI, getSmartAccount, sendTransaction as sendTransactionAPI } from '@/app/actions/wallet-actions';

/**
 * Get a user's wallet from Supabase
 */
export async function getUserWallet(userId: string) {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // Query the wallets table to find wallets associated with the user
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If the error is just that no wallet was found, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting user wallet:', error);
    return null;
  }
}

/**
 * Create a wallet for a user and save it to Supabase
 */
export async function createWalletForUser(userId: string, walletType: 'eoa' | 'smart' = 'smart') {
  try {
    const supabase = createBrowserSupabaseClient();
    
    // First check if user already has a wallet
    const existingWallet = await getUserWallet(userId);
    
    if (existingWallet) {
      return {
        success: true,
        wallet: existingWallet,
        message: 'User already has a wallet'
      };
    }
    
    // Create a wallet using the CDP API
    const isSmartWallet = walletType === 'smart';
    const walletResult = await createEVMWallet(isSmartWallet);
    
    if (!walletResult.success) {
      throw new Error(walletResult.error || 'Failed to create wallet');
    }
    
    // Save wallet to Supabase
    const { data: newWallet, error } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        wallet_address: walletResult.address,
        wallet_type: isSmartWallet ? 'SmartWallet' : 'EOA',
        owner_address: walletResult.ownerAccountId,
        network_id: walletResult.networkId,
        is_primary: true
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Update last_accessed timestamp
    await supabase
      .from('wallets')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', newWallet.id);
    
    return {
      success: true,
      wallet: newWallet
    };
  } catch (error: any) {
    console.error('Error creating wallet for user:', error);
    return {
      success: false,
      error: error.message || 'Failed to create wallet'
    };
  }
}

/**
 * Get wallet details including on-chain data
 */
export async function getEnhancedWalletDetails(wallet: any) {
  try {
    if (!wallet) {
      return null;
    }
    
    const isSmartWallet = wallet.wallet_type === 'SmartWallet';
    
    // Get wallet details from the blockchain
    const details = await getWalletDetailsFromAPI(
      wallet.wallet_address,
      isSmartWallet,
      wallet.owner_address
    );
    
    if (!details.success) {
      throw new Error(details.error || 'Failed to get wallet details');
    }
    
    // Update last_accessed timestamp
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from('wallets')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', wallet.id);
    
    // Combine the Supabase wallet data with the blockchain data
    return {
      id: wallet.id,
      address: wallet.wallet_address,
      type: isSmartWallet ? 'smart' as const : 'eoa' as const,
      ownerAddress: wallet.owner_address,
      networkId: wallet.network_id,
      balance: details.balance || '0.0',
      created_at: wallet.created_at,
      last_accessed: wallet.last_accessed
    };
  } catch (error: any) {
    console.error('Error getting enhanced wallet details:', error);
    return null;
  }
}

/**
 * Request faucet funds for a wallet
 */
export async function requestFaucetFunds(walletAddress: string, isSmartWallet: boolean = false) {
  try {
    const result = await requestFaucetFromAPI(walletAddress, isSmartWallet);
    return result;
  } catch (error: any) {
    console.error('Error requesting faucet funds:', error);
    return {
      success: false,
      error: error.message || 'Failed to request faucet funds'
    };
  }
}

/**
 * Send a transaction from a wallet to another address
 */
export async function sendTransaction(
  fromAddress: string, 
  toAddress: string, 
  amount: string, 
  isSmartWallet: boolean = false,
  ownerAddress?: string
) {
  try {
    const result = await sendTransactionAPI(
      fromAddress,
      toAddress,
      amount,
      isSmartWallet,
      ownerAddress
    );
    
    return result;
  } catch (error: any) {
    console.error('Error sending transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to send transaction'
    };
  }
} 