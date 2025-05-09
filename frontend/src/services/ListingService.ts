import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useProgram } from '../contexts/ProgramContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';

export interface Listing {
  pda: PublicKey;
  authority: PublicKey;
  title: string;
  description: string;
  category: string;
  standardPrice: anchor.BN;
  deluxePrice: anchor.BN | null;
  premiumPrice: anchor.BN | null;
  active: boolean;
  totalOrders: anchor.BN;
  completedOrders: anchor.BN;
  creationDate: anchor.BN;
  bump: number;
}

// Raw on‐chain account shape
type ListingAccount = Omit<Listing, 'pda'>;

export const useListingService = () => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const STUB_MODE = process.env.REACT_APP_USE_STUBS === 'true';
  const isLive = !!program && !STUB_MODE;

  // generate a sync stub‐PDA for each seed
  const makeStubPDA = (seed: string): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stub'), Buffer.from(seed.slice(0, 31))],
      SystemProgram.programId
    );
    return pda;
  };

  const FAKE_LISTINGS: Listing[] = [
    {
      pda: makeStubPDA('LogoDesign'),
      authority: makeStubPDA('LogoDesign'),
      title: 'Logo Design',
      description: 'I will craft you a modern, memorable logo.',
      category: 'Design',
      standardPrice: new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL),
      deluxePrice: null,
      premiumPrice: null,
      active: true,
      totalOrders: new anchor.BN(3),
      completedOrders: new anchor.BN(3),
      creationDate: new anchor.BN(Math.floor(Date.now() / 1000)),
      bump: 0,
    },
    {
      pda: makeStubPDA('WebAppDev'),
      authority: makeStubPDA('WebAppDev'),
      title: 'Web App Development',
      description: 'Full-stack React + Rust on Solana.',
      category: 'Development',
      standardPrice: new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL),
      deluxePrice: new anchor.BN(3 * anchor.web3.LAMPORTS_PER_SOL),
      premiumPrice: null,
      active: true,
      totalOrders: new anchor.BN(1),
      completedOrders: new anchor.BN(1),
      creationDate: new anchor.BN(Math.floor(Date.now() / 1000)),
      bump: 0,
    },
  ];

  const toLamports = (sol: number) =>
    new anchor.BN(sol * anchor.web3.LAMPORTS_PER_SOL);

  /** Marketplace: fetch *all* listings */
  const fetchAllListings = async (): Promise<Listing[]> => {
    if (!isLive) return FAKE_LISTINGS;
    try {
      const all = await (program.account as any).listing.all();
      return all.map((r: any) => {
        const acc = r.account as ListingAccount;
        return { pda: r.publicKey, ...acc };
      });
    } catch (err) {
      console.error('fetchAllListings error', err);
      return [];
    }
  };

  /** My Services: fetch only listings whose authority === your wallet */
  const fetchMyListings = async (): Promise<Listing[]> => {
    if (!isLive || !publicKey) return FAKE_LISTINGS;
    try {
      const filtered = await (program.account as any).listing.all([
        {
          memcmp: {
            offset: 8, // skip discriminator
            bytes: publicKey.toBase58(),
          },
        },
      ]);
      return filtered.map((r: any) => {
        const acc = r.account as ListingAccount;
        return { pda: r.publicKey, ...acc };
      });
    } catch (err) {
      console.error('fetchMyListings error', err);
      return [];
    }
  };

  /** Create a new listing */
  const createListing = async (
    listingId: string,
    title: string,
    description: string,
    category: string,
    standard: number,
    deluxe?: number,
    premium?: number
  ): Promise<boolean> => {
    if (!isLive || !publicKey) return false;
    try {
      const [profilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user-profile'), publicKey.toBuffer()],
        program.programId
      );
      const [listingPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('listing'),
          publicKey.toBuffer(),
          Buffer.from(listingId),
        ],
        program.programId
      );
      await program.methods
        .createListing(
          listingId,
          title,
          description,
          category,
          toLamports(standard),
          deluxe != null ? toLamports(deluxe) : null,
          premium != null ? toLamports(premium) : null
        )
        .accounts({
          authority: publicKey,
          userProfile: profilePDA,
          listing: listingPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      return true;
    } catch (err) {
      console.error('createListing error', err);
      return false;
    }
  };

  /** Update an existing listing */
  const updateListing = async (
    listingPDA: PublicKey,
    title?: string,
    description?: string,
    category?: string,
    standard?: number,
    deluxe?: number,
    premium?: number,
    active?: boolean
  ): Promise<boolean> => {
    if (!isLive || !publicKey) return false;
    try {
      const optLam = (s?: number) =>
        s != null ? toLamports(s) : null;
      await program.methods
        .updateListing(
          title ?? null,
          description ?? null,
          category ?? null,
          optLam(standard),
          optLam(deluxe),
          optLam(premium),
          active ?? null
        )
        .accounts({
          authority: publicKey,
          listing: listingPDA,
        })
        .rpc();
      return true;
    } catch (err) {
      console.error('updateListing error', err);
      return false;
    }
  };

  return {
    fetchAllListings,
    fetchMyListings,
    createListing,
    updateListing,
  };
};
