use anchor_lang::prelude::*;

use crate::{error::GovernanceError, Proposal, ProposalStatus, VoteRecord};


pub fn process_vote(ctx: Context<Vote>, _proposal_id: u64) -> Result<()> {

    let proposal = &mut ctx.accounts.proposal;
    let voter_record = &mut ctx.accounts.voter_record;

    if proposal.proposal_status != ProposalStatus::Voting {
        return Err(GovernanceError::InvalidProposalStatus.into());
    }

    if Clock::get()?.unix_timestamp < proposal.voting_start {
        return Err(GovernanceError::VotingNotStarted.into());
    }

    if Clock::get()?.unix_timestamp > proposal.voting_start + proposal.voting_period {
        return Err(GovernanceError::VotingExpired.into());
    }

    if proposal.voting_count >= proposal.votes_needed_to_pass {
        return Err(GovernanceError::VotingLimitReached.into());
    }

    if voter_record.voted {
        return Err(GovernanceError::AlreadyVoted.into());
    }

    let voter = &ctx.accounts.voter;
    voter_record.voter = voter.key();
    voter_record.proposal = proposal.key();
    voter_record.voted = true;
    voter_record.bump = ctx.bumps.voter_record;

    proposal.voting_count += 1;

    Ok(())
}



#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct Vote<'info> {
    /// CHECK: This account is used only for PDA derivation and is not modified.
    /// The creator's public key is needed to derive the proposal PDA seed.
    /// No additional validation is required as the PDA derivation will fail if incorrect.
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"proposal",&proposal_id.to_le_bytes(), creator.key().as_ref()],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"voter_record", voter.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub voter_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}
