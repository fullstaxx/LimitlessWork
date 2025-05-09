// frontend/src/services/UserService.ts

import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useProgram } from '../contexts/ProgramContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';


export interface UserProfile {
  authority: PublicKey;
  username: string;
  userType: { client: {} } | { freelancer: {} };
  isPremium: boolean;
  reputationScore: number;
  totalTransactions: number;
  creationDate: anchor.BN;
  bump: number;
}

export const useUserService = () => {
  const { program } = useProgram();
  const { publicKey } = useWallet();

  if (!program) {
    console.warn('[UserService] program not initialized yet');
  }

  // Helper to derive the PDA
  const getUserProfilePDA = (walletAddress: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('user-profile'), walletAddress.toBuffer()],
      program!.programId
    )[0];

  /** Fetch the on–chain profile. Returns `null` if none exists or on error. */
  const fetchUserProfile = async (
    walletAddress: PublicKey
  ): Promise<UserProfile | null> => {
    if (!program) return null;
    try {
      const pda = getUserProfilePDA(walletAddress);
      console.debug('[UserService] fetching userProfile at PDA', pda.toBase58());
      const raw = await (program.account as any).userProfile.fetch(pda);
      console.debug('[UserService] fetched raw profile:', raw);
      return raw as UserProfile;
    } catch (err: any) {
      // Anchor throws if the account does not exist
      if (/(AccountNotFound)|(uninitialized account)/i.test(err.toString())) {
        console.info('[UserService] on-chain profile not found');
        return null;
      }
      console.error('[UserService] fetchUserProfile error:', err);
      return null;
    }
  };

  /**
   * Register a new profile on-chain.
   * Returns `true` on success, or `false` if the RPC fails.
   */
  const registerUser = async (
    username: string,
    userType: 'client' | 'freelancer'
  ): Promise<boolean> => {
    if (!program || !publicKey) return false;
    try {
      const pda = getUserProfilePDA(publicKey);
      const typeParam =
        userType === 'client' ? { client: {} } : { freelancer: {} };

      console.debug(
        '[UserService] registering user at PDA',
        pda.toBase58(),
        { username, typeParam }
      );

      await program.methods
        .registerUser(username, typeParam)
        .accounts({
          authority: publicKey,
          userProfile: pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.info('[UserService] registerUser succeeded');
      return true;
    } catch (err) {
      console.error('[UserService] registerUser RPC error:', err);
      return false;
    }
  };

  /**
   * Upgrade your on-chain profile to premium.
   * Returns `true` on success, or `false` if the RPC fails.
   */
  const upgradeToPremium = async (): Promise<boolean> => {
    if (!program || !publicKey) return false;
    try {
      const pda = getUserProfilePDA(publicKey);
      console.debug('[UserService] upgrading to premium at PDA', pda.toBase58());

      await program.methods
        .upgradeToPremium()
        .accounts({
          authority: publicKey,
          userProfile: pda,
        })
        .rpc();

      console.info('[UserService] upgradeToPremium succeeded');
      return true;
    } catch (err) {
      console.error('[UserService] upgradeToPremium RPC error:', err);
      return false;
    }
  };

  return { fetchUserProfile, registerUser, upgradeToPremium };
};
