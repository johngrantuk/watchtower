import fetch from 'isomorphic-fetch';
import { JsonRpcProvider } from '@ethersproject/providers';
import { postText } from './slack';
import { getOnChainBalances } from './utils/multicall';

export interface Result {
    id: string;
    isSame: boolean;
    differences: Difference[];
    onChainPool: any;
    subgraphPool: any;
}

export interface Difference {
    type: string;
    message: string;
}

const SUBGRAPH_URL: { [chainId: number]: string } = {
    1: process.env.SUBGRAPH_MAIN || 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
    42: process.env.SUBGRAPH_KOVAN || 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2',    
};

const MULTIADDR: { [chainId: number]: string } = {
    1: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
    42: '0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A',
};

const VAULTADDR: { [chainId: number]: string } = {
    1: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    42: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
};

const INFURA_URL: { [chainId: number]: string } = {
    1: 'https://mainnet.infura.io/v3/',
    42: 'https://kovan.infura.io/v3/',
};

export async function checkPools(chainId: number) {
    const provider = new JsonRpcProvider(
        `${INFURA_URL[chainId]}${process.env.INFURA}`
    );

    try{
        const subgraphPools = await fetchSubgraphPools(SUBGRAPH_URL[chainId]);

        const onChainPools = await getOnChainBalances(
            subgraphPools,
            MULTIADDR[chainId],
            VAULTADDR[chainId],
            provider
        );

        for(let i = 0;i < onChainPools.pools.length;i++){
            const onChainPool = onChainPools.pools[i];
            const subgraphPool = subgraphPools.pools[i];

            const result = comparePools(onChainPool, subgraphPool);

            if(!result.isSame){
                const failMessage = formatFail(result, chainId);
                console.log(failMessage);
                postText(failMessage);
            }
            // else
            //     console.log(`${chainId} Pools Match ${result.id}`)
        }
    }catch(err){
        console.log('Error checking.');
        console.log(err);
        postText(`_Error comparing Subgraph ${chainId}_\n${err.message}`);
    }
}

function comparePools(onChainPool: any, subgraphPool: any): Result {
    const result: Result = {
        id: onChainPool.id,
        isSame: true,
        differences: [],
        onChainPool: onChainPool,
        subgraphPool: subgraphPool
    };

    if (onChainPool.id !== subgraphPool.id) {
        result.isSame = false;
        result.differences.push({
            type: 'Not comparing same pool!',
            message: `${subgraphPool.id}\n${onChainPool.id}`
        }); 
        return result;
    }

    if (onChainPool.swapFee !== subgraphPool.swapFee) {
        result.isSame = false;
        result.differences.push({
            type: 'SwapFee',
            message: `${subgraphPool.swapFee} (SG)\n${onChainPool.swapFee} (OC)`
        });
    }

    if (onChainPool.poolType === 'Stable') {
        if (onChainPool.amp !== subgraphPool.amp) {
            result.isSame = false;
            result.differences.push({
                type: 'Amplification',
                message: `${subgraphPool.amp} (SG)\n${onChainPool.amp} (OC)`
            });
        }
    }

    for (let j = 0; j < onChainPool.tokens.length; j++) {
        const onChainToken = onChainPool.tokens[j];
        const subgraphToken = subgraphPool.tokens[j];
        
        if (onChainToken.balance !== subgraphToken.balance) {
            result.isSame = false;
            result.differences.push({
                type: `Token Balance: ${onChainToken.address}`,
                message: `${subgraphToken.balance} (SG)\n${onChainToken.balance} (OC)`
            });
        }

        if (onChainPool.poolType === 'Weighted') {
            if (onChainToken.weight !== subgraphToken.weight) {
                result.isSame = false;
                result.differences.push({
                    type: `Token Weight: ${onChainToken.address}`,
                    message: `${subgraphToken.weight} (SG)\n${onChainToken.weight} (OC)`
                });
            }
        }
    }

    return result;
}

function formatFail(result: Result, chainId: number): string {

    let differences = ``;
    result.differences.forEach(difference => {
        const message = `*${difference.type}*:\n${difference.message}\n`;
        differences = differences.concat(message);
    })

    const message = `_Subgraph Pool Out Of Sync ${chainId} ${result.id}_\n${differences}`;
    return message;
}

// Returns all public pools
export async function fetchSubgraphPools(SubgraphUrl: string = '') {
    // can filter for publicSwap too??
    const query = `
      {
        pools: pools(first: 1000) {
          id
          address
          poolType
          swapFee
          totalShares
          tokens {
            address
            balance
            decimals
            weight
          }
          tokensList
          totalWeight
          amp
        }
      }
    `;

    console.log(`fetchSubgraphPools: ${SubgraphUrl === '' ? SUBGRAPH_URL : SubgraphUrl}`);
    const response = await fetch(
        SubgraphUrl === '' ? SUBGRAPH_URL : SubgraphUrl,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
            }),
        }
    );

    const { data } = await response.json();

    return { pools: data.pools };
}
