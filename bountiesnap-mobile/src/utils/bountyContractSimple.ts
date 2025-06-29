import { callExecuteEndpoint } from './utils'

// Simplified bounty creation without multicall complexity
export async function createBountySimple(params: {
  bounty_id: string
  description: string
  amount: string
  deadline: number
  userAddress: string
  userPrivateKey: string
}) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  const BOUNTY_CONTRACT = '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626'
  
  console.log('🚀 Simple bounty creation approach...')
  
  // Convert parameters - ensuring correct types
  const bountyIdFelt = params.bounty_id.startsWith('0x') ? params.bounty_id : `0x${params.bounty_id}`
  
  // Convert description to felt252 (simple ASCII to hex)
  const descBytes = new TextEncoder().encode(params.description.slice(0, 31))
  let descFelt = '0x'
  for (let i = 0; i < descBytes.length; i++) {
    descFelt += descBytes[i].toString(16).padStart(2, '0')
  }
  
  // Split amount into u128 parts
  const amountBigInt = BigInt(params.amount)
  const mask128 = (1n << 128n) - 1n
  const amountLow = (amountBigInt & mask128).toString()
  const amountHigh = (amountBigInt >> 128n).toString()
  
  const calldata = [
    bountyIdFelt,
    descFelt,
    amountLow,
    amountHigh,
    params.deadline.toString()
  ]
  
  console.log('📋 Simple calldata:', {
    bounty_id: bountyIdFelt,
    description: descFelt,
    amount_low: amountLow,
    amount_high: amountHigh,
    deadline: params.deadline.toString(),
    calldata
  })
  
  try {
    // Single contract call without approve (assumes pre-approved)
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT,
          entrypoint: 'create_bounty',
          calldata
        }
      ],
      params.userAddress,
      params.userPrivateKey
    )
    
    console.log('✅ Simple bounty creation result:', result)
    return result
    
  } catch (error) {
    console.error('❌ Simple bounty creation failed:', error)
    
    // Specific error checks
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase()
      
      if (errorStr.includes('contract not found')) {
        throw new Error('❌ Bounty contract not found. Please verify the contract address is correct and deployed on Sepolia.')
      }
      
      if (errorStr.includes('entrypoint not found')) {
        throw new Error('❌ create_bounty function not found. Contract might be deployed incorrectly.')
      }
      
      if (errorStr.includes('bounty id already exists')) {
        throw new Error('❌ This bounty ID already exists. Please try with a different ID.')
      }
      
      if (errorStr.includes('transfer failed')) {
        throw new Error('❌ STRK transfer failed. Please ensure you have approved the bounty contract to spend your STRK tokens.')
      }
    }
    
    throw error
  }
}

// Test function to verify contract basics
export async function testContract(userAddress: string, userPrivateKey: string) {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  const BOUNTY_CONTRACT = '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626'
  
  try {
    // Test read-only function
    const result = await callExecuteEndpoint(
      apiKey,
      'sepolia',
      [
        {
          contractAddress: BOUNTY_CONTRACT,
          entrypoint: 'get_strk_token_address',
          calldata: []
        }
      ],
      userAddress,
      userPrivateKey
    )
    
    console.log('✅ Contract test successful:', result)
    return result
    
  } catch (error) {
    console.error('❌ Contract test failed:', error)
    throw error
  }
} 