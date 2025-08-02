use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub id: u64,
    pub title: [u8; 32],
    pub description: [u8; 256],
    pub votes_needed_to_pass: u64,
    pub voting_start: i64,
    pub voting_period: i64,
    pub creator: Pubkey,
    pub proposal_status: ProposalStatus,
    pub voting_count: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum ProposalStatus {
    Draft,
    Voting,
    Passed,
    Failed,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub voted: bool,
    pub bump: u8
}