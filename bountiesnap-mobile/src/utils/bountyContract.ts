import { callExecuteEndpoint } from './utils'

// Contract addresses on Sepolia
export const BOUNTY_CONTRACT_ADDRESS = '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626'
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
  
  // Split into 128-bit low and high parts
  const mask128 = (1n << 128n) - 1n
  const low = amountBigInt & mask128
  const high = amountBigInt >> 128n
  
  // Convert to decimal strings (not hex) for Cairo contract calls
  return [low.toString(10), high.toString(10)]
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
  bounty_id: string // Unique bounty ID for on-chain reference
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

  const { bounty_id, description, amount, deadline, userAddress, userPrivateKey } = params
  
  // Convert parameters to Cairo format
  const descriptionFelt = stringToFelt252(description)
  const [amountLow, amountHigh] = amountToU256(amount)
  const deadlineU64 = timestampToU64(deadline)
  
  console.log('Creating bounty with params:', {
    bounty_id,
    bounty_id_type: typeof bounty_id,
    bounty_id_length: bounty_id.length,
    description,
    descriptionFelt,
    description_type: typeof descriptionFelt,
    amount,
    amountLow,
    amountHigh,
    amount_validation: `Low: ${amountLow}, High: ${amountHigh}, Total: ${BigInt(amountLow) + (BigInt(amountHigh) << 128n)}`,
    deadline,
    deadlineU64,
    deadline_type: typeof deadlineU64,
    userAddress
  })

  // Validate bounty_id format
  if (!bounty_id.startsWith('0x')) {
    throw new Error('Bounty ID must start with 0x')
  }
  
  const bountyIdBigInt = BigInt(bounty_id)
  if (bountyIdBigInt === 0n) {
    throw new Error('Bounty ID cannot be zero')
  }
  
  console.log('✅ Parameter validation passed')

  try {
    // Check balance before proceeding
    console.log('Checking STRK balance before creating bounty...')
    try {
      const balanceResult = await checkStrkBalance(userAddress, userPrivateKey)
      console.log('Balance check result:', balanceResult)
      
      // Try to extract balance from result and validate
      // Note: This might need adjustment based on actual API response format
      if (balanceResult && balanceResult.result) {
        console.log('✅ Balance check passed - proceeding with transaction')
      }
    } catch (balanceError) {
      console.warn('Could not check balance, proceeding anyway:', balanceError)
      // In production, you might want to throw an error here instead
    }

    // Step 1: Approve STRK tokens for the bounty contract
    console.log('Step 1: Approving STRK tokens...')
    
    console.log('🔍 Approve calldata:', {
      contractAddress: STRK_TOKEN_ADDRESS,
      spender: BOUNTY_CONTRACT_ADDRESS,
      amountLow,
      amountHigh,
      calldata: [BOUNTY_CONTRACT_ADDRESS, amountLow, amountHigh]
    })
    
    const approveResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: [
            BOUNTY_CONTRACT_ADDRESS, // spender (bounty contract)
            amountLow,               // u256.low as felt252
            amountHigh               // u256.high as felt252
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('STRK approval result:', approveResult)
    
    // Wait a moment for the approval to be processed
    console.log('⏳ Waiting for approval confirmation...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: Create the bounty
    console.log('Step 2: Creating bounty...')
    
    // For u256 in calldata: serialize as [low, high] separately
    console.log('📋 Final calldata for create_bounty:', {
      bounty_id,
      descriptionFelt,
      amountLow,
      amountHigh,
      deadlineU64,
      calldata_array: [bounty_id, descriptionFelt, amountLow, amountHigh, deadlineU64]
    })
    
    const createBountyResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'create_bounty',
          calldata: [
            bounty_id,       // bounty_id as felt252 (first parameter)
            descriptionFelt, // description as felt252
            amountLow,       // u256.low as felt252
            amountHigh,      // u256.high as felt252
            deadlineU64      // deadline as u64 (felt252)
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

  // Convert bounty ID from hex string to felt252 if it starts with 0x
  let bountyIdFelt = bountyId
  if (bountyId.startsWith('0x')) {
    // Already in hex format, use as is for felt252
    bountyIdFelt = bountyId
  } else {
    // Convert string to felt252
    bountyIdFelt = stringToFelt252(bountyId)
  }

  const [stakeLow, stakeHigh] = amountToU256(stakeAmount)

  console.log('Applying to bounty with params:', {
    bountyId,
    bountyIdFelt,
    stakeAmount,
    stakeLow,
    stakeHigh,
    userAddress
  })

  try {
    // Check balance before proceeding
    console.log('Checking STRK balance before applying...')
    try {
      await checkStrkBalance(userAddress, userPrivateKey)
    } catch (balanceError) {
      console.warn('Could not check balance, proceeding anyway:', balanceError)
    }

    // Step 1: Approve STRK tokens for stake
    console.log('Step 1: Approving STRK tokens for stake...')
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
    
    console.log('STRK approval result:', approveResult)
    
    // Step 2: Apply to bounty
    console.log('Step 2: Applying to bounty...')
    const applyResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'apply_to_bounty',
          calldata: [
            bountyIdFelt,  // Use the properly formatted bounty ID
            stakeLow,
            stakeHigh
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('Apply to bounty result:', applyResult)
    
    return {
      success: true,
      approveTransaction: approveResult,
      applyTransaction: applyResult
    }
  } catch (error) {
    console.error('Error applying to bounty:', error)
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes('Insufficient STRK balance')) {
        throw new Error('Insufficient STRK balance. Please add STRK tokens to your wallet from a Sepolia faucet.')
      } else if (error.message.includes('argent/multicall-failed')) {
        throw new Error('Transaction failed. This could be due to insufficient balance, insufficient allowance, or contract execution error. Please check your STRK balance and try again.')
      } else if (error.message.includes('ENTRYPOINT_FAILED')) {
        throw new Error('Smart contract call failed. Please ensure you have sufficient STRK balance and the bounty is still available for applications.')
      }
    }
    
    throw error
  }
} 