import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

import { getFailedTransactions } from './alchemy';
import { sendTransaction } from './slack';
import { getTransactionMetadata, getV2Transactions } from './transactions';
import { checkPools } from './subgraph';

const POLL_PERIOD_MINS = 5;

const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Listening on port ${port}.`);
});

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

		await checkPools(42);
		await checkPools(1);
		await sleep(POLL_PERIOD_MINS * 60 * 1000);
	}
}

loop();
