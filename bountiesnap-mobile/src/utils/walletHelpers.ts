import { checkStrkBalanceStarknet } from './starknetBalance';

export interface WalletBalance {
  balance: string;
  balanceFormatted: string;
  error?: string;
}

/**
 * Enhanced function to get STRK balance using native Starknet.js
 */
export async function getWalletBalance(wallet: any): Promise<WalletBalance> {
  try {
    if (!wallet || !wallet.wallet_address) {
      return {
        balance: '0',
        balanceFormatted: '0.0000',
        error: 'Invalid wallet data'
      };
    }

    console.log('🔍 Getting wallet balance for:', wallet.wallet_address);
    
    // Use direct Starknet.js approach (no private key needed for reads)
    const balanceResult = await checkStrkBalanceStarknet(wallet.wallet_address);
    
    return {
      balance: balanceResult.balance,
      balanceFormatted: balanceResult.balanceFormatted,
      error: balanceResult.error
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return {
      balance: '0',
      balanceFormatted: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format wallet address for display (truncated)
 */
export function formatWalletAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate if a string is a valid Starknet address
 */
export function isValidStarknetAddress(address: string): boolean {
  // Starknet addresses should be hex strings starting with 0x
  const hexRegex = /^0x[0-9a-fA-F]+$/;
  return hexRegex.test(address) && address.length >= 3 && address.length <= 66;
}

/**
 * Get network explorer URL for an address
 */
export function getExplorerUrl(address: string, network = 'sepolia'): string {
  const baseUrls = {
    sepolia: 'https://sepolia.starkscan.co/contract',
    mainnet: 'https://starkscan.co/contract'
  };
  
  const baseUrl = baseUrls[network as keyof typeof baseUrls] || baseUrls.sepolia;
  return `${baseUrl}/${address}`;
}

/**
 * Get faucet URL for test tokens
 */
export function getFaucetUrl(network = 'sepolia'): string {
  const faucetUrls = {
    sepolia: 'https://starknet-faucet.vercel.app/',
    mainnet: '' // No faucet for mainnet
  };
  
  return faucetUrls[network as keyof typeof faucetUrls] || faucetUrls.sepolia;
} 