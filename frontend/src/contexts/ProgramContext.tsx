import React, { FC, ReactNode, useContext, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from '../idl/contracts.json'; // Make sure this path is correct

// Use a valid program ID - must match your deployed program
const programId = new PublicKey('4mNxdNXU1mSGjovWsDbH7tZSqyZQfxWK6ucLLoCw3J8K'); // Replace with your actual program ID

interface ProgramContextState {
  program: anchor.Program | null;
  connection: Connection;
  connected: boolean;
  wallet: anchor.Wallet | null;
}

const ProgramContext = React.createContext<ProgramContextState>({
  program: null,
  connection: {} as Connection,
  connected: false,
  wallet: null,
});

export const useProgram = () => useContext(ProgramContext);

interface Props {
  children: ReactNode;
}

export const ProgramProvider: FC<Props> = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const connected = !!publicKey;

  const wallet = useMemo(() => {
    if (publicKey && signTransaction && signAllTransactions) {
      return {
        publicKey,
        signTransaction,
        signAllTransactions,
      } as anchor.Wallet;
    }
    return null;
  }, [publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (wallet && connection) {
      try {
        console.log("Creating Anchor provider and program...");
        const provider = new anchor.AnchorProvider(
          connection,
          wallet,
          { preflightCommitment: 'processed' }
        );
        
        // Check if IDL is properly loaded
        console.log("IDL loaded:", idl);
        
        return new anchor.Program(
            idl as anchor.Idl,  // First parameter is the IDL      // Second parameter is the programId
            provider            // Third parameter is the provider
          );
      } catch (error) {
        console.error("Error creating Anchor program:", error);
        return null;
      }
    }
    return null;
  }, [wallet, connection]);

  console.log("Program context initialized:", { connected, programInitialized: !!program });

  return (
    <ProgramContext.Provider value={{ program, connection, connected, wallet }}>
      {children}
    </ProgramContext.Provider>
  );
};