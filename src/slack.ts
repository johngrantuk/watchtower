import axios from 'axios';

const client = axios.create({
	baseURL: 'https://hooks.slack.com/',
	headers: {
		'Content-type': 'application/json',
	},
});

export async function sendMessage(text: string) {
	await client.post(
		'services/T013ZQFUALE/B01SE9NLQMR/qozjwzdpMtmON0lJb0kuY9Pe',
		{
			text,
		},
	);
}
