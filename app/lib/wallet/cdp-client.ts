import { CdpClient } from '@coinbase/cdp-sdk';

/**
 * Initialize the CDP Client - Server-side only
 * 
 * IMPORTANT: This function must only be called in server components, server actions,
 * or API routes to keep credentials secure.
 */
export function initCdpClient() {
  // Verify we're on the server
  if (typeof window !== 'undefined') {
    throw new Error('CDP client can only be initialized on the server');
  }

  return new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
  });
}

/**
 * Default network ID for EVM operations
 * This is safe to use client-side as it's not sensitive
 */
export const defaultNetworkId = process.env.NEXT_PUBLIC_CDP_NETWORK_ID || 'base-sepolia'; 