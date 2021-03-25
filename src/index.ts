import { getFailedTransactions } from './alchemy';
import { sendMessage } from './slack';

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
	const minTimestamp = Date.now();
	while (true) {
		const transactions = await getFailedTransactions(minTimestamp);
		if (transactions.length > 0) {
			await sendMessage(`Failed transactions: ${transactions.length}`);
		} else {
			await sendMessage('No failed transactions');
		}
		await sleep(5 * 60 * 1000);
	}
}

loop();
