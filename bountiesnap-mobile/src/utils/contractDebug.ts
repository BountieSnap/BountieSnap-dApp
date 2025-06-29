import { callExecuteEndpoint } from './utils'

// Simple contract interaction testing
export async function testContractInteraction() {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    throw new Error('Cavos API key not configured')
  }

  // Test contracts
  const BOUNTY_CONTRACT = '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626'
  const STRK_TOKEN = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
  
  console.log('🧪 Starting contract interaction tests...')

  return {
    // Test 1: Check if bounty contract exists and is callable
    testBountyContractExists: async (userAddress: string, userPrivateKey: string) => {
      try {
        console.log('📞 Testing bounty contract existence...')
        
        // Try calling get_strk_token_address (read-only function)
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
        
        console.log('✅ Bounty contract is accessible:', result)
        return { success: true, result }
      } catch (error) {
        console.error('❌ Bounty contract test failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },

    // Test 2: Check STRK token contract
    testStrkToken: async (userAddress: string, userPrivateKey: string) => {
      try {
        console.log('📞 Testing STRK token contract...')
        
        // Try calling balanceOf
        const result = await callExecuteEndpoint(
          apiKey,
          'sepolia',
          [
            {
              contractAddress: STRK_TOKEN,
              entrypoint: 'balanceOf',
              calldata: [userAddress]
            }
          ],
          userAddress,
          userPrivateKey
        )
        
        console.log('✅ STRK token contract is accessible:', result)
        return { success: true, result }
      } catch (error) {
        console.error('❌ STRK token test failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },

    // Test 3: Simple approve test
    testSimpleApprove: async (userAddress: string, userPrivateKey: string) => {
      try {
        console.log('📞 Testing simple STRK approve...')
        
        // Try a small approve amount
        const smallAmount = '1000000000000000000' // 1 STRK
        
        const result = await callExecuteEndpoint(
          apiKey,
          'sepolia',
          [
            {
              contractAddress: STRK_TOKEN,
              entrypoint: 'approve',
              calldata: [
                BOUNTY_CONTRACT, // spender
                smallAmount,     // amount (low part)
                '0'              // amount (high part)
              ]
            }
          ],
          userAddress,
          userPrivateKey
        )
        
        console.log('✅ Simple approve succeeded:', result)
        return { success: true, result }
      } catch (error) {
        console.error('❌ Simple approve failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },

    // Test 4: Test bounty creation with minimal parameters
    testMinimalBountyCreation: async (userAddress: string, userPrivateKey: string) => {
      try {
        console.log('📞 Testing minimal bounty creation...')
        
        // Use very simple parameters
        const testParams = {
          bounty_id: '0x123',  // Simple test ID
          description: '0x74657374', // 'test' in hex
          amount_low: '1000000000000000000',  // 1 STRK
          amount_high: '0',
          deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        }
        
        const result = await callExecuteEndpoint(
          apiKey,
          'sepolia',
          [
            {
              contractAddress: BOUNTY_CONTRACT,
              entrypoint: 'create_bounty',
              calldata: [
                testParams.bounty_id,
                testParams.description,
                testParams.amount_low,
                testParams.amount_high,
                testParams.deadline.toString()
              ]
            }
          ],
          userAddress,
          userPrivateKey
        )
        
        console.log('✅ Minimal bounty creation succeeded:', result)
        return { success: true, result }
      } catch (error) {
        console.error('❌ Minimal bounty creation failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

// Enhanced error analysis
export function analyzeContractError(error: any): string {
  const errorStr = error.toString().toLowerCase()
  
  if (errorStr.includes('argent/multicall-failed') && errorStr.includes('unknown enum indicator')) {
    return `❌ CRITICAL: Argent wallet parameter serialization error. 
    
    🔧 SOLUTIONS TO TRY:
    1. The bounty contract might not be deployed correctly
    2. The STRK token address in constructor might be wrong
    3. Contract might be expecting different parameter types
    4. Try with a completely different bounty ID (current one might already exist)
    5. Check if you have sufficient STRK balance and approvals
    
    🧪 IMMEDIATE ACTIONS:
    - Run the contract verification script: node verify-contract.js
    - Try creating a bounty with a smaller amount (0.01 STRK)
    - Check your STRK balance on Starkscan
    - Verify the contract is deployed: https://sepolia.starkscan.co/contract/0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626`
  }
  
  if (errorStr.includes('argent/multicall-failed')) {
    return 'Argent wallet multicall failure - usually parameter encoding issue'
  }
  
  if (errorStr.includes('unknown enum indicator')) {
    return 'Parameter serialization error - check parameter format'
  }
  
  if (errorStr.includes('entrypoint_failed')) {
    return 'Contract function execution failed - check contract state'
  }
  
  if (errorStr.includes('insufficient strk allowance')) {
    return '❌ STRK Allowance Issue - the approval amount was insufficient or not confirmed yet. The system now automatically adds 10% margin and waits for confirmation.'
  }
  
  if (errorStr.includes('insufficient')) {
    return 'Insufficient balance - add STRK tokens from faucet'
  }
  
  if (errorStr.includes('contract not found')) {
    return 'Contract not deployed or wrong address'
  }
  
  if (errorStr.includes('bounty id already exists')) {
    return 'Bounty ID collision - try with different ID'
  }
  
  return 'Unknown error - run contract verification script'
} 