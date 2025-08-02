use anchor_lang::prelude::*;

use crate::{error::GovernanceError, Proposal, ProposalStatus};


pub fn process_start_voting(ctx: Context<StartVoting>, _proposal_id: u64) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    if proposal.creator != ctx.accounts.creator.key() {
        return Err(GovernanceError::UnauthorizedCreator.into());
    }

    if proposal.proposal_status != ProposalStatus::Draft {
        return Err(GovernanceError::InvalidProposalStatus.into());
    }

    proposal.voting_start = Clock::get()?.unix_timestamp;
    proposal.proposal_status = ProposalStatus::Voting;

    Ok(())
}


#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct StartVoting<'info> {
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"proposal", 
            &proposal_id.to_le_bytes(), 
            creator.key().as_ref()
        ],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,
}
