import { RpcProvider, Contract, Account, cairo } from 'starknet';

// Starknet Sepolia RPC endpoint
const STARKNET_RPC_URL = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

// STRK token contract address on Sepolia
const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      {
        name: 'account',
        type: 'felt'
      }
    ],
    outputs: [
      {
        name: 'balance',
        type: 'Uint256'
      }
    ],
    stateMutability: 'view'
  }
];

export interface StarknetBalanceResult {
  balance: string;
  balanceFormatted: string;
  error?: string;
}

/**
 * Check STRK balance using native Starknet.js (no private key needed for reads)
 */
export async function checkStrkBalanceStarknet(walletAddress: string): Promise<StarknetBalanceResult> {
  try {
    console.log('🔍 Checking STRK balance using Starknet.js for:', walletAddress);
    
    // Create RPC provider
    const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
    
    // Create contract instance
    const strkContract = new Contract(ERC20_ABI, STRK_TOKEN_ADDRESS, provider);
    
    // Call balanceOf function
    const balanceResult = await strkContract.balanceOf(walletAddress);
    
    console.log('Raw balance result from Starknet.js:', balanceResult);
    
    // Extract balance from Uint256 format
    let balanceWei = '0';
    
    if (balanceResult && typeof balanceResult === 'object') {
      // Handle different possible formats
      if ('balance' in balanceResult) {
        // Result has balance property
        const balance = balanceResult.balance;
        if (typeof balance === 'bigint') {
          // Direct BigInt format (most common with Starknet.js)
          balanceWei = balance.toString();
          console.log('✅ Parsed BigInt balance:', balanceWei);
        } else if (typeof balance === 'object' && balance !== null && 'low' in balance && 'high' in balance) {
          // Uint256 format
          const low = BigInt(balance.low);
          const high = BigInt(balance.high);
          balanceWei = ((high << 128n) + low).toString();
          console.log('✅ Parsed Uint256 balance:', { low: balance.low, high: balance.high, total: balanceWei });
        } else if (typeof balance === 'string' || typeof balance === 'number') {
          balanceWei = balance.toString();
          console.log('✅ Parsed string/number balance:', balanceWei);
        }
      } else if ('low' in balanceResult && 'high' in balanceResult) {
        // Direct Uint256 format
        const low = BigInt(balanceResult.low);
        const high = BigInt(balanceResult.high);
        balanceWei = ((high << 128n) + low).toString();
        console.log('✅ Parsed direct Uint256 balance:', { low: balanceResult.low, high: balanceResult.high, total: balanceWei });
      } else if (Array.isArray(balanceResult) && balanceResult.length >= 2) {
        // Array format [low, high]
        const low = BigInt(balanceResult[0]);
        const high = BigInt(balanceResult[1]);
        balanceWei = ((high << 128n) + low).toString();
        console.log('✅ Parsed array balance:', { low: balanceResult[0], high: balanceResult[1], total: balanceWei });
      }
    } else if (typeof balanceResult === 'string' || typeof balanceResult === 'number') {
      balanceWei = balanceResult.toString();
      console.log('✅ Parsed direct string/number balance:', balanceWei);
    } else if (typeof balanceResult === 'bigint') {
      // Direct BigInt result
      balanceWei = balanceResult.toString();
      console.log('✅ Parsed direct BigInt balance:', balanceWei);
    }
    
    console.log('Parsed balance wei:', balanceWei);
    
    // Convert wei to STRK (18 decimals)
    const balanceStrk = formatStrkBalance(balanceWei);
    
    console.log('✅ Balance check successful:', {
      wei: balanceWei,
      strk: balanceStrk
    });
    
    return {
      balance: balanceWei,
      balanceFormatted: balanceStrk
    };
    
  } catch (error) {
    console.error('❌ Error checking balance with Starknet.js:', error);
    return {
      balance: '0',
      balanceFormatted: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format wei balance to STRK with 4 decimal places
 */
function formatStrkBalance(weiBalance: string): string {
  try {
    const wei = BigInt(weiBalance);
    const strk = Number(wei) / Math.pow(10, 18);
    return strk.toFixed(4);
  } catch (error) {
    console.error('Error formatting balance:', error);
    return '0.0000';
  }
}

/**
 * Fallback: Check balance using Cavos execute endpoint
 */
export async function checkStrkBalanceCavos(userAddress: string, userPrivateKey: string): Promise<StarknetBalanceResult> {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY;
  
  if (!apiKey) {
    return {
      balance: '0',
      balanceFormatted: 'Error',
      error: 'Cavos API key not configured'
    };
  }

  try {
    console.log('🔍 Fallback: Checking balance using Cavos execute endpoint');
    
    const response = await fetch('https://services.cavos.xyz/api/v1/external/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        network: 'sepolia',
        calls: [
          {
            contractAddress: STRK_TOKEN_ADDRESS,
            entrypoint: 'balanceOf',
            calldata: [userAddress]
          }
        ],
        address: userAddress,
        hashedPk: userPrivateKey
      }),
    });

    if (!response.ok) {
      throw new Error(`Cavos API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Cavos balance result:', result);
    
    // This will likely return a transaction hash, not the actual balance
    // But we'll try to extract what we can
    return {
      balance: '0',
      balanceFormatted: '0.0000',
      error: 'Cavos execute endpoint returns transaction hash, not balance data'
    };
    
  } catch (error) {
    console.error('❌ Cavos fallback failed:', error);
    return {
      balance: '0',
      balanceFormatted: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 