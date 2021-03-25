import { Transaction } from './alchemy';

const EXCHANGE_PROXY = '0x3e66b66fd1d0b02fda6c811da9e0547970db2f21';

export interface TransactionMetadata {
	chainId: number;
	from: string;
	to: string;
	data: string;
	value: string;
}

export function getTransactionMetadata(
	transaction: Transaction,
): TransactionMetadata {
	const request = JSON.parse(transaction.request);
	const { gasPrice, value, to, data } = request.params[0];
	const metadata = {
		chainId: 1,
		from: gasPrice,
		to,
		data,
		value,
	};
	return metadata;
}

export function getV2Transactions(
	metadata: TransactionMetadata[],
): TransactionMetadata[] {
	return metadata.filter((m) => m.to !== EXCHANGE_PROXY);
}
