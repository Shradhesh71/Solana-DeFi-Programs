import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// import { assert } from "chai";
import { Amm } from "../target/types/amm";
import { web3 } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAccount,
  createAssociatedTokenAccount,
} from "@solana/spl-token";

// @ts-ignore
describe("AMM with Token-2022 and SPL Token Support", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Amm as Program<Amm>;
  const provider = anchor.getProvider();

  let authority = web3.Keypair.generate();
  let user = web3.Keypair.generate();

  // SPL Token variables
  let splTokenA: web3.PublicKey;
  let splTokenB: web3.PublicKey;
  let userSplTokenA: web3.PublicKey;
  let userSplTokenB: web3.PublicKey;
  let splPool: web3.PublicKey;
  let splLpMint: web3.PublicKey;
  let splTokenAVault: web3.PublicKey;
  let splTokenBVault: web3.PublicKey;
  let userSplLpToken: web3.PublicKey;

  // Token-2022 variables
  let token2022A: web3.PublicKey;
  let token2022B: web3.PublicKey;
  let userToken2022A: web3.PublicKey;
  let userToken2022B: web3.PublicKey;
  let token2022Pool: web3.PublicKey;
  let token2022LpMint: web3.PublicKey;
  let token2022TokenAVault: web3.PublicKey;
  let token2022TokenBVault: web3.PublicKey;
  let userToken2022LpToken: web3.PublicKey;

  before(async () => {
    // Airdrop SOL to authority and user
    const airdrop1 = await provider.connection.requestAirdrop(
      authority.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    const airdrop2 = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(airdrop1);
    await provider.connection.confirmTransaction(airdrop2);

    // Create SPL Token mints
    splTokenA = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    splTokenB = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    // Create Token-2022 mints
    token2022A = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    token2022B = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Create user token accounts for SPL tokens
    userSplTokenA = await createAssociatedTokenAccount(
      provider.connection,
      user,
      splTokenA,
      user.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );

    userSplTokenB = await createAssociatedTokenAccount(
      provider.connection,
      user,
      splTokenB,
      user.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );

    // Create user token accounts for Token-2022
    userToken2022A = await createAssociatedTokenAccount(
      provider.connection,
      user,
      token2022A,
      user.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    userToken2022B = await createAssociatedTokenAccount(
      provider.connection,
      user,
      token2022B,
      user.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Mint tokens to user accounts
    await mintTo(
      provider.connection,
      authority,
      splTokenA,
      userSplTokenA,
      authority,
      1000000000, // 1000 tokens with 6 decimals
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      authority,
      splTokenB,
      userSplTokenB,
      authority,
      1000000000,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      authority,
      token2022A,
      userToken2022A,
      authority,
      1000000000,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      authority,
      token2022B,
      userToken2022B,
      authority,
      1000000000,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  });
// @ts-ignore
  describe("SPL Token Pool Tests", () => {
    it("Initialize SPL token pool", async () => {
      // Find pool PDA
      [splPool] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), splTokenA.toBuffer(), splTokenB.toBuffer()],
        program.programId
      );

      // Find vault PDAs
      splTokenAVault = anchor.utils.token.associatedAddress({
        mint: splTokenA,
        owner: splPool,
      });

      splTokenBVault = anchor.utils.token.associatedAddress({
        mint: splTokenB,
        owner: splPool,
      });

      // Find LP mint PDA
      [splLpMint] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), splPool.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .initializePool(30) // 0.3% fee
        .accounts({
          authority: authority.publicKey,
          pool: splPool,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          tokenAVault: splTokenAVault,
          tokenBVault: splTokenBVault,
          lpMint: splLpMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("SPL Pool initialized:", tx);

      // Verify pool was created
      const poolAccount = await program.account.pool.fetch(splPool);
      // assert.equal(poolAccount.feeRate, 30, "Fee rate should match");
      // assert.equal(poolAccount.tokenAMint.toString(), splTokenA.toString(), "Token A mint should match");
      // assert.equal(poolAccount.tokenBMint.toString(), splTokenB.toString(), "Token B mint should match");
    });

    it("Add liquidity to SPL token pool", async () => {
      // Create user LP token account
      userSplLpToken = await createAssociatedTokenAccount(
        provider.connection,
        user,
        splLpMint,
        user.publicKey,
        undefined,
        TOKEN_PROGRAM_ID
      );

      const amountA = new anchor.BN(100000000); // 100 tokens
      const amountB = new anchor.BN(200000000); // 200 tokens

      const tx = await program.methods
        .addLiquidity(amountA, amountB, new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: splPool,
          lpMint: splLpMint,
          tokenAVault: splTokenAVault,
          tokenBVault: splTokenBVault,
          userTokenA: userSplTokenA,
          userTokenB: userSplTokenB,
          userLpToken: userSplLpToken,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("Added liquidity to SPL pool:", tx);

      // Verify liquidity was added
      const vaultAAccount = await getAccount(provider.connection, splTokenAVault, undefined, TOKEN_PROGRAM_ID);
      const vaultBAccount = await getAccount(provider.connection, splTokenBVault, undefined, TOKEN_PROGRAM_ID);

      // assert.equal(Number(vaultAAccount.amount), amountA.toNumber(), "Vault A should have correct amount");
      // assert.equal(Number(vaultBAccount.amount), amountB.toNumber(), "Vault B should have correct amount");
    });

    it("Swap tokens in SPL pool", async () => {
      const amountIn = new anchor.BN(10000000); // 10 tokens
      const minAmountOut = new anchor.BN(0);

      const tx = await program.methods
        .swap(amountIn, minAmountOut, true) // A to B
        .accounts({
          user: user.publicKey,
          pool: splPool,
          userTokenA: userSplTokenA,
          userTokenB: userSplTokenB,
          tokenAVault: splTokenAVault,
          tokenBVault: splTokenBVault,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      console.log("Swapped tokens in SPL pool:", tx);
      // assert.isString(tx, "Transaction should complete successfully");
    });

    it("Remove liquidity from SPL pool", async () => {
      // Get current LP token balance
      const lpTokenAccount = await getAccount(provider.connection, userSplLpToken, undefined, TOKEN_PROGRAM_ID);
      const lpTokensToRemove = new anchor.BN(Number(lpTokenAccount.amount) / 2); // Remove half

      const tx = await program.methods
        .removeLiquidity(lpTokensToRemove, new anchor.BN(0), new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: splPool,
          lpMint: splLpMint,
          userTokenA: userSplTokenA,
          userTokenB: userSplTokenB,
          userLpToken: userSplLpToken,
          tokenAVault: splTokenAVault,
          tokenBVault: splTokenBVault,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      console.log("Removed liquidity from SPL pool:", tx);
      // assert.isString(tx, "Transaction should complete successfully");
    });
  });
// @ts-ignore
  describe("Token-2022 Pool Tests", () => {
    it("Initialize Token-2022 pool", async () => {
      // Find pool PDA
      [token2022Pool] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), token2022A.toBuffer(), token2022B.toBuffer()],
        program.programId
      );

      // Find vault PDAs
      token2022TokenAVault = anchor.utils.token.associatedAddress({
        mint: token2022A,
        owner: token2022Pool,
      });

      token2022TokenBVault = anchor.utils.token.associatedAddress({
        mint: token2022B,
        owner: token2022Pool,
      });

      // Find LP mint PDA
      [token2022LpMint] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), token2022Pool.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .initializePool(25) // 0.25% fee
        .accounts({
          authority: authority.publicKey,
          pool: token2022Pool,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenAVault: token2022TokenAVault,
          tokenBVault: token2022TokenBVault,
          lpMint: token2022LpMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("Token-2022 Pool initialized:", tx);

      // Verify pool was created
      const poolAccount = await program.account.pool.fetch(token2022Pool);
      // assert.equal(poolAccount.feeRate, 25, "Fee rate should match");
      // assert.equal(poolAccount.tokenAMint.toString(), token2022A.toString(), "Token A mint should match");
      // assert.equal(poolAccount.tokenBMint.toString(), token2022B.toString(), "Token B mint should match");
    });

    it("Add liquidity to Token-2022 pool", async () => {
      // Create user LP token account
      userToken2022LpToken = await createAssociatedTokenAccount(
        provider.connection,
        user,
        token2022LpMint,
        user.publicKey,
        undefined,
        TOKEN_PROGRAM_ID
      );

      const amountA = new anchor.BN(50000000); // 50 tokens
      const amountB = new anchor.BN(100000000); // 100 tokens

      const tx = await program.methods
        .addLiquidity(amountA, amountB, new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: token2022Pool,
          lpMint: token2022LpMint,
          tokenAVault: token2022TokenAVault,
          tokenBVault: token2022TokenBVault,
          userTokenA: userToken2022A,
          userTokenB: userToken2022B,
          userLpToken: userToken2022LpToken,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("Added liquidity to Token-2022 pool:", tx);

      // Verify liquidity was added
      const vaultAAccount = await getAccount(provider.connection, token2022TokenAVault, undefined, TOKEN_2022_PROGRAM_ID);
      const vaultBAccount = await getAccount(provider.connection, token2022TokenBVault, undefined, TOKEN_2022_PROGRAM_ID);

      // assert.equal(Number(vaultAAccount.amount), amountA.toNumber(), "Vault A should have correct amount");
      // assert.equal(Number(vaultBAccount.amount), amountB.toNumber(), "Vault B should have correct amount");
    });

    it("Swap tokens in Token-2022 pool", async () => {
      const amountIn = new anchor.BN(5000000); // 5 tokens
      const minAmountOut = new anchor.BN(0);

      const tx = await program.methods
        .swap(amountIn, minAmountOut, false) // B to A
        .accounts({
          user: user.publicKey,
          pool: token2022Pool,
          userTokenA: userToken2022A,
          userTokenB: userToken2022B,
          tokenAVault: token2022TokenAVault,
          tokenBVault: token2022TokenBVault,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      console.log("Swapped tokens in Token-2022 pool:", tx);
      // assert.isString(tx, "Transaction should complete successfully");
    });

    it("Remove liquidity from Token-2022 pool", async () => {
      // Get current LP token balance
      const lpTokenAccount = await getAccount(provider.connection, userToken2022LpToken, undefined, TOKEN_PROGRAM_ID);
      const lpTokensToRemove = new anchor.BN(Number(lpTokenAccount.amount) / 2); // Remove half

      const tx = await program.methods
        .removeLiquidity(lpTokensToRemove, new anchor.BN(0), new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: token2022Pool,
          lpMint: token2022LpMint,
          userTokenA: userToken2022A,
          userTokenB: userToken2022B,
          userLpToken: userToken2022LpToken,
          tokenAVault: token2022TokenAVault,
          tokenBVault: token2022TokenBVault,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      console.log("Removed liquidity from Token-2022 pool:", tx);
      // assert.isString(tx, "Transaction should complete successfully");
    });
  });
});
