import dotenv from 'dotenv';
dotenv.config();

import { setTimeout } from 'timers';

import { getFailedTransactions } from './alchemy';
import { sendTransaction } from './slack';
import { getTransactionMetadata, getV2Transactions } from './transactions';

const POLL_PERIOD_MINS = 5;

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
	let minTimestamp = Date.now();
	for (;;) {
		const rawTransactions = await getFailedTransactions(minTimestamp);
		const transactions = rawTransactions.map((transaction) =>
			getTransactionMetadata(transaction),
		);
		const v2Transactions = getV2Transactions(transactions);
		if (v2Transactions.length > 0) {
			await sendTransaction(v2Transactions[0]);
		}
		minTimestamp = Date.now();
		await sleep(POLL_PERIOD_MINS * 60 * 1000);
	}
}

loop();
