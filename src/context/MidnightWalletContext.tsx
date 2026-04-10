// 1AM Midnight Wallet — React Context Provider
// Exposes wallet state globally so any component can access it without prop drilling

import React, { createContext, useContext } from 'react';
import { useMidnightWallet, MidnightWalletState } from '@/hooks/useMidnightWallet';

const MidnightWalletContext = createContext<MidnightWalletState | null>(null);

export function MidnightWalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useMidnightWallet();
  return (
    <MidnightWalletContext.Provider value={wallet}>
      {children}
    </MidnightWalletContext.Provider>
  );
}

export function useMidnightWalletContext(): MidnightWalletState {
  const ctx = useContext(MidnightWalletContext);
  if (!ctx) throw new Error('useMidnightWalletContext must be used within MidnightWalletProvider');
  return ctx;
}
