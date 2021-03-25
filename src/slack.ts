import axios from 'axios';
import { getSimulationUrl } from './tenderly';

import { TransactionMetadata } from './transactions';

const client = axios.create({
	baseURL: 'https://hooks.slack.com/',
	headers: {
		'Content-type': 'application/json',
	},
});

export async function sendTransaction(tx: TransactionMetadata) {
	const text = formatTransaction(tx);
	await client.post(
		'services/T013ZQFUALE/B01SE9NLQMR/qozjwzdpMtmON0lJb0kuY9Pe',
		{
			text,
		},
	);
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
