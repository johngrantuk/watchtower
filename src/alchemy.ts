import axios from 'axios';

const APP_ID = 'iluc52f76fsv8qct';
const APP_SESSION_ID = process.env.ALCHEMY_SESSION_ID;

const COOKIE = `sessionid=${APP_SESSION_ID};`;

const client = axios.create({
	baseURL: 'https://dashboard.alchemyapi.io/api',
	headers: {
		Cookie: COOKIE,
	},
});

export interface Transaction {
	app_id: string;
	eth_network: number;
	request: string;
	response: string;
	response_status_code: number;
	response_error_code: number;
	timestamp: string;
	duration: number;
}

interface TransactionResponse {
	data: Transaction[];
}

export async function getFailedTransactions(
	minTimestamp: number,
): Promise<Transaction[]> {
	const params = {
		filters: {
			time_min: minTimestamp,
			eth_methods: ['eth_estimateGas'],
			http_status_code_min: 200,
			http_status_code_max: 200,
			eth_error_code_min: -32016,
			eth_error_code_max: -32000,
			app_ids: [APP_ID],
		},
	};
	const response = await client.get<TransactionResponse>('/filtered-requests', {
		params,
	});
	return response.data.data;
}
