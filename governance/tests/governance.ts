import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Governance } from "../target/types/governance";
import { web3 } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("governance", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.governance as Program<Governance>;
  const provider = anchor.getProvider();

  let proposalPda: web3.PublicKey;
  let voterRecordPda: web3.PublicKey;
  let voterRecordBump: number;
  let proposalBump: number;

  const title = Array.from(Buffer.from("Test Proposal".padEnd(32, "\0")));
  let description = Array.from(Buffer.from("This is a test proposal for governance.".padEnd(256, "\0")));
  const votesNeededToPass = new anchor.BN(1);
  const votingPeriod = new anchor.BN(5);
  const proposalId = new anchor.BN(1);
  const creator = provider.wallet;
  const voter = web3.Keypair.generate();

  before(async () =>{
    const tx1 = await provider.connection.requestAirdrop(
      voter.publicKey,
      web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(tx1);

    [proposalPda, proposalBump] = await web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"), 
        proposalId.toArrayLike(Buffer, "le", 8),
        creator.publicKey.toBytes(),
      ],
      program.programId
    );

    [voterRecordPda, voterRecordBump] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("voter_record"),
        voter.publicKey.toBytes(),
        proposalPda.toBytes(),
      ],
      program.programId
    );
  });

  it("Create Proposal!", async () => {
    try {
      const tx = await program.methods
        .createProposal(
          proposalId,
          title,
          description,
          votesNeededToPass,
          votingPeriod
        ).accounts({
          creator: creator.publicKey,
        }).rpc();

      const proposal = await program.account.proposal.fetch(proposalPda);
    
      assert.equal(proposal.title.toString(), title.toString());
      assert.equal(proposal.description.toString(), description.toString());
      assert.equal(proposal.votesNeededToPass.toString(), votesNeededToPass.toString());
      assert.equal(proposal.votingPeriod.toString(), votingPeriod.toString());
      assert.equal(proposal.creator.toString(), creator.publicKey.toString());
      assert.deepEqual(proposal.proposalStatus, { draft: {} });

      console.log("Create Proposal test passed successfully.");
    } catch (error) {
      console.error("Full error details:", error);
      if (error.logs) console.log("Program logs:", error.logs);
      throw error;
    }
  });

  it("Start Voting!", async () =>{
    try {
      const tx = await program.methods
        .startVoting(proposalId)
        .accounts({
          creator: creator.publicKey
        }).rpc();

      let proposal = await program.account.proposal.fetch(proposalPda);

      assert.deepEqual(proposal.proposalStatus, { voting: {} });
      assert.isTrue(proposal.votingStart.toNumber() > 0, "Voting start time should be set");

      console.log("Start Voting test passed successfully.");
    } catch (error) {
      console.error("Error starting voting:", error);
      if (error.logs) console.log("Program logs:", error.logs);
      throw error;
    }
  });

  it("Vote on Proposal!", async () => {
    try {
      const txSignature = await program.methods
        .vote(proposalId)
        .accounts({
          creator: creator.publicKey,
          voter: voter.publicKey
        })
        .signers([voter])
        .rpc({
          skipPreflight: false,
          preflightCommitment: "confirmed"
        });
      // Wait for confirmation
      await provider.connection.confirmTransaction(txSignature, "confirmed");

      const voterRecord = await program.account.voteRecord.fetch(voterRecordPda);
      
      assert.equal(voterRecord.voter.toString(), voter.publicKey.toString());
      assert.equal(voterRecord.proposal.toString(), proposalPda.toString());
      assert.equal(voterRecord.voted, true, "Voter should have voted");
      assert.equal(voterRecord.bump, voterRecordBump);

      const proposal = await program.account.proposal.fetch(proposalPda);
      assert.equal(proposal.votingCount.toNumber(), 1, "Vote count should be 1");

      console.log("Vote on Proposal test passed successfully.");
    } catch (error) {
      console.error("Error voting on proposal:", error);
      if (error.logs) console.log("Program logs:", error.logs);
      throw error;      
    }
  });

  it("Finalize Voting!", async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, votingPeriod.toNumber() * 1000));
      const tx = await program.methods
        .finalizeVoting(proposalId)
        .accounts({
          creator: creator.publicKey
        }).rpc();

      let proposal = await program.account.proposal.fetch(proposalPda);

      // Check if proposal should pass or fail based on actual vote count
      const shouldPass = proposal.votingCount.toNumber() >= proposal.votesNeededToPass.toNumber();

      if (shouldPass) {
        assert.deepEqual(proposal.proposalStatus, { passed: {} });
      } else {
        assert.deepEqual(proposal.proposalStatus, { failed: {} });
      }
      
      // console.log("Transaction signature:", tx);
      console.log("Finalize Voting test passed successfully.");
    } catch (error) {
      console.error("Error finalizing voting:", error);
      if (error.logs) console.log("Program logs:", error.logs);
      throw error;
    }
  })
});
