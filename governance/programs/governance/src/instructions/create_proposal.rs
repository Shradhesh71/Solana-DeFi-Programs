use anchor_lang::prelude::*;

use crate::{error::GovernanceError, Proposal, ProposalStatus};


pub fn process_create_proposal(
    ctx: Context<CreateProposal>,
    proposal_id: u64,
    title: [u8; 32],
    description: [u8; 256],
    votes_needed_to_pass: u64,
    voting_period: i64,
) -> Result<()> {
    require!(votes_needed_to_pass > 0, GovernanceError::InvalidVotesNeeded);
    require!(voting_period > 0, GovernanceError::InvalidVotingPeriod);
    require!(voting_period <= 604800, GovernanceError::VotingPeriodTooLong); // Max 7 days

    let proposal = &mut ctx.accounts.proposal;

    proposal.id = proposal_id;
    proposal.title = title;
    proposal.description = description;
    proposal.votes_needed_to_pass = votes_needed_to_pass;
    proposal.voting_start = 0;
    proposal.voting_period = voting_period;
    proposal.creator = ctx.accounts.creator.key();
    proposal.proposal_status = ProposalStatus::Draft;
    proposal.voting_count = 0;
    proposal.bump = ctx.bumps.proposal;

    Ok(())
}


#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Proposal::INIT_SPACE, 
        seeds = [
            b"proposal", 
            &proposal_id.to_le_bytes(), 
            creator.key().as_ref()
        ],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}
