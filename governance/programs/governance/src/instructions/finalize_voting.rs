use anchor_lang::prelude::*;

use crate::{error::GovernanceError, Proposal, ProposalStatus};


pub fn process_finalize_voting(ctx: Context<FinalizeVoting>, _proposal_id: u64) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    if proposal.creator != ctx.accounts.creator.key() {
        return Err(GovernanceError::UnauthorizedCreator.into());
    }

    if proposal.proposal_status != ProposalStatus::Voting {
        return Err(GovernanceError::InvalidProposalStatus.into());
    }

    if Clock::get()?.unix_timestamp < proposal.voting_start + proposal.voting_period {
        return Err(GovernanceError::VotingNotFinished.into());
    }

    if proposal.voting_count >= proposal.votes_needed_to_pass {
        proposal.proposal_status = ProposalStatus::Passed;
    } else {
        proposal.proposal_status = ProposalStatus::Failed;
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct FinalizeVoting<'info> {
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"proposal", &proposal_id.to_le_bytes(), creator.key().as_ref()],
        bump = proposal.bump,
        constraint = proposal.creator == creator.key()
    )]
    pub proposal: Account<'info, Proposal>,
}