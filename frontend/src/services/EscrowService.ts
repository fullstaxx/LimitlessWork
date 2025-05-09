// frontend/src/services/EscrowService.ts
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useProgram } from '../contexts/ProgramContext';
import { useWallet } from '@solana/wallet-adapter-react';

export interface Escrow {
  client: PublicKey;
  freelancer: PublicKey;
  depositAmount: anchor.BN;
  status: { active: {} } | { completed: {} } | { refunded: {} } | { disputed: {} };
  listingId: PublicKey;
  packageType: { standard: {} } | { deluxe: {} } | { premium: {} };
  creationDate: anchor.BN;
  completionDate: anchor.BN | null;
  standardFeeBasisPoints: number;
  premiumFeeBasisPoints: number;
  referrer: PublicKey | null;
  hasDispute: boolean;
  bump: number;
}

export interface Dispute {
  escrow: PublicKey;
  client: PublicKey;
  freelancer: PublicKey;
  reason: string;
  status: { open: {} } | { resolvedForClient: {} } | { resolvedForFreelancer: {} } | { resolvedSplit: {} };
  creationDate: anchor.BN;
  resolutionDate: anchor.BN | null;
  adminNotes: string | null;
  bump: number;
}

// ---- FAKE FALLBACKS ----
const FAKE_ESCROW: Escrow = {
  client: SystemProgram.programId,
  freelancer: SystemProgram.programId,
  depositAmount: new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL),
  status: { active: {} },
  listingId: SystemProgram.programId,
  packageType: { standard: {} },
  creationDate: new anchor.BN(Math.floor(Date.now() / 1000)),
  completionDate: null,
  standardFeeBasisPoints: 500, // 5%
  premiumFeeBasisPoints: 300,  // 3%
  referrer: null,
  hasDispute: false,
  bump: 0,
};

const FAKE_DISPUTE: Dispute = {
  escrow: SystemProgram.programId,
  client: SystemProgram.programId,
  freelancer: SystemProgram.programId,
  reason: 'Example dispute',
  status: { open: {} },
  creationDate: new anchor.BN(Math.floor(Date.now() / 1000)),
  resolutionDate: null,
  adminNotes: null,
  bump: 0,
};

export const useEscrowService = () => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const isStub = !program;

  // Create an escrow (stub until on-chain is ready)
  const createEscrow = async (
    freelancerAddress: PublicKey,
    listingPDA: PublicKey,
    packageType: 'standard' | 'deluxe' | 'premium',
    referrer?: PublicKey
  ): Promise<boolean> => {
    if (isStub) {
      console.log('Stub: createEscrow', { freelancerAddress, listingPDA, packageType, referrer });
      return true;
    }
    if (!program || !publicKey) return false;
    try {
      const orderId = `order-${Date.now()}`;
      const accounts = program.account as any;
      if (!accounts.userProfile || !accounts.escrow) {
        console.warn('Required accounts missing');
        return false;
      }
      const [clientProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user-profile'), publicKey.toBuffer()],
        program.programId
      );
      const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user-profile'), freelancerAddress.toBuffer()],
        program.programId
      );
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), publicKey.toBuffer(), freelancerAddress.toBuffer(), Buffer.from(orderId)],
        program.programId
      );
      const [escrowVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow-vault'), escrowPDA.toBuffer()],
        program.programId
      );
      const pkgParam =
        packageType === 'standard' ? { standard: {} } :
        packageType === 'deluxe' ? { deluxe: {} } :
        { premium: {} };

      await program.methods
        .createEscrow(orderId, pkgParam, referrer ?? null)
        .accounts({
          client: publicKey,
          clientProfile: clientProfilePDA,
          freelancer: freelancerAddress,
          freelancerProfile: freelancerProfilePDA,
          listing: listingPDA,
          escrow: escrowPDA,
          escrowVault: escrowVaultPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
          ...(referrer ? { referrer } : {}),
        })
        .rpc();

      return true;
    } catch (err) {
      console.error('createEscrow error', err);
      return false;
    }
  };

  // Approve and release funds
  const approveAndRelease = async (
    escrowPDA: PublicKey,
    freelancerAddress: PublicKey,
    escrowVaultPDA: PublicKey,
    feeCollectorAddress: PublicKey,
    listingPDA: PublicKey,
    referrer?: PublicKey
  ): Promise<boolean> => {
    if (isStub) {
      console.log('Stub: approveAndRelease', { escrowPDA });
      return true;
    }
    if (!program || !publicKey) return false;
    try {
      const accounts = program.account as any;
      if (!accounts.userProfile) {
        console.warn('Required accounts missing');
        return false;
      }
      const [clientProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user-profile'), publicKey.toBuffer()],
        program.programId
      );
      const [freelancerProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user-profile'), freelancerAddress.toBuffer()],
        program.programId
      );
      await program.methods
        .approveAndRelease()
        .accounts({
          client: publicKey,
          clientProfile: clientProfilePDA,
          freelancer: freelancerAddress,
          freelancerProfile: freelancerProfilePDA,
          escrow: escrowPDA,
          escrowVault: escrowVaultPDA,
          feeCollector: feeCollectorAddress,
          listing: listingPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
          ...(referrer ? { referrer } : {}),
        })
        .rpc();
      return true;
    } catch (err) {
      console.error('approveAndRelease error', err);
      return false;
    }
  };

  // Open a dispute
  const openDispute = async (
    escrowPDA: PublicKey,
    freelancerAddress: PublicKey,
    reason: string
  ): Promise<boolean> => {
    if (isStub) {
      console.log('Stub: openDispute', { escrowPDA, reason });
      return true;
    }
    if (!program || !publicKey) return false;
    try {
      const accounts = program.account as any;
      if (!accounts.dispute) {
        console.warn('Dispute account missing');
        return false;
      }
      const [disputePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), escrowPDA.toBuffer()],
        program.programId
      );
      await program.methods
        .openDispute(reason)
        .accounts({
          client: publicKey,
          freelancer: freelancerAddress,
          escrow: escrowPDA,
          dispute: disputePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      return true;
    } catch (err) {
      console.error('openDispute error', err);
      return false;
    }
  };

  // Fetch all escrows for current user
  const fetchUserEscrows = async (): Promise<Escrow[]> => {
    if (isStub) {
      return [FAKE_ESCROW];
    }
    if (!program || !publicKey) return [];
    try {
      const all = await (program.account as any).escrow.all([
        { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
      ]);
      return all.map((r: any) => r.account as Escrow);
    } catch (err) {
      console.error('fetchUserEscrows error', err);
      return [];
    }
  };

  // Fetch a single escrow
  const fetchEscrow = async (
    escrowPDA: PublicKey
  ): Promise<Escrow | null> => {
    if (isStub) {
      return FAKE_ESCROW;
    }
    if (!program) return null;
    try {
      const raw = await (program.account as any).escrow.fetch(escrowPDA);
      return raw as Escrow;
    } catch (err) {
      console.error('fetchEscrow error', err);
      return null;
    }
  };

  // Fetch dispute for an escrow
  const fetchDispute = async (
    escrowPDA: PublicKey
  ): Promise<Dispute | null> => {
    if (isStub) {
      return FAKE_DISPUTE;
    }
    if (!program) return null;
    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), escrowPDA.toBuffer()],
        program.programId
      );
      const raw = await (program.account as any).dispute.fetch(pda);
      return raw as Dispute;
    } catch (err) {
      console.error('fetchDispute error', err);
      return null;
    }
  };

  return {
    createEscrow,
    approveAndRelease,
    openDispute,
    fetchUserEscrows,
    fetchEscrow,
    fetchDispute,
  };
};
