use anchor_lang::prelude::*;
use crate::user::*;
use crate::listing::*;

#[account]
pub struct Escrow {
    pub client: Pubkey,            // Client's wallet
    pub freelancer: Pubkey,        // Freelancer's wallet
    pub deposit_amount: u64,       // Amount in escrow in lamports
    pub status: EscrowStatus,      // Current status
    pub listing_id: Pubkey,        // Reference to the listing
    pub package_type: PackageType, // Which package was purchased
    pub creation_date: i64,        // When created
    pub completion_date: Option<i64>, // When completed
    pub standard_fee_basis_points: u16, // 1000 = 10%
    pub premium_fee_basis_points: u16,  // 750 = 7.5%
    pub referrer: Option<Pubkey>,  // Referrer if any
    pub has_dispute: bool,         // If there's an active dispute
    pub bump: u8,                  // For PDA validation
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Active,
    Completed,
    Refunded,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PackageType {
    Standard,
    Deluxe,
    Premium,
}

// Account context for creating an escrow
#[derive(Accounts)]
#[instruction(order_id: String, package_type: PackageType)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        seeds = [b"user-profile", client.key().as_ref()],
        bump,
    )]
    pub client_profile: Account<'info, UserProfile>,
    
    /// CHECK: This is the freelancer's wallet
    pub freelancer: AccountInfo<'info>,
    
    #[account(
        seeds = [b"user-profile", freelancer.key().as_ref()],
        bump,
        constraint = freelancer_profile.user_type == UserType::Freelancer @ EscrowError::NotFreelancer
    )]
    pub freelancer_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [b"listing", freelancer.key().as_ref(), listing.title.as_bytes()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,
    
    #[account(
        init,
        payer = client,
        space = 8 + 32 + 32 + 8 + 1 + 32 + 1 + 8 + 9 + 2 + 2 + 33 + 1 + 1,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref(), order_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    /// CHECK: This account will hold the escrow funds
    #[account(
        seeds = [b"escrow-vault", escrow.key().as_ref()],
        bump,
    )]
    pub escrow_vault: AccountInfo<'info>,
    
    /// CHECK: Optional referrer
    pub referrer: Option<AccountInfo<'info>>,
    
    pub system_program: Program<'info, System>,
}

// Account context for releasing escrow funds
#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user-profile", client.key().as_ref()],
        bump,
    )]
    pub client_profile: Account<'info, UserProfile>,
    
    /// CHECK: This is the freelancer's wallet
    #[account(mut)]
    pub freelancer: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"user-profile", freelancer.key().as_ref()],
        bump,
    )]
    pub freelancer_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref(), escrow.creation_date.to_string().as_bytes()],
        bump = escrow.bump,
        constraint = escrow.client == client.key() @ EscrowError::NotAuthorized,
        constraint = escrow.status == EscrowStatus::Active @ EscrowError::InvalidStatusTransition
    )]
    pub escrow: Account<'info, Escrow>,
    
    /// CHECK: This account holds the escrow funds
    #[account(
        mut,
        seeds = [b"escrow-vault", escrow.key().as_ref()],
        bump,
    )]
    pub escrow_vault: AccountInfo<'info>,
    
    /// CHECK: This is the platform fee collector
    #[account(mut)]
    pub fee_collector: AccountInfo<'info>,
    
    /// CHECK: Optional referrer
    #[account(mut)]
    pub referrer: Option<AccountInfo<'info>>,
    
    // Added the listing account to fix the "no field listing" error
    #[account(
        mut,
        seeds = [b"listing", freelancer.key().as_ref(), listing.title.as_bytes()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum EscrowError {
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Invalid status transition")]
    InvalidStatusTransition,
    #[msg("Escrow already in dispute")]
    AlreadyInDispute,
    #[msg("Not a freelancer account")]
    NotFreelancer,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}