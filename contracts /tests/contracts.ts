import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contracts } from "../target/types/contracts";
import { expect } from 'chai';

describe("limitless_work", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Contracts as Program<Contracts>;
  
  // Create keypairs for testing
  const client = anchor.web3.Keypair.generate();
  const freelancer = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const feeCollector = anchor.web3.Keypair.generate();
  
  // Generate unique IDs for testing
  const listingId = "test-listing-" + Math.floor(Math.random() * 1000000);
  const orderId = "test-order-" + Math.floor(Math.random() * 1000000);
  
  // Store PDAs for reuse across tests
  let clientProfilePDA: anchor.web3.PublicKey;
  let freelancerProfilePDA: anchor.web3.PublicKey;
  let listingPDA: anchor.web3.PublicKey;
  let escrowPDA: anchor.web3.PublicKey;
  let escrowVaultPDA: anchor.web3.PublicKey;
  let disputePDA: anchor.web3.PublicKey;
  
  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(client.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(freelancer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(feeCollector.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for confirmation
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: '',
    });
    
    // Compute PDAs
    [clientProfilePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-profile"), client.publicKey.toBuffer()],
      program.programId
    );
    
    [freelancerProfilePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-profile"), freelancer.publicKey.toBuffer()],
      program.programId
    );
    
    [listingPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), freelancer.publicKey.toBuffer(), Buffer.from(listingId)],
      program.programId
    );
  });
  
  it("Can register a client", async () => {
    // Test user registration for a client
    const username = "testclient";
    
    try {
      await program.methods
        .registerUser(username, { client: {} })
        .accounts({
          authority: client.publicKey,
          userProfile: clientProfilePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([client])
        .rpc();
        
      // Fetch the user profile and verify it was created correctly
      const userProfile = await program.account.userProfile.fetch(clientProfilePDA);
      expect(userProfile.username).to.equal(username);
      expect(userProfile.userType.client).to.exist;
      expect(userProfile.isPremium).to.be.false;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Can register a freelancer", async () => {
    // Implement similar test for freelancer registration
    const username = "testfreelancer";
    
    try {
      await program.methods
        .registerUser(username, { freelancer: {} })
        .accounts({
          authority: freelancer.publicKey,
          userProfile: freelancerProfilePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([freelancer])
        .rpc();
        
      // Fetch the user profile and verify
      const userProfile = await program.account.userProfile.fetch(freelancerProfilePDA);
      expect(userProfile.username).to.equal(username);
      expect(userProfile.userType.freelancer).to.exist;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Can upgrade user to premium", async () => {
    try {
      await program.methods
        .upgradeToPremium()
        .accounts({
          authority: client.publicKey,
          userProfile: clientProfilePDA,
        })
        .signers([client])
        .rpc();
        
      // Verify premium status
      const userProfile = await program.account.userProfile.fetch(clientProfilePDA);
      expect(userProfile.isPremium).to.be.true;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Freelancer can create a listing", async () => {
    // Test listing creation by freelancer
    const title = "Test Service";
    const description = "This is a test service listing";
    const category = "Testing";
    const standardPrice = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL); // 1 SOL
    const deluxePrice = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL);  // 2 SOL
    const premiumPrice = new anchor.BN(3 * anchor.web3.LAMPORTS_PER_SOL);  // 3 SOL
    
    try {
      await program.methods
        .createListing(
          listingId,
          title,
          description,
          category,
          standardPrice,
          deluxePrice,
          premiumPrice
        )
        .accounts({
          authority: freelancer.publicKey,
          userProfile: freelancerProfilePDA,
          listing: listingPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([freelancer])
        .rpc();
        
      // Verify listing was created
      const listing = await program.account.listing.fetch(listingPDA);
      expect(listing.title).to.equal(title);
      expect(listing.description).to.equal(description);
      expect(listing.category).to.equal(category);
      expect(listing.standardPrice.toString()).to.equal(standardPrice.toString());
      expect(listing.deluxePrice.toString()).to.equal(deluxePrice.toString());
      expect(listing.premiumPrice.toString()).to.equal(premiumPrice.toString());
      expect(listing.active).to.be.true;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Freelancer can update a listing", async () => {
    // Test updating a listing
    const newTitle = "Updated Test Service";
    const newStandardPrice = new anchor.BN(1.5 * anchor.web3.LAMPORTS_PER_SOL); // 1.5 SOL
    
    try {
      await program.methods
        .updateListing(
          newTitle,
          null, // Keep original description
          null, // Keep original category
          newStandardPrice,
          null, // Keep original deluxe price
          null, // Keep original premium price
          null  // Keep active status
        )
        .accounts({
          authority: freelancer.publicKey,
          listing: listingPDA,
        })
        .signers([freelancer])
        .rpc();
        
      // Verify listing was updated
      const listing = await program.account.listing.fetch(listingPDA);
      expect(listing.title).to.equal(newTitle);
      expect(listing.standardPrice.toString()).to.equal(newStandardPrice.toString());
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Client can create an escrow", async () => {
    // Compute escrow PDA
    [escrowPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), client.publicKey.toBuffer(), freelancer.publicKey.toBuffer(), Buffer.from(orderId)],
      program.programId
    );
    
    // Compute escrow vault PDA
    [escrowVaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow-vault"), escrowPDA.toBuffer()],
      program.programId
    );
    
    // Get client's initial balance
    const initialBalance = await provider.connection.getBalance(client.publicKey);
    
    try {
      await program.methods
        .createEscrow(
          orderId,
          { standard: {} }, // Package type
          null // No referrer
        )
        .accounts({
          client: client.publicKey,
          clientProfile: clientProfilePDA,
          freelancer: freelancer.publicKey,
          freelancerProfile: freelancerProfilePDA,
          listing: listingPDA,
          escrow: escrowPDA,
          escrowVault: escrowVaultPDA,
          referrer: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([client])
        .rpc();
        
      // Verify escrow was created
      const escrow = await program.account.escrow.fetch(escrowPDA);
      expect(escrow.client.toString()).to.equal(client.publicKey.toString());
      expect(escrow.freelancer.toString()).to.equal(freelancer.publicKey.toString());
      expect(escrow.listingId.toString()).to.equal(listingPDA.toString());
      expect(escrow.status.active).to.exist;
      
      // Verify funds were transferred to escrow vault
      const listing = await program.account.listing.fetch(listingPDA);
      const vaultBalance = await provider.connection.getBalance(escrowVaultPDA);
      expect(vaultBalance.toString()).to.equal(listing.standardPrice.toString());
      
      // Verify client's balance decreased
      const finalBalance = await provider.connection.getBalance(client.publicKey);
      expect(initialBalance - finalBalance).to.be.greaterThan(listing.standardPrice.toNumber());
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Client can approve and release funds", async () => {
    // Get initial balances
    const initialFreelancerBalance = await provider.connection.getBalance(freelancer.publicKey);
    const initialFeeCollectorBalance = await provider.connection.getBalance(feeCollector.publicKey);
    
    try {
      await program.methods
        .approveAndRelease()
        .accounts({
          client: client.publicKey,
          clientProfile: clientProfilePDA,
          freelancer: freelancer.publicKey,
          freelancerProfile: freelancerProfilePDA,
          escrow: escrowPDA,
          escrowVault: escrowVaultPDA,
          feeCollector: feeCollector.publicKey,
          referrer: null,
          listing: listingPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([client])
        .rpc();
        
      // Verify escrow status changed
      const escrow = await program.account.escrow.fetch(escrowPDA);
      expect(escrow.status.completed).to.exist;
      expect(escrow.completionDate).to.not.be.null;
      
      // Verify funds were transferred correctly
      const finalFreelancerBalance = await provider.connection.getBalance(freelancer.publicKey);
      const finalFeeCollectorBalance = await provider.connection.getBalance(feeCollector.publicKey);
      
      // Calculate expected amounts
      const listing = await program.account.listing.fetch(listingPDA);
      const standardPrice = listing.standardPrice.toNumber();
      const feeAmount = standardPrice * 0.075; // 7.5% fee for premium user
      const freelancerAmount = standardPrice - feeAmount;
      
      // Check balances (with some allowance for rounding)
      expect(finalFreelancerBalance - initialFreelancerBalance).to.be.closeTo(freelancerAmount, 100);
      expect(finalFeeCollectorBalance - initialFeeCollectorBalance).to.be.closeTo(feeAmount, 100);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  // Create another escrow for dispute testing
  it("Can create another escrow for dispute testing", async () => {
    // Generate a new order ID
    const disputeOrderId = "dispute-" + Math.floor(Math.random() * 1000000);
    
    // Compute new escrow PDA
    let disputeEscrowPDA;
    [disputeEscrowPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), client.publicKey.toBuffer(), freelancer.publicKey.toBuffer(), Buffer.from(disputeOrderId)],
      program.programId
    );
    
    // Update the escrow PDA for future tests
    escrowPDA = disputeEscrowPDA;
    
    // Compute new escrow vault PDA
    [escrowVaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow-vault"), escrowPDA.toBuffer()],
      program.programId
    );
    
    try {
      await program.methods
        .createEscrow(
          disputeOrderId,
          { standard: {} }, // Package type
          null // No referrer
        )
        .accounts({
          client: client.publicKey,
          clientProfile: clientProfilePDA,
          freelancer: freelancer.publicKey,
          freelancerProfile: freelancerProfilePDA,
          listing: listingPDA,
          escrow: escrowPDA,
          escrowVault: escrowVaultPDA,
          referrer: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([client])
        .rpc();
        
      // Verify escrow was created
      const escrow = await program.account.escrow.fetch(escrowPDA);
      expect(escrow.status.active).to.exist;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Client can open a dispute", async () => {
    // Compute dispute PDA
    [disputePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("dispute"), escrowPDA.toBuffer()],
      program.programId
    );
    
    const reason = "Service not delivered as promised";
    
    try {
      await program.methods
        .openDispute(reason)
        .accounts({
          client: client.publicKey,
          freelancer: freelancer.publicKey,
          escrow: escrowPDA,
          dispute: disputePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([client])
        .rpc();
        
      // Verify dispute was created
      const dispute = await program.account.dispute.fetch(disputePDA);
      expect(dispute.escrow.toString()).to.equal(escrowPDA.toString());
      expect(dispute.client.toString()).to.equal(client.publicKey.toString());
      expect(dispute.freelancer.toString()).to.equal(freelancer.publicKey.toString());
      expect(dispute.reason).to.equal(reason);
      expect(dispute.status.open).to.exist;
      
      // Verify escrow status updated
      const escrow = await program.account.escrow.fetch(escrowPDA);
      expect(escrow.status.disputed).to.exist;
      expect(escrow.hasDispute).to.be.true;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
  
  it("Admin can resolve a dispute", async () => {
    // Get initial balances
    const initialClientBalance = await provider.connection.getBalance(client.publicKey);
    const initialFreelancerBalance = await provider.connection.getBalance(freelancer.publicKey);
    
    try {
      await program.methods
        .resolveDispute(
          { resolvedSplit: {} }, // Resolution in favor of both parties (50/50)
          "Both parties have valid points", // Admin notes
          50 // 50% to client, 50% to freelancer
        )
        .accounts({
          admin: admin.publicKey,
          dispute: disputePDA,
          escrow: escrowPDA,
          escrowVault: escrowVaultPDA,
          client: client.publicKey,
          clientProfile: clientProfilePDA,
          freelancer: freelancer.publicKey,
          feeCollector: feeCollector.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();
        
      // Verify dispute was resolved
      const dispute = await program.account.dispute.fetch(disputePDA);
      expect(dispute.status.resolvedSplit).to.exist;
      expect(dispute.resolutionDate).to.not.be.null;
      expect(dispute.adminNotes).to.equal("Both parties have valid points");
      
      // Verify escrow status
      const escrow = await program.account.escrow.fetch(escrowPDA);
      expect(escrow.status.completed).to.exist;
      expect(escrow.completionDate).to.not.be.null;
      
      // Verify funds were distributed
      const finalClientBalance = await provider.connection.getBalance(client.publicKey);
      const finalFreelancerBalance = await provider.connection.getBalance(freelancer.publicKey);
      
      // Client and freelancer should have received funds
      expect(finalClientBalance).to.be.greaterThan(initialClientBalance);
      expect(finalFreelancerBalance).to.be.greaterThan(initialFreelancerBalance);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});