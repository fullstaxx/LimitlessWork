use anchor_lang::prelude::*;
use crate::user::*;

#[account]
pub struct Listing {
    pub authority: Pubkey,         // Freelancer's wallet
    pub title: String,             // Title (max 100 chars)
    pub description: String,       // Description (max 500 chars)
    pub category: String,          // Category (max 50 chars)
    pub standard_price: u64,       // Price in lamports for standard package
    pub deluxe_price: Option<u64>, // Price for deluxe package (if offered)
    pub premium_price: Option<u64>, // Price for premium package (if offered)
    pub active: bool,              // Whether listing is active
    pub total_orders: u64,         // Total number of orders
    pub completed_orders: u64,     // Completed orders
    pub creation_date: i64,        // When the listing was created
    pub bump: u8,                  // For PDA validation
}

#[derive(Accounts)]
#[instruction(listing_id: String, title: String, description: String, category: String)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"user-profile", authority.key().as_ref()],
        bump,
        constraint = user_profile.user_type == UserType::Freelancer @ ListingError::NotFreelancer
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 100 + 4 + 500 + 4 + 50 + 8 + 9 + 9 + 1 + 8 + 8 + 8 + 1,
        seeds = [b"listing", authority.key().as_ref(), listing_id.as_bytes()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateListing<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"listing", authority.key().as_ref(), listing.title.as_bytes()],
        bump,
        constraint = listing.authority == authority.key() @ ListingError::Unauthorized
    )]
    pub listing: Account<'info, Listing>,
}

#[error_code]
pub enum ListingError {
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Category too long")]
    CategoryTooLong,
    #[msg("Not a freelancer account")]
    NotFreelancer,
    #[msg("Unauthorized")]
    Unauthorized,
}