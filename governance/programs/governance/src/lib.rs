use anchor_lang::prelude::*;

declare_id!("EcbveCd95F5SydRXvUcMLMrhDWSNWCRkpHtGh8M62ETb");

pub mod state;
pub mod error;
pub mod instructions;

pub use state::*;
pub use instructions::*;

#[program]
pub mod governance {
    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: [u8; 32],
        description: [u8; 256],
        votes_needed_to_pass: u64,
        voting_period: i64,
    ) -> Result<()> {
        instructions::process_create_proposal(
            ctx,
            proposal_id,
            title,
            description,
            votes_needed_to_pass,
            voting_period,
        )
    }

    pub fn start_voting(ctx: Context<StartVoting>, _proposal_id: u64) -> Result<()> {
        instructions::process_start_voting(ctx, _proposal_id)
    }

    pub fn vote(ctx: Context<Vote>, _proposal_id: u64) -> Result<()> {
        instructions::process_vote(ctx, _proposal_id)
    }

    pub fn finalize_voting(ctx: Context<FinalizeVoting>, _proposal_id: u64) -> Result<()> {
        instructions::process_finalize_voting(ctx, _proposal_id)
    }
}

