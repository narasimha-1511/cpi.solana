
import { test , expect } from "bun:test";
import { LiteSVM } from "litesvm";

import {
	PublicKey,
	Transaction,
	SystemProgram,
	Keypair,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";

test("intialized data account", () => {
	const svm = new LiteSVM();
	const payer = new Keypair();

    const contractPubKey = Keypair.generate();

    //loading our contract to local solana virtuvla machinew
    svm.addProgramFromFile(contractPubKey.publicKey, "./double.so");

	svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
	
    const dataAccount = new Keypair();
	const blockhash = svm.latestBlockhash();
	
    const ixs = [
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
			newAccountPubkey: dataAccount.publicKey,
            lamports: Number(svm.minimumBalanceForRentExemption(4n)),
            space: 4,
            programId: contractPubKey.publicKey
		}),
	];
	
    const tx = new Transaction();
	tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
	tx.add(...ixs);
	tx.sign(payer,dataAccount);
	svm.sendTransaction(tx);
	const balanceAfter = svm.getBalance(dataAccount.publicKey);
	expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(4n));
});