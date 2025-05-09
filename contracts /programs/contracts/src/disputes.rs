use anchor_lang::prelude::*;
use crate::escrow::*;
use crate::user::*; // Added to access UserProfile

#[account]
pub struct Dispute {
    pub escrow: Pubkey,            // Related escrow
    pub client: Pubkey,            // Client's wallet
    pub freelancer: Pubkey,        // Freelancer's wallet
    pub reason: String,            // Reason for dispute (max 500 chars)
    pub status: DisputeStatus,     // Status of the dispute
    pub creation_date: i64,        // When dispute was created
    pub resolution_date: Option<i64>, // When dispute was resolved
    pub admin_notes: Option<String>, // Admin notes (max 500 chars)
    pub bump: u8,                  // For PDA validation
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DisputeStatus {
    Open,
    ResolvedForClient,
    ResolvedForFreelancer,
    ResolvedSplit,
}

// Account context for opening a dispute
#[derive(Accounts)]
#[instruction(reason: String)]
pub struct OpenDispute<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: This is the freelancer's wallet
    pub freelancer: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref(), escrow.creation_date.to_string().as_bytes()],
        bump = escrow.bump,
        constraint = escrow.client == client.key() @ DisputeError::NotAuthorized,
        constraint = escrow.status == EscrowStatus::Active @ DisputeError::InvalidEscrowStatus,
        constraint = !escrow.has_dispute @ DisputeError::DisputeAlreadyExists
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        init,
        payer = client,
        space = 8 + 32 + 32 + 32 + 4 + 500 + 1 + 8 + 9 + 9 + 1,
        seeds = [b"dispute", escrow.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    
    pub system_program: Program<'info, System>,
}

// Account context for resolving a dispute (admin only)
#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"dispute", escrow.key().as_ref()],
        bump = dispute.bump,
        constraint = dispute.status == DisputeStatus::Open @ DisputeError::DisputeNotOpen
    )]
    pub dispute: Account<'info, Dispute>,
    
    #[account(
        mut,
        seeds = [b"escrow", dispute.client.key().as_ref(), dispute.freelancer.key().as_ref(), escrow.creation_date.to_string().as_bytes()],
        bump = escrow.bump,
        constraint = escrow.status == EscrowStatus::Disputed @ DisputeError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, Escrow>,
    
    /// CHECK: This account holds the escrow funds
    #[account(
        mut,
        seeds = [b"escrow-vault", escrow.key().as_ref()],
        bump,
    )]
    pub escrow_vault: AccountInfo<'info>,
    
    /// CHECK: This is the client's wallet
    #[account(mut, constraint = client.key() == dispute.client @ DisputeError::InvalidClient)]
    pub client: AccountInfo<'info>,
    
    /// CHECK: This is the freelancer's wallet
    #[account(mut, constraint = freelancer.key() == dispute.freelancer @ DisputeError::InvalidFreelancer)]
    pub freelancer: AccountInfo<'info>,
    
    /// CHECK: This is the platform fee collector
    #[account(mut)]
    pub fee_collector: AccountInfo<'info>,
    
    // Added client profile to fix the missing field error
    #[account(
        seeds = [b"user-profile", client.key().as_ref()],
        bump,
    )]
    pub client_profile: Account<'info, UserProfile>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum DisputeError {
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Invalid escrow status")]
    InvalidEscrowStatus,
    #[msg("Dispute already exists")]
    DisputeAlreadyExists,
    #[msg("Dispute not open")]
    DisputeNotOpen,
    #[msg("Invalid client")]
    InvalidClient,
    #[msg("Invalid freelancer")]
    InvalidFreelancer,
}