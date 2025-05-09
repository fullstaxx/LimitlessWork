use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserProfile {
    pub authority: Pubkey,         // User's wallet address
    pub username: String,          // Username (max 50 chars)
    pub user_type: UserType,       // Freelancer or Client
    pub is_premium: bool,          // Premium status for fee calculation
    pub reputation_score: u8,      // 0-100 score
    pub total_transactions: u64,   // Number of transactions
    pub creation_date: i64,        // Unix timestamp
    pub bump: u8,                  // For PDA validation
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum UserType {
    #[default]
    Client,
    Freelancer,
}

// Account context for registering a new user
#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 50 + 1 + 1 + 1 + 8 + 8 + 1,
        seeds = [b"user-profile", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

// Account context for updating a user profile
#[derive(Accounts)]
pub struct UpdateUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user-profile", authority.key().as_ref()],
        bump,
        constraint = user_profile.authority == authority.key() @ UserError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[error_code]
pub enum UserError {
    #[msg("Username too long")]
    UsernameTooLong,
    #[msg("Username already taken")]
    UsernameAlreadyTaken,
    #[msg("Unauthorized")]
    Unauthorized,
}