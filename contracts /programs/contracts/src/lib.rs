use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction; // Correct import for system_instruction

// Declare modules
mod user;
mod listing;
mod escrow;
mod disputes;

// Re-export the modules
pub use user::*;
pub use listing::*;
pub use escrow::*;
pub use disputes::*;

// Your program ID (update this after building)
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod contracts {
    use super::*;
    
    // === User Management ===
    
    // Register a new user
    pub fn register_user(
        ctx: Context<RegisterUser>,
        username: String,
        user_type: UserType,
    ) -> Result<()> {
        // Validate inputs
        if username.len() > 50 {
            return err!(UserError::UsernameTooLong);
        }
        
        // Initialize user profile
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.authority = ctx.accounts.authority.key();
        user_profile.username = username;
        user_profile.user_type = user_type;
        user_profile.is_premium = false;
        user_profile.reputation_score = 50; // Start at neutral
        user_profile.total_transactions = 0;
        user_profile.creation_date = Clock::get()?.unix_timestamp;
        user_profile.bump = ctx.bumps.user_profile; // Direct access to bump
        
        Ok(())
    }
    
    // Upgrade user to premium
    pub fn upgrade_to_premium(ctx: Context<UpdateUser>) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        
        // User is already verified through the account constraints
        user_profile.is_premium = true;
        
        Ok(())
    }
    
    // === Listing Management ===
    
    // Create a new listing
    pub fn create_listing(
        ctx: Context<CreateListing>,
        listing_id: String,
        title: String,
        description: String,
        category: String,
        standard_price: u64,
        deluxe_price: Option<u64>,
        premium_price: Option<u64>,
    ) -> Result<()> {
        // Validate inputs
        if title.len() > 100 {
            return err!(ListingError::TitleTooLong);
        }
        if description.len() > 500 {
            return err!(ListingError::DescriptionTooLong);
        }
        if category.len() > 50 {
            return err!(ListingError::CategoryTooLong);
        }
        
        // Initialize listing
        let listing = &mut ctx.accounts.listing;
        listing.authority = ctx.accounts.authority.key();
        listing.title = title;
        listing.description = description;
        listing.category = category;
        listing.standard_price = standard_price;
        listing.deluxe_price = deluxe_price; // Already Option<u64>
        listing.premium_price = premium_price; // Already Option<u64>
        listing.active = true;
        listing.total_orders = 0;
        listing.completed_orders = 0;
        listing.creation_date = Clock::get()?.unix_timestamp;
        listing.bump = ctx.bumps.listing; // Direct access to bump
        
        Ok(())
    }
    
    // Update an existing listing
    pub fn update_listing(
        ctx: Context<UpdateListing>,
        title: Option<String>,
        description: Option<String>,
        category: Option<String>,
        standard_price: Option<u64>,
        deluxe_price: Option<u64>,
        premium_price: Option<u64>,
        active: Option<bool>,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        
        // Update optional fields if provided
        if let Some(title) = title {
            if title.len() > 100 {
                return err!(ListingError::TitleTooLong);
            }
            listing.title = title;
        }
        
        if let Some(description) = description {
            if description.len() > 500 {
                return err!(ListingError::DescriptionTooLong);
            }
            listing.description = description;
        }
        
        if let Some(category) = category {
            if category.len() > 50 {
                return err!(ListingError::CategoryTooLong);
            }
            listing.category = category;
        }
        
        if let Some(standard_price) = standard_price {
            listing.standard_price = standard_price;
        }
        
        if let Some(deluxe_price) = deluxe_price {
            listing.deluxe_price = Some(deluxe_price);
        }
        
        if let Some(premium_price) = premium_price {
            listing.premium_price = Some(premium_price);
        }
        
        if let Some(active) = active {
            listing.active = active;
        }
        
        Ok(())
    }
    
    // === Escrow Management ===
    
    // Create a new escrow for a service
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        order_id: String,
        package_type: PackageType,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let listing = &ctx.accounts.listing;
        
        // Determine price based on package type
        let deposit_amount = match package_type {
            PackageType::Standard => listing.standard_price,
            PackageType::Deluxe => listing.deluxe_price.ok_or(error!(EscrowError::InvalidStatusTransition))?,
            PackageType::Premium => listing.premium_price.ok_or(error!(EscrowError::InvalidStatusTransition))?,
        };
        
        // Initialize escrow
        escrow.client = ctx.accounts.client.key();
        escrow.freelancer = ctx.accounts.freelancer.key();
        escrow.deposit_amount = deposit_amount;
        escrow.status = EscrowStatus::Active;
        escrow.listing_id = listing.key();
        escrow.package_type = package_type;
        escrow.creation_date = Clock::get()?.unix_timestamp;
        escrow.completion_date = None;
        
        // Set fee rates
        escrow.standard_fee_basis_points = 1000; // 10%
        escrow.premium_fee_basis_points = 750;   // 7.5%
        
        escrow.referrer = referrer;
        escrow.has_dispute = false;
        escrow.bump = ctx.bumps.escrow; // Direct access to bump
        
        // Transfer SOL from client to escrow vault
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.client.key(),
            &ctx.accounts.escrow_vault.key(),
            deposit_amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.escrow_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        // Update listing stats
        let listing = &mut ctx.accounts.listing;
        listing.total_orders += 1;
        
        Ok(())
    }
    
    // Release escrow funds after work approval
    pub fn approve_and_release(ctx: Context<ReleaseEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        // Calculate fees
        let client_profile = &ctx.accounts.client_profile;
        let fee_basis_points = if client_profile.is_premium {
            escrow.premium_fee_basis_points
        } else {
            escrow.standard_fee_basis_points
        };
        
        let fee_amount = (escrow.deposit_amount * fee_basis_points as u64) / 10000;
        let freelancer_amount = escrow.deposit_amount - fee_amount;
        
        // If there's a referrer, calculate their fee
        let referrer_fee = if escrow.referrer.is_some() {
            // 0.5% of the total fee (which is 5% of the fee amount)
            fee_amount / 20
        } else {
            0
        };
        
        let platform_fee = fee_amount - referrer_fee;
        
        // Transfer to freelancer
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= freelancer_amount;
        **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += freelancer_amount;
        
        // Transfer platform fee
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.fee_collector.to_account_info().try_borrow_mut_lamports()? += platform_fee;
        
        // Transfer referrer fee if applicable
        if let Some(ref referrer) = escrow.referrer {
            if referrer_fee > 0 && ctx.accounts.referrer.is_some() {
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= referrer_fee;
                **ctx.accounts.referrer.as_ref().unwrap().to_account_info().try_borrow_mut_lamports()? += referrer_fee;
            }
        }
        
        // Update escrow status
        escrow.status = EscrowStatus::Completed;
        escrow.completion_date = Some(Clock::get()?.unix_timestamp);
        
        // Update user profiles
        let freelancer_profile = &mut ctx.accounts.freelancer_profile;
        freelancer_profile.total_transactions += 1;
        
        let client_profile = &mut ctx.accounts.client_profile;
        client_profile.total_transactions += 1;
        
        // Update listing stats
        let listing = &mut ctx.accounts.listing;
        listing.completed_orders += 1;
        
        Ok(())
    }
    
    // === Dispute Management ===
    
    // Open a dispute
    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        reason: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let dispute = &mut ctx.accounts.dispute;
        
        // Update escrow status
        escrow.status = EscrowStatus::Disputed;
        escrow.has_dispute = true;
        
        // Initialize dispute
        dispute.escrow = escrow.key();
        dispute.client = ctx.accounts.client.key();
        dispute.freelancer = ctx.accounts.freelancer.key();
        dispute.reason = reason;
        dispute.status = DisputeStatus::Open;
        dispute.creation_date = Clock::get()?.unix_timestamp;
        dispute.resolution_date = None;
        dispute.admin_notes = None;
        dispute.bump = ctx.bumps.dispute; // Direct access to bump
        
        Ok(())
    }
    
    // Resolve a dispute (admin only)
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeStatus,
        admin_notes: Option<String>,
        client_percentage: u8, // 0-100 percentage for the client
    ) -> Result<()> {
        let dispute = &mut ctx.accounts.dispute;
        let escrow = &mut ctx.accounts.escrow;
        
        // Validate client percentage
        if client_percentage > 100 {
            return err!(DisputeError::InvalidClient);
        }
        
        // Update dispute
        dispute.status = resolution;
        dispute.resolution_date = Some(Clock::get()?.unix_timestamp);
        
        if let Some(notes) = admin_notes {
            dispute.admin_notes = Some(notes);
        }
        
        // Distribute funds based on resolution
        let escrow_amount = escrow.deposit_amount;
        
        match resolution {
            DisputeStatus::ResolvedForClient => {
                // Return all funds to client
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= escrow_amount;
                **ctx.accounts.client.to_account_info().try_borrow_mut_lamports()? += escrow_amount;
                escrow.status = EscrowStatus::Refunded;
            },
            DisputeStatus::ResolvedForFreelancer => {
                // Calculate fees and distribute as in normal approval
                let client_profile = &ctx.accounts.client_profile;
                let fee_basis_points = if client_profile.is_premium {
                    escrow.premium_fee_basis_points
                } else {
                    escrow.standard_fee_basis_points
                };
                
                let fee_amount = (escrow_amount * fee_basis_points as u64) / 10000;
                let freelancer_amount = escrow_amount - fee_amount;
                
                // Transfer to freelancer
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= freelancer_amount;
                **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += freelancer_amount;
                
                // Transfer platform fee
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
                **ctx.accounts.fee_collector.to_account_info().try_borrow_mut_lamports()? += fee_amount;
                
                escrow.status = EscrowStatus::Completed;
            },
            DisputeStatus::ResolvedSplit => {
                // Split funds based on client_percentage
                let client_amount = (escrow_amount * client_percentage as u64) / 100;
                let remaining = escrow_amount - client_amount;
                
                // Calculate fees on freelancer's portion
                let client_profile = &ctx.accounts.client_profile;
                let fee_basis_points = if client_profile.is_premium {
                    escrow.premium_fee_basis_points
                } else {
                    escrow.standard_fee_basis_points
                };
                
                let fee_amount = (remaining * fee_basis_points as u64) / 10000;
                let freelancer_amount = remaining - fee_amount;
                
                // Transfer to client
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= client_amount;
                **ctx.accounts.client.to_account_info().try_borrow_mut_lamports()? += client_amount;
                
                // Transfer to freelancer
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= freelancer_amount;
                **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += freelancer_amount;
                
                // Transfer platform fee
                **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
                **ctx.accounts.fee_collector.to_account_info().try_borrow_mut_lamports()? += fee_amount;
                
                escrow.status = EscrowStatus::Completed;
            },
            _ => return err!(DisputeError::InvalidEscrowStatus),
        }
        
        // Update completion date
        escrow.completion_date = Some(Clock::get()?.unix_timestamp);
        
        Ok(())
    }
}