import { callExecuteEndpoint } from './utils'

// Contract addresses on Sepolia
export const BOUNTY_CONTRACT_ADDRESS = '0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53'
export const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' // STRK token on Sepolia

// Convert string to felt252 (Cairo field element)
export function stringToFelt252(str: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str.slice(0, 31)) // Max 31 characters for felt252
  let result = 0n
  for (let i = 0; i < bytes.length; i++) {
    result = result * 256n + BigInt(bytes[i])
  }
  return '0x' + result.toString(16)
}

// Convert amount to u256 format (low, high)
export function amountToU256(amount: string): [string, string] {
  const amountBigInt = BigInt(amount)
  const low = amountBigInt & ((1n << 128n) - 1n)
  const high = amountBigInt >> 128n
  return [low.toString(), high.toString()]
}

// Convert u256 (low, high) back to readable amount
export function u256ToAmount(low: string, high: string): string {
  const lowBigInt = BigInt(low)
  const highBigInt = BigInt(high)
  const amount = (highBigInt << 128n) + lowBigInt
  return amount.toString()
}

// Convert wei to STRK (divide by 10^18)
export function weiToStrk(wei: string): string {
  const weiBigInt = BigInt(wei)
  const strkAmount = Number(weiBigInt) / Math.pow(10, 18)
  return strkAmount.toFixed(4)
}

// Convert timestamp to u64
export function timestampToU64(timestamp: number): string {
  return timestamp.toString()
}

export interface CreateBountyParams {
  description: string
  amount: string // Amount in wei (1 STRK = 10^18 wei)
  deadline: number // Unix timestamp
  userAddress: string
  userPrivateKey: string
}

// Check STRK balance of a wallet
export async function checkStrkBalance(userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  try {
    console.log('Checking STRK balance for address:', userAddress)
    
    // Call balanceOf function on STRK token contract
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'balanceOf',
          calldata: [userAddress]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('Balance check result:', result)
    
    // The result should contain the balance in u256 format (low, high)
    // For now, we'll extract it from the result
    // Note: This might need adjustment based on the actual API response format
    
    return result
  } catch (error) {
    console.error('Error checking STRK balance:', error)
    throw error
  }
}

export async function createBountyOnChain(params: CreateBountyParams) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  const { description, amount, deadline, userAddress, userPrivateKey } = params
  
  // Convert parameters to Cairo format
  const descriptionFelt = stringToFelt252(description)
  const [amountLow, amountHigh] = amountToU256(amount)
  const deadlineU64 = timestampToU64(deadline)
  
  console.log('Creating bounty with params:', {
    description,
    descriptionFelt,
    amount,
    amountLow,
    amountHigh,
    deadline,
    deadlineU64,
    userAddress
  })

  try {
    // Check balance before proceeding
    console.log('Checking STRK balance before creating bounty...')
    try {
      await checkStrkBalance(userAddress, userPrivateKey)
    } catch (balanceError) {
      console.warn('Could not check balance, proceeding anyway:', balanceError)
    }

    // Step 1: Approve STRK tokens for the bounty contract
    console.log('Step 1: Approving STRK tokens...')
    const approveResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: [
            BOUNTY_CONTRACT_ADDRESS, // spender (bounty contract)
            amountLow,               // amount low
            amountHigh               // amount high
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('STRK approval result:', approveResult)
    
    // Step 2: Create the bounty
    console.log('Step 2: Creating bounty...')
    const createBountyResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'create_bounty',
          calldata: [
            descriptionFelt, // description as felt252
            amountLow,       // amount low
            amountHigh,      // amount high
            deadlineU64      // deadline as u64
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('Create bounty result:', createBountyResult)
    
    return {
      success: true,
      approveTransaction: approveResult,
      createBountyTransaction: createBountyResult
    }
  } catch (error) {
    console.error('Error creating bounty on chain:', error)
    
    // Check if it's an insufficient balance error
    if (error instanceof Error && error.message.includes('Insufficient STRK balance')) {
      throw new Error('Insufficient STRK balance. Please add STRK tokens to your wallet from a Sepolia faucet.')
    }
    
    throw error
  }
}

export async function getBountyFromChain(bountyId: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  try {
    // Call the get_bounty function (this would be a call, not execute)
    // Note: For read operations, you might want to use a different endpoint or method
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'get_bounty',
          calldata: [bountyId]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    return result
  } catch (error) {
    console.error('Error getting bounty from chain:', error)
    throw error
  }
}

export async function applyToBountyOnChain(bountyId: string, stakeAmount: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  const [stakeLow, stakeHigh] = amountToU256(stakeAmount)

  try {
    // Step 1: Approve STRK tokens for stake
    const approveResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: [
            BOUNTY_CONTRACT_ADDRESS,
            stakeLow,
            stakeHigh
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    // Step 2: Apply to bounty
    const applyResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'apply_to_bounty',
          calldata: [
            bountyId,
            stakeLow,
            stakeHigh
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    return {
      success: true,
      approveTransaction: approveResult,
      applyTransaction: applyResult
    }
  } catch (error) {
    console.error('Error applying to bounty:', error)
    throw error
  }
} 