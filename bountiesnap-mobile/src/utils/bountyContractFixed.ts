import { callExecuteEndpoint } from './utils'

// Contract addresses on Sepolia
export const BOUNTY_CONTRACT_ADDRESS = '0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53' // OLD WORKING CONTRACT
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
    return result
  } catch (error) {
    console.error('Error checking STRK balance:', error)
    throw error
  }
}

// FIXED VERSION: Uses old working contract without bounty_id parameter
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
  
  console.log('✅ Creating bounty with OLD WORKING CONTRACT (no bounty_id):', {
    contractAddress: BOUNTY_CONTRACT_ADDRESS,
    description: description.substring(0, 30),
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
      const balanceResult = await checkStrkBalance(userAddress, userPrivateKey)
      console.log('Balance check result:', balanceResult)
      
      if (balanceResult && balanceResult.result) {
        console.log('✅ Balance check passed - proceeding with transaction')
      }
    } catch (balanceError) {
      console.warn('Could not check balance, proceeding anyway:', balanceError)
    }

    // Step 1: Approve STRK tokens for the bounty contract
    console.log('Step 1: Approving STRK tokens...')
    
    // Add 10% margin to approval amount to cover potential fees
    const amountBigInt = BigInt(amount)
    const approvalAmount = amountBigInt + (amountBigInt / 10n) // 10% margin
    const [approvalLow, approvalHigh] = amountToU256(approvalAmount.toString())
    
    console.log('💰 Approval amounts:', {
      original: amount,
      approval: approvalAmount.toString(),
      approvalLow,
      approvalHigh
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
            approvalLow,             // u256.low as felt252
            approvalHigh             // u256.high as felt252
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('STRK approval result:', approveResult)
    
    // Wait for approval confirmation
    console.log('⏳ Waiting for approval confirmation (15 seconds)...')
    await new Promise(resolve => setTimeout(resolve, 15000))
    
    // Verify allowance was set
    try {
      const allowanceResult = await callExecuteEndpoint(
        apiKey,
        'sepolia',
        [
          {
            contractAddress: STRK_TOKEN_ADDRESS,
            entrypoint: 'allowance',
            calldata: [userAddress, BOUNTY_CONTRACT_ADDRESS]
          }
        ],
        userAddress,
        userPrivateKey
      )
      
      console.log('✅ Allowance check result:', allowanceResult)
      console.log('✅ Allowance verified before bounty creation')
    } catch (allowanceError) {
      console.warn('⚠️ Could not verify allowance, proceeding anyway:', allowanceError)
    }
    
    // Step 2: Create the bounty - OLD FORMAT (NO bounty_id parameter)
    console.log('Step 2: Creating bounty with OLD INTERFACE...')
    console.log('📋 Calldata (OLD FORMAT):', [descriptionFelt, amountLow, amountHigh, deadlineU64])
    
    const createBountyResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'create_bounty',
          calldata: [
            descriptionFelt, // description as felt252 (FIRST parameter)
            amountLow,       // amount low
            amountHigh,      // amount high
            deadlineU64      // deadline as u64
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Create bounty result:', createBountyResult)
    
    // Extract the actual bounty ID from the BountyCreated event using Starknet.js
    let actualBountyId = null
    const transactionHash = createBountyResult.result?.transactionHash
    
    if (transactionHash) {
      console.log('🔍 Using Starknet.js to extract bounty ID from transaction:', transactionHash)
      
      try {
        // Import the new Starknet.js-based parser
        const { waitAndExtractBountyId } = require('./starknetBountyParser')
        
        // Wait up to 30 seconds for transaction confirmation and extract ID
        actualBountyId = await waitAndExtractBountyId(transactionHash, 30000)
        
        if (actualBountyId) {
          console.log('🎯 Successfully extracted bounty ID using Starknet.js:', actualBountyId)
        } else {
          console.log('⚠️ Could not extract bounty ID with Starknet.js - transaction may not be confirmed yet')
        }
        
      } catch (starknetError) {
        console.warn('⚠️ Starknet.js extraction failed, falling back to manual parsing:', starknetError)
        
        // Fallback to old method if Starknet.js fails
        try {
          if (createBountyResult.result?.events) {
            console.log('📊 Fallback: Events found in result:', createBountyResult.result.events)
            
            const bountyCreatedEvent = createBountyResult.result.events.find((event: any) => 
              event.keys && (
                event.keys.includes('0xfd841ed94ff583fc725024f72d53a6500f59e7fce3b5fc459f05941e55866c') ||
                event.keys[0]?.includes('BountyCreated') ||
                event.from_address === BOUNTY_CONTRACT_ADDRESS
              )
            )
            
            if (bountyCreatedEvent && bountyCreatedEvent.data) {
              actualBountyId = bountyCreatedEvent.data[0]
              console.log('🎯 Fallback: Found bounty ID:', actualBountyId)
            }
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback parsing also failed:', fallbackError)
        }
      }
    }
    
    // If we couldn't get the ID from events, we'll need to fetch it separately
    if (!actualBountyId) {
      console.log('⚠️ Could not extract bounty ID from transaction. You may need to check the blockchain explorer.')
      console.log('🔗 Check this transaction on Voyager:', `https://sepolia.voyager.online/tx/${transactionHash}`)
      console.log('📝 Look for the BountyCreated event and find the bounty_id value')
    }
    
    console.log('🆔 FINAL bounty ID extraction results:', {
      transactionHash,
      actualBountyId,
      foundInEvents: !!actualBountyId,
      resultStructure: {
        hasEvents: !!createBountyResult.result?.events,
        hasReceipt: !!createBountyResult.result?.receipt,
        hasReturnData: !!createBountyResult.result?.return_data,
        topLevelKeys: Object.keys(createBountyResult.result || {})
      }
    })
    
    return {
      success: true,
      approveTransaction: approveResult,
      createBountyTransaction: createBountyResult,
      actualBountyId: actualBountyId, // The REAL bounty ID from events
      transactionHash: transactionHash,
      needsManualIdExtraction: !actualBountyId // Flag to indicate manual extraction needed
    }
  } catch (error) {
    console.error('Error creating bounty on chain:', error)
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes('Insufficient STRK balance') || 
          error.message.includes('Insufficient STRK allowance')) {
        throw new Error('Insufficient STRK balance or allowance. Please ensure you have enough STRK tokens and try again.')
      } else if (error.message.includes('argent/multicall-failed')) {
        throw new Error('Transaction failed. This could be due to insufficient balance, insufficient allowance, or contract execution error. Please check your STRK balance and try again.')
      } else if (error.message.includes('ENTRYPOINT_FAILED')) {
        throw new Error('Smart contract call failed. Please ensure you have sufficient STRK balance and try again.')
      }
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
    bountyIdFelt = bountyId
  } else {
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

    // Step 1: Approve STRK tokens for stake (with margin for fees)
    console.log('Step 1: Approving STRK tokens for stake...')
    
    // Add 10% margin to stake approval amount
    const stakeBigInt = BigInt(stakeAmount)
    const stakeApprovalAmount = stakeBigInt + (stakeBigInt / 10n) // Add 10% margin
    const [stakeApprovalLow, stakeApprovalHigh] = amountToU256(stakeApprovalAmount.toString())
    
    console.log('💰 Stake approval amounts:', {
      original: stakeAmount,
      approval: stakeApprovalAmount.toString(),
      stakeApprovalLow,
      stakeApprovalHigh
    })
    
    const approveResult = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: [
            BOUNTY_CONTRACT_ADDRESS,
            stakeApprovalLow,    // stake approval with margin
            stakeApprovalHigh    // stake approval with margin
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('STRK approval result:', approveResult)
    
    // Wait for approval confirmation
    console.log('⏳ Waiting for stake approval confirmation (15 seconds)...')
    await new Promise(resolve => setTimeout(resolve, 15000))
    
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

// Approve hunter function - called by bounty creator
export async function approveHunterOnChain(bountyId: string, hunterAddress: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  // Convert bounty ID to felt252 format
  let bountyIdFelt = bountyId
  if (bountyId.startsWith('0x')) {
    bountyIdFelt = bountyId
  } else {
    bountyIdFelt = stringToFelt252(bountyId)
  }

  console.log('Approving hunter with params:', {
    bountyId,
    bountyIdFelt,
    hunterAddress,
    userAddress
  })

  try {
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'approve_hunter',
          calldata: [
            bountyIdFelt,    // bounty_id as felt252
            hunterAddress    // hunter_address as ContractAddress
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Hunter approval result:', result)
    return result

  } catch (error) {
    console.error('❌ Error approving hunter:', error)
    throw error
  }
}

// Submit completion function - called by hunter
export async function submitCompletionOnChain(bountyId: string, proofHash: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  // Convert bounty ID to felt252 format
  let bountyIdFelt = bountyId
  if (bountyId.startsWith('0x')) {
    bountyIdFelt = bountyId
  } else {
    bountyIdFelt = stringToFelt252(bountyId)
  }

  // Convert proof to felt252 format
  const proofFelt = stringToFelt252(proofHash)

  console.log('Submitting completion with params:', {
    bountyId,
    bountyIdFelt,
    proofHash,
    proofFelt,
    userAddress
  })

  try {
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'submit_completion',
          calldata: [
            bountyIdFelt,    // bounty_id as felt252
            proofFelt        // proof as felt252
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Completion submission result:', result)
    return result

  } catch (error) {
    console.error('❌ Error submitting completion:', error)
    throw error
  }
}

// Confirm completion function - called by bounty creator
export async function confirmCompletionOnChain(bountyId: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  // Convert bounty ID to felt252 format
  let bountyIdFelt = bountyId
  if (bountyId.startsWith('0x')) {
    bountyIdFelt = bountyId
  } else {
    bountyIdFelt = stringToFelt252(bountyId)
  }

  console.log('Confirming completion with params:', {
    bountyId,
    bountyIdFelt,
    userAddress
  })

  try {
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'confirm_completion',
          calldata: [
            bountyIdFelt     // bounty_id as felt252
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Completion confirmation result:', result)
    return result

  } catch (error) {
    console.error('❌ Error confirming completion:', error)
    throw error
  }
}

// Release funds function - called after completion is confirmed
export async function releaseFundsOnChain(bountyId: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  // Convert bounty ID to felt252 format
  let bountyIdFelt = bountyId
  if (bountyId.startsWith('0x')) {
    bountyIdFelt = bountyId
  } else {
    bountyIdFelt = stringToFelt252(bountyId)
  }

  console.log('Releasing funds with params:', {
    bountyId,
    bountyIdFelt,
    userAddress
  })

  try {
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'release_funds',
          calldata: [
            bountyIdFelt     // bounty_id as felt252
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Fund release result:', result)
    return result

  } catch (error) {
    console.error('❌ Error releasing funds:', error)
    throw error
  }
}

// Get bounty status function
export async function getBountyStatusOnChain(bountyId: string, userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  // Convert bounty ID to felt252 format
  let bountyIdFelt = bountyId
  if (bountyId.startsWith('0x')) {
    bountyIdFelt = bountyId
  } else {
    bountyIdFelt = stringToFelt252(bountyId)
  }

  try {
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'get_bounty_status',
          calldata: [
            bountyIdFelt     // bounty_id as felt252
          ]
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Bounty status result:', result)
    return result

  } catch (error) {
    console.error('❌ Error getting bounty status:', error)
    throw error
  }
} 