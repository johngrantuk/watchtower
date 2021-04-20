import { BaseProvider } from '@ethersproject/providers';
import { scale, bnum } from './bmath';
import { Multicaller } from './multicaller';
import { BigNumber } from './bignumber';
import _ from 'lodash';

export interface SubGraphPoolsBase {
    pools: SubgraphPoolBase[];
}

export interface SubgraphPoolBase {
    id: string;
    address: string;
    poolType: string;
    swapFee: string;
    totalShares: string;
    tokens: SubGraphToken[];
    tokensList: string[];

    // Weighted & Element field
    totalWeight?: string;

    // Stable specific fields
    amp?: string;

    // Element specific fields
    lpShares?: BigNumber;
    time?: BigNumber;
    principalToken?: string;
    baseToken?: string;
}

export interface SubGraphToken {
    address: string;
    balance: string;
    decimals: string | number;
    // Stable & Element field
    weight?: string;
}

// Load pools data with multicalls
export async function getOnChainBalances(
    subgraphPools: SubGraphPoolsBase,
    multiAddress: string,
    vaultAddress: string,
    provider: BaseProvider
): Promise<SubGraphPoolsBase> {
    // ): Promise<Pool[]> {
    console.time('getPools');
    if (subgraphPools.pools.length === 0) return subgraphPools;

    const vaultAbi = require('../abi/Vault.json');
    const weightedPoolAbi = require('../abi/weightedPoolAbi.json');
    const stablePoolAbi = require('../abi/stablePoolAbi.json');
    const abis = Object.values(
        Object.fromEntries(
            [...vaultAbi, ...weightedPoolAbi, ...stablePoolAbi].map(row => [
                row.name,
                row,
            ])
        )
    );

    const multiPool = new Multicaller(multiAddress, provider, abis);

    let pools = {};

    subgraphPools.pools.forEach(pool => {
        _.set(pools, `${pool.id}.id`, pool.id);
        multiPool.call(`${pool.id}.poolTokens`, vaultAddress, 'getPoolTokens', [
            pool.id,
        ]);
        multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFee');
        multiPool.call(`${pool.id}.totalSupply`, pool.address, 'totalSupply');
        // TO DO - Make this part of class to make more flexible?
        if (pool.poolType === 'Weighted') {
            multiPool.call(
                `${pool.id}.weights`,
                pool.address,
                'getNormalizedWeights',
                []
            );
        } else if (pool.poolType === 'Stable') {
            multiPool.call(
                `${pool.id}.amp`,
                pool.address,
                'getAmplificationParameter'
            );
        }
    });

    pools = await multiPool.execute(pools);

    subgraphPools.pools.forEach(subgraphPool => {
        const onChainResult = pools[subgraphPool.id];
        subgraphPool.swapFee = scale(
            bnum(onChainResult.swapFee),
            -18
        ).toString();
        onChainResult.poolTokens.tokens.forEach((token, i) => {
            const tokenAddress = onChainResult.poolTokens.tokens[i]
                .toString()
                .toLowerCase();
            const T = subgraphPool.tokens.find(t => t.address === tokenAddress);
            const balance = scale(
                bnum(onChainResult.poolTokens.balances[i]),
                -Number(T.decimals)
            ).toString();
            T.balance = balance;
            if (subgraphPool.poolType === 'Weighted')
                T.weight = scale(
                    bnum(onChainResult.weights[i]),
                    -18
                ).toString();
        });

        if (subgraphPool.poolType === 'Stable') {
            subgraphPool.amp = scale(bnum(onChainResult.amp), -18).toString();
        }
    });

    console.timeEnd('getPools');
    return subgraphPools;
}
