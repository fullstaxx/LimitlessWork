// src/contexts/WalletContext.tsx
import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// wallet-adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

/**
 * Wrap your application with this provider.
 * It injects Connection, Wallet, and the Phantom/Solflare adapters.
 */
export const WalletContextProvider: FC<Props> = ({ children }) => {
  // devnet, testnet, or mainnet-beta
  const network = WalletAdapterNetwork.Devnet;

  // RPC endpoint for the selected network
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // The wallets your app supports
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
