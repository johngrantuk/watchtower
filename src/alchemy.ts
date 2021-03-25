import axios from 'axios';

const APP_ID = 'iluc52f76fsv8qct';

const COOKIE = 'sessionid=oi2bzfqyd1rjmrz8j0ee7mx1r7appdie;';

const client = axios.create({
	baseURL: 'https://dashboard.alchemyapi.io/api',
	headers: {
		Cookie: COOKIE,
	},
});

export interface Transaction {
	app_id: string;
	duration: number;
}

interface TransactionResponse {
	data: Transaction[];
}

export async function getFailedTransactions(minTimestamp: number): Promise<Transaction[]> {
	const params = {
		filters: {
			time_min: minTimestamp,
			eth_methods: ['eth_estimateGas'],
			http_status_code_min: 200,
			http_status_code_max: 200,
			eth_error_code_min: -32000,
			eth_error_code_max: -32000,
			app_ids: [APP_ID],
		},
	};
	const response = await client.get<TransactionResponse>('/filtered-requests', {
		params,
	});
	return response.data.data;
}
