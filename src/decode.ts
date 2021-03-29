export function decodeContract(address: string) {
	const contractMap: Record<string, string> = {
		'0xba1c01474a7598c2b49015fdafc67ddf06ce15f7': 'Vault',
	};
	const contract = contractMap[address] || address;
	return contract;
}

export function decodeData(data: string): string {
	const selector = data.substr(2, 8);
	const funcMap: Record<string, (data: string) => string> = {
		'38b72e35': formatJoin,
		'e8aea900': formatExit,
	};
	const formatFunc = funcMap[selector] || defaultFormat;
	return formatFunc(data);

	function formatJoin(data: string): string {
		const pool = data.substr(10, 40);
		return `Join pool 0x${pool}`;
	}

	function formatExit(data: string): string {
		const pool = data.substr(10, 40);
		return `Exit pool 0x${pool}`;
	}

	function defaultFormat(data: string): string {
		return data;
	}
}
