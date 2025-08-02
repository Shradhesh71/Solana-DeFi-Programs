use anchor_lang::prelude::*;

#[error_code]
pub enum GovernanceError {
    #[msg("The provided title is not valid UTF-8.")]
    InvalidUtf8,

    #[msg("Voting limit has been reached.")]
    VotingLimitReached,

    #[msg("You have already voted.")]
    AlreadyVoted,

    #[msg("Voting hasn't started yet.")]
    VotingNotStarted,

    #[msg("Voting duration has expired.")]
    VotingExpired,

    #[msg("Voting is not yet finished.")]
    VotingNotFinished,

    #[msg("Invalid proposal status for this operation.")]
    InvalidProposalStatus,

    #[msg("Voting count overflow occurred.")]
    VotingCountOverflow,

    #[msg("Unauthorized action by the creator.")]
    UnauthorizedCreator,

    #[msg("Invalid votes needed parameter")]
    InvalidVotesNeeded,

    #[msg("Invalid voting period")]
    InvalidVotingPeriod,
    
    #[msg("Voting period too long")]
    VotingPeriodTooLong,
}