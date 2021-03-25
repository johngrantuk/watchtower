import { TransactionMetadata } from './transactions';

export function getSimulationUrl(tx: TransactionMetadata) {
	const value = tx.value ? tx.value : 0;
	const url = `https://dashboard.tenderly.co/balancer/v2/simulator/new?from=${tx.from}&&value=${value}&contractAddress=${tx.to}&rawFunctionInput=${tx.data}&network=${tx.chainId}`;
	return url;
}
