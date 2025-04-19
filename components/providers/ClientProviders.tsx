'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { WalletProvider } from '@/contexts/wallet-context';
import { Providers } from '@/app/providers';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WalletProvider>
        <Providers>{children}</Providers>
      </WalletProvider>
    </AuthProvider>
  );
} 