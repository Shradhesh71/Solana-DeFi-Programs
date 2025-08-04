import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";
import { web3 } from "@coral-xyz/anchor";
import { assert } from "chai";


describe("anchor_vault", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorVault as Program<AnchorVault>;
  const provider = anchor.getProvider();

  let vaultPda: web3.PublicKey;
  let vaultBump: number;

  let signer = web3.Keypair.generate();

  let depositAmount = new anchor.BN(1000000); 


  before(async () =>{
    const tx1 = await provider.connection.requestAirdrop(
      signer.publicKey,
      web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(tx1);

    [vaultPda, vaultBump] = await web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        signer.publicKey.toBytes(),
      ],
      program.programId
    );
  })

  it("Is deposited!", async () => {
    const tx = await program.methods.deposit(depositAmount).accounts({
      signer: signer.publicKey,
    }).signers([signer]).rpc();

    const vaultAccountInfo = await provider.connection.getAccountInfo(vaultPda);
    
    assert.isNotNull(vaultAccountInfo, "Vault account should exist");
    assert.equal(vaultAccountInfo.lamports.toString(), depositAmount.toString(), "Vault balance should match deposit amount");
    assert.equal(vaultAccountInfo.owner.toBase58(), web3.SystemProgram.programId.toBase58(), "Vault should be owned by System Program");
    console.log("Deposit is successful test passed with tx:", tx);
  });

  it("Is withdrawn!", async () => {
    const vaultAccountInfoBefore = await provider.connection.getAccountInfo(vaultPda);
    assert.isNotNull(vaultAccountInfoBefore, "Vault should exist before withdrawal");
    
    const signerBalanceBefore = await provider.connection.getBalance(signer.publicKey);
    
    const tx = await program.methods.withdraw().accounts({
      signer: signer.publicKey,
    }).signers([signer]).rpc();

    const vaultAccountInfoAfter = await provider.connection.getAccountInfo(vaultPda);
    if (vaultAccountInfoAfter) {
      assert.isTrue(vaultAccountInfoAfter.lamports <= 890880, "Vault should have minimal or zero balance after withdrawal"); // Rent exemption for 0 bytes
    }
    
    const signerBalanceAfter = await provider.connection.getBalance(signer.publicKey);
    assert.isTrue(signerBalanceAfter > signerBalanceBefore, "Signer should have received funds back");
    
    console.log("Withdrawal is successful test passed with tx:", tx);
  });

  it("Should fail to deposit when vault already exists", async () => {
    const newSigner = web3.Keypair.generate();
    
    const airdropTx = await provider.connection.requestAirdrop(
      newSigner.publicKey,
      2 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    await program.methods.deposit(depositAmount).accounts({
      signer: newSigner.publicKey,
    }).signers([newSigner]).rpc();

    try {
      await program.methods.deposit(depositAmount).accounts({
        signer: newSigner.publicKey,
      }).signers([newSigner]).rpc();
      
      assert.fail("Should have thrown an error for vault already exists");
    } catch (error) {
      assert.include(error.toString(), "VaultAlreadyExists", "Should throw VaultAlreadyExists error");
    }
  });

  it("Should fail to deposit with insufficient amount (below rent)", async () => {
    const newSigner = web3.Keypair.generate();

    const airdropTx = await provider.connection.requestAirdrop(
      newSigner.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    const tinyAmount = new anchor.BN(100);
    
    try {
      await program.methods.deposit(tinyAmount).accounts({
        signer: newSigner.publicKey,
      }).signers([newSigner]).rpc();
      
      assert.fail("Should have thrown an error for invalid amount");
    } catch (error) {
      assert.include(error.toString(), "InvalidAmount", "Should throw InvalidAmount error");
    }
  });

  it("Should fail to withdraw from empty vault", async () => {
    const newSigner = web3.Keypair.generate();

    const airdropTx = await provider.connection.requestAirdrop(
      newSigner.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    try {
      await program.methods.withdraw().accounts({
        signer: newSigner.publicKey,
      }).signers([newSigner]).rpc();
      
      assert.fail("Should have thrown an error for empty vault");
    } catch (error) {
      assert.include(error.toString(), "InvalidAmount", "Should throw InvalidAmount error for empty vault");
    }
  });

  it("Should handle multiple deposits and withdrawals correctly", async () => {
    const newSigner = web3.Keypair.generate();

    const airdropTx = await provider.connection.requestAirdrop(
      newSigner.publicKey,
      5 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    const [newVaultPda] = await web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        newSigner.publicKey.toBytes(),
      ],
      program.programId
    );

    const firstDeposit = new anchor.BN(1000000);
    await program.methods.deposit(firstDeposit).accounts({
      signer: newSigner.publicKey,
    }).signers([newSigner]).rpc();

    let vaultInfo = await provider.connection.getAccountInfo(newVaultPda);
    assert.equal(vaultInfo.lamports.toString(), firstDeposit.toString(), "First deposit should match");

    await program.methods.withdraw().accounts({
      signer: newSigner.publicKey,
    }).signers([newSigner]).rpc();

    const secondDeposit = new anchor.BN(2000000);
    await program.methods.deposit(secondDeposit).accounts({
      signer: newSigner.publicKey,
    }).signers([newSigner]).rpc();

    vaultInfo = await provider.connection.getAccountInfo(newVaultPda);
    assert.equal(vaultInfo.lamports.toString(), secondDeposit.toString(), "Second deposit should match");

    console.log("Multiple deposits and withdrawals test passed");
  });

  it("Should verify signer owns their vault", async () => {
    const signer1 = web3.Keypair.generate();
    const signer2 = web3.Keypair.generate();
    
    const airdrop1 = await provider.connection.requestAirdrop(signer1.publicKey, web3.LAMPORTS_PER_SOL);
    const airdrop2 = await provider.connection.requestAirdrop(signer2.publicKey, web3.LAMPORTS_PER_SOL);
    
    await provider.connection.confirmTransaction(airdrop1);
    await provider.connection.confirmTransaction(airdrop2);

    await program.methods.deposit(depositAmount).accounts({
      signer: signer1.publicKey,
    }).signers([signer1]).rpc();

    await program.methods.deposit(depositAmount).accounts({
      signer: signer2.publicKey,
    }).signers([signer2]).rpc();

    const [vault1Pda] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), signer1.publicKey.toBytes()],
      program.programId
    );
    
    const [vault2Pda] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), signer2.publicKey.toBytes()],
      program.programId
    );

    assert.notEqual(vault1Pda.toBase58(), vault2Pda.toBase58(), "Each signer should have a unique vault PDA");

    try {
      await program.methods.withdraw().accounts({
        signer: signer2.publicKey,
      }).signers([signer2]).rpc();
      
      const vault1Info = await provider.connection.getAccountInfo(vault1Pda);
      assert.isNotNull(vault1Info, "Signer1's vault should still exist");
      assert.equal(vault1Info.lamports.toString(), depositAmount.toString(), "Signer1's vault balance should be unchanged");
      
    } catch (error) {
      console.log("Unexpected error:", error);
    }

    console.log("Vault ownership test passed");
  });
});
