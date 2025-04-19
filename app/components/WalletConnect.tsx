'use client';

import { useState } from 'react';
import { createEVMWallet, getWalletDetails } from '../actions/wallet-actions';

export default function WalletConnect() {
  const [walletInfo, setWalletInfo] = useState<{
    walletId?: string;
    address?: string;
    networkId?: string;
    error?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const result = await createEVMWallet();
      if (result.success) {
        setWalletInfo({
          walletId: result.walletId,
          address: result.address,
          networkId: result.networkId,
        });
      } else {
        setWalletInfo({ error: result.error });
      }
    } catch (error) {
      setWalletInfo({ error: 'Failed to create wallet' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetWalletDetails = async () => {
    if (!walletInfo.walletId) {
      setWalletInfo({ error: 'No wallet ID available' });
      return;
    }

    setLoading(true);
    try {
      const result = await getWalletDetails(walletInfo.walletId);
      if (result.success) {
        setWalletInfo({
          walletId: result.walletId,
          address: result.address,
          networkId: result.networkId,
        });
      } else {
        setWalletInfo({ error: result.error });
      }
    } catch (error) {
      setWalletInfo({ error: 'Failed to retrieve wallet details' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-lg font-bold mb-4">Coinbase EVM Wallet</h2>
      
      <div className="space-y-4">
        <button
          onClick={handleCreateWallet}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Wallet'}
        </button>

        {walletInfo.walletId && (
          <div className="space-y-2">
            <p><strong>Wallet ID:</strong> {walletInfo.walletId}</p>
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Network:</strong> {walletInfo.networkId}</p>
            
            <button
              onClick={handleGetWalletDetails}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Wallet Details'}
            </button>
          </div>
        )}

        {walletInfo.error && (
          <div className="text-red-500 p-2 bg-red-50 rounded">
            Error: {walletInfo.error}
          </div>
        )}
      </div>
    </div>
  );
} 