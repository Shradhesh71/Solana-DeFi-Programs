use anchor_spl::{associated_token::spl_associated_token_account, token::spl_token};
use mollusk_svm::{Mollusk, result::Check};
use solana_sdk::{
    account::Account, 
    instruction::{Instruction}, 
    pubkey::Pubkey, 
    system_program,
    rent::Rent,
};
use anchor_lang::{ InstructionData, ToAccountMetas};
use anchor_escrow::instruction::Make;
use anchor_escrow::accounts::Make as MakeAccounts;


const ID: Pubkey = solana_sdk::pubkey!("9DysTsh5qG8v51YwAa7L3c3ZGt3VVB43vp79EfhSYxmB");

fn find_escrow_pda(maker: &Pubkey, seed: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"escrow", maker.as_ref(), &seed.to_le_bytes()], 
        &ID
    )
}

fn find_vault_pda(escrow: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"vault", escrow.as_ref(), mint.as_ref()], 
        &ID
    )
}
 
 #[test]
 fn test_make() {
    let mut mollusk = Mollusk::new(&ID, "/home/shradhesh/Desktop/solana/solana-program/anchor_escrow/target/deploy/anchor_escrow");

    mollusk_svm_programs_token::token::add_program(&mut mollusk);
    mollusk_svm_programs_token::associated_token::add_program(&mut mollusk);

    let maker = Pubkey::new_unique();
    let maker_account = Account::new(1_000_000_000, 0, &system_program::id());
  
    let mint_a = Pubkey::new_unique();
    let mint_b = Pubkey::new_unique();

    // Create mint accounts with proper SPL Token mint data structure
    let mut mint_a_data = vec![0u8; 82];
    // Mint authority (Option<COption::Some>) at offset 0
    mint_a_data[0..4].copy_from_slice(&1u32.to_le_bytes()); // Option::Some
    mint_a_data[4..36].copy_from_slice(maker.as_ref()); // mint authority pubkey
    // Supply at offset 36
    mint_a_data[36..44].copy_from_slice(&1000000u64.to_le_bytes()); // supply amount
    // Decimals at offset 44
    mint_a_data[44] = 9; // decimals
    // Is initialized at offset 45
    mint_a_data[45] = 1; // is_initialized = true
    // Freeze authority (Option::None) at offset 46
    mint_a_data[46..50].copy_from_slice(&0u32.to_le_bytes()); // Option::None
    
    let mut mint_b_data = vec![0u8; 82];
    mint_b_data[0..4].copy_from_slice(&1u32.to_le_bytes()); // Option::Some
    mint_b_data[4..36].copy_from_slice(maker.as_ref()); // mint authority pubkey
    mint_b_data[36..44].copy_from_slice(&2000000u64.to_le_bytes()); // supply amount
    mint_b_data[44] = 9; // decimals
    mint_b_data[45] = 1; // is_initialized = true
    mint_b_data[46..50].copy_from_slice(&0u32.to_le_bytes()); // Option::None

    let mint_a_account = Account {
        lamports: Rent::default().minimum_balance(82),
        data: mint_a_data,
        owner: spl_token::id(),
        executable: false,
        rent_epoch: 0,
    };
    
    let mint_b_account = Account {
        lamports: Rent::default().minimum_balance(82),
        data: mint_b_data,
        owner: spl_token::id(),
        executable: false,
        rent_epoch: 0,
    };
    let maker_ata_a = spl_associated_token_account::get_associated_token_address(&maker, &mint_a);

    // Create maker's ATA with proper token account data structure
    let mut maker_ata_data = vec![0u8; 165];
    maker_ata_data[..32].copy_from_slice(mint_a.as_ref()); // mint
    maker_ata_data[32..64].copy_from_slice(maker.as_ref()); // owner
    maker_ata_data[64..72].copy_from_slice(&1000u64.to_le_bytes()); // amount (1000 tokens)
    maker_ata_data[72] = 0;
    maker_ata_data[108] = 1; 
    maker_ata_data[109] = 0;
    
    let maker_ata_a_account = Account {
        lamports: Rent::default().minimum_balance(165),
        data: maker_ata_data,
        owner: spl_token::id(),
        executable: false,
        rent_epoch: 0,
    };

    let seed = 0u64;
    let (escrow, _bump) = find_escrow_pda(&maker, seed);
    let (vault, _vault_bump) = find_vault_pda(&escrow, &mint_a);

    let escrow_account = Account::new(0, 0, &system_program::id());
    
    let vault_account = Account::new(0, 0, &system_program::id());
    
    let accounts = MakeAccounts {
        maker,
        mint_a,
        mint_b, 
        maker_ata_a,
        escrow,
        vault,
        associated_token_program: spl_associated_token_account::id(),
        token_program: spl_token::id(),
        system_program: system_program::id(),
    };

    let deposit_amount = 1000u64;
    let receive_amount = 2000u64;

    let instruction_data = Make {
        seed,
        receive: receive_amount,
        amount: deposit_amount,
    };
        
    let instruction = Instruction {
        program_id: ID,
        accounts: accounts.to_account_metas(None),
        data: instruction_data.data(),
    };

    let account_map = vec![
        (maker, maker_account),
        (mint_a, mint_a_account),
        (mint_b, mint_b_account),
        (maker_ata_a, maker_ata_a_account),
        (escrow, escrow_account),
        (vault, vault_account),
        (spl_associated_token_account::id(), Account {
            lamports: 1,
            data: vec![],
            owner: solana_sdk::bpf_loader_upgradeable::id(),
            executable: true,
            rent_epoch: 0,
        }),
        (spl_token::id(), Account {
            lamports: 1,
            data: vec![],
            owner: solana_sdk::bpf_loader_upgradeable::id(),
            executable: true,
            rent_epoch: 0,
        }),
        (system_program::id(), Account {
            lamports: 1,
            data: vec![],
            owner: solana_sdk::native_loader::id(),
            executable: true,
            rent_epoch: 0,
        }),

        (solana_sdk::sysvar::rent::id(), Account {
            lamports: 1,
            data: vec![0; 24], // rent sysvar data size
            owner: solana_sdk::sysvar::id(),
            executable: false,
            rent_epoch: 0,
        }),
    ];

    let checks = vec![
        Check::success(),
        Check::account(&escrow)
            .lamports(anchor_lang::solana_program::rent::Rent::default().minimum_balance(8 + 32 + 32 + 8 + 8 + 1))
            .build(),
        Check::account(&vault)
            .lamports(anchor_lang::solana_program::rent::Rent::default().minimum_balance(165))
            .build(),
    ];
        
    mollusk.process_and_validate_instruction(
        &instruction,
        &account_map,
        &checks
    );
 }