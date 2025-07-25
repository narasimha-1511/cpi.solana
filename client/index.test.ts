
import { test , expect, beforeAll } from "bun:test";
import { LiteSVM } from "litesvm";

import {
	PublicKey,
	Transaction,
	SystemProgram,
	Keypair,
	LAMPORTS_PER_SOL,
    TransactionInstruction,
} from "@solana/web3.js";

let svm: LiteSVM;
let contractPubKey: Keypair;
let cpiPubKey: Keypair;

beforeAll(() => {
	svm = new LiteSVM();
    contractPubKey = Keypair.generate();
    cpiPubKey = Keypair.generate();

    svm.addProgramFromFile(contractPubKey.publicKey, "./double.so");
    svm.addProgramFromFile(cpiPubKey.publicKey, "./cpi.so");

})

test("intialized data account old way with transaction", () => {
	const payer = new Keypair();

	svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
	
    const dataAccount = new Keypair();
	let blockhash = svm.latestBlockhash();
	
    const ixs = [
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
			newAccountPubkey: dataAccount.publicKey,
            lamports: Number(svm.minimumBalanceForRentExemption(4n)),
            space: 4,
            programId: contractPubKey.publicKey
		}),
	];

    // const ixs = new TransactionInstruction({
    //     keys:[
    //         {pubkey: dataAccount.publicKey , isSigner: true , isWritable: true}
    //     ],
    //     programId: contractPubKey.publicKey,
    //     data: Buffer.from("")
    // });
	
    const tx = new Transaction();
	tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
	// tx.add(ixs);
	tx.add(...ixs);
	tx.sign(payer,dataAccount);
	svm.sendTransaction(tx);
	const balanceAfter = svm.getBalance(dataAccount.publicKey);
	expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(4n));

    //the first transaciton is done brother
    function dob(){
        const ix2 = new TransactionInstruction({
            keys:[
                {pubkey: dataAccount.publicKey , isSigner: false , isWritable: true}
            ],
            programId: contractPubKey.publicKey,
            data: Buffer.from("")
        });

        const tx2 = new Transaction();
        tx2.recentBlockhash = svm.latestBlockhash();
        tx2.feePayer = payer.publicKey;
        tx2.add(ix2);
        tx2.sign(payer);
        svm.sendTransaction(tx2);
        svm.expireBlockhash()
    }

    dob();
    dob();
    dob();
    dob();

    const updatedDataAcccount = svm.getAccount(dataAccount.publicKey);
        
    expect(updatedDataAcccount?.data[0]).toBe(8);
    expect(updatedDataAcccount?.data[1]).toBe(0);
    expect(updatedDataAcccount?.data[2]).toBe(0);
    expect(updatedDataAcccount?.data[3]).toBe(0);

});

test(" test the cpi", () => {
    const payer = new Keypair();

    svm.airdrop(payer.publicKey , BigInt(LAMPORTS_PER_SOL));

    const dataAccount = new Keypair();

    const trans = new Transaction();

    const transi = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
        newAccountPubkey: dataAccount.publicKey,
        programId: contractPubKey.publicKey,
        space : 4
    });

    trans.recentBlockhash = svm.latestBlockhash();
    trans.add(transi);
    trans.sign(payer,dataAccount);
    svm.sendTransaction(trans);
    svm.expireBlockhash();

    let ldataac = svm.getAccount(dataAccount.publicKey);
    expect(ldataac?.lamports).toBe(Number(svm.minimumBalanceForRentExemption(4n)));//means added the account succesfully

    function cpi_contract_calls_double(){


    let tx = new Transaction();
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer=payer.publicKey;

    let txi = new TransactionInstruction({
        programId: cpiPubKey.publicKey,
        keys: [{
            isSigner: true,
            isWritable: true,
            pubkey: dataAccount.publicKey
        },{
            isSigner: true,
            isWritable: true,
            pubkey: contractPubKey.publicKey
        }],
        data: Buffer.from("")
    });

    tx.add(txi);
    tx.sign(dataAccount,contractPubKey,payer);
    const res = svm.sendTransaction(tx);
    svm.expireBlockhash();

    }

    cpi_contract_calls_double();

    expect(svm.getAccount(dataAccount.publicKey)?.data[0]).toBe(1);
    
    cpi_contract_calls_double();
    
    expect(svm.getAccount(dataAccount.publicKey)?.data[0]).toBe(2);


    cpi_contract_calls_double();
    
    expect(svm.getAccount(dataAccount.publicKey)?.data[0]).toBe(4);

    cpi_contract_calls_double();
    
    expect(svm.getAccount(dataAccount.publicKey)?.data[0]).toBe(8);

})