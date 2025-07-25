
import { test , expect } from "bun:test";
import { LiteSVM } from "litesvm";

import {
	PublicKey,
	Transaction,
	SystemProgram,
	Keypair,
	LAMPORTS_PER_SOL,
    TransactionInstruction,
} from "@solana/web3.js";

test("intialized data account", () => {
	const svm = new LiteSVM();
	const payer = new Keypair();

    const contractPubKey = Keypair.generate();

    //loading our contract to local solana virtuvla machinew
    svm.addProgramFromFile(contractPubKey.publicKey, "./double.so");

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