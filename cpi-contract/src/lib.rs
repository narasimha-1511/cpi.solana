use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::{self, ProgramResult},
    instruction::{AccountMeta, Instruction},
    program::invoke,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    //this should cpi into another Contract
    //cross program invocation

    let mut iter = accounts.iter();

    let data_account = next_account_info(&mut iter)?;

    let double_contract_address = next_account_info(&mut iter)?;

    let instruction = Instruction {
        program_id: *double_contract_address.key,
        accounts: vec![AccountMeta {
            is_signer: true,
            is_writable: true,
            pubkey: *data_account.key,
        }],
        data: vec![],
    };

    invoke(&instruction, &[data_account.clone()]);

    Ok(())
}
