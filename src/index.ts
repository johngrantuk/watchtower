import { getFailedTransactions } from './alchemy';
import { sendTransaction } from './slack';
import { getTransactionMetadata } from './transactions';

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
	let minTimestamp = Date.now();
	for (;;) {
		const transactions = await getFailedTransactions(minTimestamp);
		const metadata = transactions.map((transaction) =>
			getTransactionMetadata(transaction),
		);
		if (metadata.length > 0) {
			await sendTransaction(metadata[0]);
		}
		minTimestamp = Date.now();
		await sleep(5 * 60 * 1000);
	}
}

loop();
