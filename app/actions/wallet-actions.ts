'use server';

import { initCdpClient, defaultNetworkId } from '../lib/wallet/cdp-client';
import { createPublicClient, http, createWalletClient, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { toAccount } from 'viem/accounts';
// Unused imports commented out but preserved for future reference
// import { createWalletClient } from 'viem';
// import { toAccount } from 'viem/accounts';

// Log CDP SDK version information
console.log(`[${new Date().toISOString()}] 📚 Super Wallet using Coinbase CDP SDK v1.0.0 for wallet operations`);

// Base Sepolia RPC endpoint
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Create viem public client for Base Sepolia
// We keep this for reference even though it's currently unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC)
});

// Error helper function
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as {message: unknown}).message === 'string') {
    return (error as {message: string}).message;
  }
  return String(error);
}

/**
 * Create a new EVM wallet for a user
 * This is a server action to keep credentials secure
 */
export async function createEVMWallet(useSmartWallet: boolean = false) {
  try {
    console.log(`[${new Date().toISOString()}] 🔐 Initializing CDP client to create a ${useSmartWallet ? 'smart' : 'regular'} wallet via Coinbase API...`);
    const cdp = initCdpClient();
    console.log(`[${new Date().toISOString()}] ✅ CDP client initialized with API credentials: ${process.env.CDP_API_KEY_ID}`);
    
    if (useSmartWallet) {
      // First create a server account to use as the owner
      console.log(`[${new Date().toISOString()}] 🔑 Creating owner account via Coinbase CDP API...`);
      const ownerAccount = await cdp.evm.createAccount({
        name: `Owner-${Date.now()}`,
      });
      
      console.log(`[${new Date().toISOString()}] ✅ Owner account created via API: ${ownerAccount.address}`);
      
      // Create a smart account with the server account as owner
      // This will deploy a contract wallet on the blockchain
      console.log(`[${new Date().toISOString()}] 📝 Creating smart account via Coinbase CDP API using owner: ${ownerAccount.address}...`);
      const smartAccount = await cdp.evm.createSmartAccount({
        owner: ownerAccount,
      });
      
      console.log(`[${new Date().toISOString()}] ✅ Smart account created via API: ${smartAccount.address}`);
      
      // Return only the non-sensitive data to the client
      return {
        success: true,
        walletId: smartAccount.address,
        address: smartAccount.address,
        networkId: defaultNetworkId,
        isSmartWallet: true,
        // Store the owner account ID for later use
        ownerAccountId: ownerAccount.address,
      };
    } else {
      // Create a regular EOA account
      console.log(`[${new Date().toISOString()}] 🔑 Creating regular EOA account via Coinbase CDP API...`);
      const account = await cdp.evm.createAccount({
        name: `Wallet-${Date.now()}`, // Optional name with timestamp to make it unique
      });
      
      console.log(`[${new Date().toISOString()}] ✅ EOA account created via API: ${account.address} on network: ${defaultNetworkId}`);
      
      // Return only the non-sensitive data to the client
      return {
        success: true,
        walletId: account.address,
        address: account.address,
        networkId: defaultNetworkId,
        isSmartWallet: false,
      };
    }
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] ❌ Error creating EVM wallet via Coinbase CDP API:`, error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to create wallet',
    };
  }
}

/**
 * Get wallet details
 * This is a server action to keep credentials secure
 * @param walletId The address of the wallet
 * @param isSmartWallet Whether the wallet is a smart contract wallet
 * @param ownerAddress Optional owner address for smart wallets
 */
export async function getWalletDetails(
  walletId: string, 
  isSmartWallet: boolean = false, 
  ownerAddress?: string
) {
  try {
    console.log(`[${new Date().toISOString()}] 🔍 Retrieving wallet details via Coinbase CDP API for ${isSmartWallet ? 'smart' : 'EOA'} wallet: ${walletId}`);
    const cdp = initCdpClient();
    console.log(`[${new Date().toISOString()}] ✅ CDP client initialized with API key: ${process.env.CDP_API_KEY_ID}`);
    
    // Ensure the address is properly formatted with 0x prefix
    const address = walletId.startsWith('0x') ? walletId as `0x${string}` : `0x${walletId}` as `0x${string}`;
    
    let account;
    if (isSmartWallet) {
      // For smart wallets, we need the owner account information
      if (ownerAddress) {
        try {
          // Get the smart account using getSmartAccount
          account = await getSmartAccount(address, ownerAddress);
          console.log(`[${new Date().toISOString()}] ✅ Retrieved smart wallet via API for address: ${address}`);
        } catch (e) {
          console.error(`[${new Date().toISOString()}] ❌ Error getting smart account via API:`, e);
          account = { address };
        }
      } else {
        console.warn(`[${new Date().toISOString()}] ⚠️ No owner address provided for smart wallet, using limited info`);
        account = { address };
      }
    } else {
      // Get regular EOA account
      console.log(`[${new Date().toISOString()}] 🔑 Fetching EOA account via Coinbase CDP API...`);
      account = await cdp.evm.getAccount({
        address,
      });
      console.log(`[${new Date().toISOString()}] ✅ Retrieved account via API for address: ${account.address}`);
    }
    
    // Get the actual balance
    console.log(`[${new Date().toISOString()}] 💰 Fetching on-chain balance via RPC...`);
    const balance = await getWalletBalance(address);
    console.log(`[${new Date().toISOString()}] ✅ Retrieved balance: ${balance} ETH`);
    
    // Return only the non-sensitive data to the client
    return {
      success: true,
      walletId: account.address,
      address: account.address,
      networkId: defaultNetworkId,
      balance: balance,
      isSmartWallet,
    };
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] ❌ Error getting wallet details via Coinbase CDP API:`, error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to retrieve wallet details',
    };
  }
}

/**
 * Get a smart account using the CDP API
 * This is used to retrieve existing smart wallets
 */
export async function getSmartAccount(address: string, ownerAddress: string) {
  try {
    console.log(`[${new Date().toISOString()}] 🔍 Getting smart account via CDP API: ${address}`);
    const cdp = initCdpClient();
    
    // Format addresses to ensure they have 0x prefix
    const walletAddress = address.startsWith('0x') ? address as `0x${string}` : `0x${address}` as `0x${string}`;
    const ownerAddr = ownerAddress.startsWith('0x') ? ownerAddress as `0x${string}` : `0x${ownerAddress}` as `0x${string}`;
    
    // First, get the owner account
    const ownerAccount = await cdp.evm.getAccount({
      address: ownerAddr,
    });
    
    if (!ownerAccount) {
      throw new Error(`Owner account not found for address: ${ownerAddr}`);
    }
    
    // Then get the smart account using the owner
    const smartAccount = await cdp.evm.getSmartAccount({
      address: walletAddress,
      owner: ownerAccount,
    });
    
    console.log(`[${new Date().toISOString()}] ✅ Successfully retrieved smart account: ${smartAccount.address}`);
    
    return smartAccount;
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] ❌ Error retrieving smart account:`, error);
    throw new Error(`Failed to get smart account: ${getErrorMessage(error)}`);
  }
}

/**
 * Get the actual wallet balance from the RPC endpoint
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    // JSON-RPC request to get the balance
    const response = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });
    
    const data = await response.json();
    
    // Convert hex balance to ETH (wei / 10^18)
    if (data.result) {
      const balanceInWei = parseInt(data.result, 16);
      const balanceInEth = balanceInWei / 1e18;
      return balanceInEth.toFixed(6); // 6 decimal places
    }
    
    return '0.0';
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return '0.0';
  }
}

/**
 * Send a transaction from a wallet
 * This is a server action to keep credentials secure
 */
export async function sendTransaction(
  fromAddress: string, 
  toAddress: string, 
  amount: string, 
  isSmartWallet: boolean = false,
  ownerAccountId?: string
) {
  try {
    console.log(`[${new Date().toISOString()}] 🚀 Initializing CDP client for transaction via Coinbase API...`);
    const cdp = initCdpClient();
    console.log(`[${new Date().toISOString()}] ✅ CDP client initialized with API key: ${process.env.CDP_API_KEY_ID}`);
    
    // Ensure addresses are properly formatted with 0x prefix
    const from = fromAddress.startsWith('0x') ? fromAddress as `0x${string}` : `0x${fromAddress}` as `0x${string}`;
    const to = toAddress.startsWith('0x') ? toAddress as `0x${string}` : `0x${toAddress}` as `0x${string}`;
    
    // Convert amount to wei (for value parameter)
    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
    console.log(`[${new Date().toISOString()}] 💵 Transaction details prepared: ${from} -> ${to}, amount: ${amount} ETH (${amountInWei} wei)`);
    
    try {
      if (isSmartWallet && ownerAccountId) {
        console.log(`[${new Date().toISOString()}] 🔐 Processing smart wallet transaction via Coinbase CDP API`);
        console.log(`[${new Date().toISOString()}] 📋 Smart wallet: ${from}, owned by: ${ownerAccountId}`);
        
        try {
          // For smart wallets, we need to use the owner account
          const ownerAddress = ownerAccountId.startsWith('0x') 
            ? ownerAccountId as `0x${string}` 
            : `0x${ownerAccountId}` as `0x${string}`;
            
          // 1. Get the owner account which controls the smart account
          console.log(`[${new Date().toISOString()}] 🔑 Retrieving owner account via CDP API: ${ownerAddress}`);
          const ownerAccount = await cdp.evm.getAccount({
            address: ownerAddress,
          });
          
          console.log(`[${new Date().toISOString()}] ✅ Owner account retrieved via API successfully`);
          
          // 2. Get the smart account using the owner
          console.log(`[${new Date().toISOString()}] 🔍 Retrieving smart account: ${from}`);
          const smartAccount = await cdp.evm.getSmartAccount({
            address: from,
            owner: ownerAccount
          });
          
          console.log(`[${new Date().toISOString()}] ✅ Smart account retrieved: ${smartAccount.address}`);
          
          // 3. Use sendUserOperation to send transaction through the smart account
          console.log(`[${new Date().toISOString()}] 📝 Creating user operation via CDP API`);
          
          const userOperationResult = await cdp.evm.sendUserOperation({
            smartAccount,
            network: defaultNetworkId as "base-sepolia",
            calls: [
              {
                to, // recipient address
                value: amountInWei, // amount in wei
                data: "0x", // no additional data for a simple transfer
              },
            ],
          });
          
          console.log(`[${new Date().toISOString()}] ✅ User operation sent successfully:`, userOperationResult);
          
          // The userOpHash is the hash of the user operation
          return {
            success: true,
            transactionHash: userOperationResult.userOpHash,
            from,
            to,
            amount,
          };
        } catch (error: unknown) {
          console.error(`[${new Date().toISOString()}] ❌ Smart account transaction error with CDP API:`, error);
          throw error;
        }
      } else {
        // Regular EOA transaction using viem + CDP
        console.log(`[${new Date().toISOString()}] 🔑 Processing EOA transaction via viem with Coinbase CDP API`);
        console.log(`[${new Date().toISOString()}] 📋 From: ${from}, To: ${to}, Amount: ${amount} ETH`);
        
        try {
          // Get the CDP account object
          console.log(`[${new Date().toISOString()}] 🔍 Retrieving account from CDP API: ${from}`);
          const account = await cdp.evm.getAccount({
            address: from,
          });
          
          if (!account) {
            throw new Error(`Account ${from} not found`);
          }
          
          console.log(`[${new Date().toISOString()}] ✅ CDP account retrieved via API, preparing transaction`);
          
          // Create wallet client with CDP account - using type assertion to bypass compatibility issues
          console.log(`[${new Date().toISOString()}] 🔧 Creating viem wallet client`);
          const walletClient = createWalletClient({
            account: toAccount(account as any),
            chain: baseSepolia,
            transport: http(BASE_SEPOLIA_RPC),
          });
          
          // Send transaction
          console.log(`[${new Date().toISOString()}] 📝 Sending transaction via viem wallet client`);
          const hash = await walletClient.sendTransaction({
            to,
            value: parseEther(amount),
          });
          
          console.log(`[${new Date().toISOString()}] ✅ Transaction sent successfully: ${hash}`);
          
          return {
            success: true,
            transactionHash: hash,
            from,
            to,
            amount,
          };
        } catch (error: unknown) {
          console.error(`[${new Date().toISOString()}] ❌ EOA transaction error:`, error);
          return {
            success: false,
            error: getErrorMessage(error) || 'Transaction failed',
          };
        }
      }
    } catch (error: unknown) {
      console.error(`[${new Date().toISOString()}] ❌ Error sending transaction:`, error);
      return {
        success: false,
        error: getErrorMessage(error) || 'Transaction failed',
      };
    }
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] ❌ Error initializing CDP client:`, error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to initialize wallet client',
    };
  }
}

/**
 * Get transaction status
 * This function checks the status of a transaction on the blockchain
 */
export async function getTransactionStatus(transactionHash: string) {
  try {
    console.log('Checking transaction status for:', transactionHash);
    
    // Make RPC call to get transaction receipt
    const response = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
        id: 1,
      }),
    });
    
    const data = await response.json();
    
    // In case of an error or null result (transaction not yet mined)
    if (data.error || !data.result) {
      // If the transaction is not found, it's still pending
      return {
        success: true,
        status: 'pending',
        hash: transactionHash,
        blockHash: null,
        blockNumber: null,
      };
    }
    
    // Transaction has been mined
    const receipt = data.result;
    
    // Convert status from hex to number (1 = success, 0 = failure)
    const txStatus = receipt.status === '0x1' ? 'confirmed' : 'failed';
    
    return {
      success: true,
      status: txStatus,
      hash: receipt.transactionHash,
      blockHash: receipt.blockHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      gasUsed: parseInt(receipt.gasUsed, 16),
    };
  } catch (error: unknown) {
    console.error('Error getting transaction status:', error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to get transaction status',
    };
  }
}

/**
 * Request funds from the faucet for a wallet
 * This is a server action to keep credentials secure
 */
export async function requestFaucetFunds(
  address: string,
  isSmartWallet: boolean = false
) {
  try {
    console.log(`[${new Date().toISOString()}] 💸 Initializing CDP client to request faucet funds for ${isSmartWallet ? 'smart' : 'regular'} wallet: ${address}...`);
    const cdp = initCdpClient();
    console.log(`[${new Date().toISOString()}] ✅ CDP client initialized with API credentials: ${process.env.CDP_API_KEY_ID}`);
    
    // Ensure the address is properly formatted with 0x prefix
    const formattedAddress = address.startsWith('0x') ? address as `0x${string}` : `0x${address}` as `0x${string}`;
    
    // Request funds from the faucet
    console.log(`[${new Date().toISOString()}] 🚰 Requesting faucet funds for address: ${formattedAddress}`);
    const faucetResult = await cdp.evm.requestFaucet({
      address: formattedAddress,
      network: defaultNetworkId as "base-sepolia" | "ethereum-sepolia",
      token: 'eth'
    });
    
    console.log(`[${new Date().toISOString()}] ✅ Faucet request completed with result:`, faucetResult);
    
    return {
      success: true,
      message: 'Faucet funds requested successfully. Balance should update shortly.',
      result: faucetResult
    };
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] ❌ Error requesting faucet funds via Coinbase CDP API:`, error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Failed to request faucet funds',
    };
  }
}