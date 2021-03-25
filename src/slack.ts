import axios from 'axios';
import { getSimulationUrl } from './tenderly';

import { TransactionMetadata } from './transactions';

const APP_ID = 'T013ZQFUALE';
const WEBKOOK_ID = process.env.SLACK_WEBKOOK_ID;
const WEBKOOK_KEY = process.env.SLACK_WEBKOOK_KEY;

const client = axios.create({
	baseURL: 'https://hooks.slack.com/',
	headers: {
		'Content-type': 'application/json',
	},
});

export async function sendTransaction(tx: TransactionMetadata) {
	const text = formatTransaction(tx);
	await client.post(`services/${APP_ID}/${WEBKOOK_ID}/${WEBKOOK_KEY}`, {
		text,
	});
}

function formatTransaction(tx: TransactionMetadata): string {
	const networkMap: Record<number, string> = {
		1: 'Mainnet',
		42: 'Kovan',
	};
	const network = networkMap[tx.chainId];
	const url = getSimulationUrl(tx);
	const message = `
		_Details_
		*Network*: ${network}
		*Sender*: ${tx.from}
		*Contract*: ${tx.to}
		*Data*: ${tx.data}

		<${url}|Tenderly Simulation>
	`;
	return message;
}
