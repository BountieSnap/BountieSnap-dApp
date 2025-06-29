// Script to check the actual bounty ID created by the old contract

const BOUNTY_CONTRACT_ADDRESS = '0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53'

async function callExecuteEndpoint(apiKey, network, calls, accountAddress, privateKey) {
  const response = await fetch(`https://api.cavos.com/api/v1/external/execute/${network}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      calls,
      accountAddress,
      privateKey
    })
  });

  if (!response.ok) {
    throw new Error(`Execute endpoint error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

async function checkContractState() {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY
  
  if (!apiKey) {
    console.error('❌ API key not found')
    return
  }

  const userAddress = '0x32ea8557339e255459b76ef21eedb4bbc00127ba34b322b6db51c0b218b3d9d'
  const userPrivateKey = '0x1bf6b36de3b2bef2a61e63fefdf8a8bf9c5dc29ab37c31fae5ff2b52d7a4bf5'

  try {
    console.log('🔍 Checking contract state...')
    console.log('Contract address:', BOUNTY_CONTRACT_ADDRESS)
    console.log('User address:', userAddress)
    
    // Try to read the bounty counter (if accessible)
    console.log('\n📊 Trying to get bounty counter...')
    try {
      const counterResult = await callExecuteEndpoint(
        apiKey,
        'sepolia',
        [
          {
            contractAddress: BOUNTY_CONTRACT_ADDRESS,
            entrypoint: 'bounty_counter',
            calldata: []
          }
        ],
        userAddress,
        userPrivateKey
      )
      
      console.log('✅ Bounty counter result:', counterResult)
    } catch (counterError) {
      console.log('❌ Could not read bounty counter:', counterError.message)
    }
    
    // Try to get bounty with ID 1 (most likely the first bounty)
    console.log('\n📋 Trying to get bounty with ID 1...')
    try {
      const bounty1Result = await callExecuteEndpoint(
        apiKey,
        'sepolia',
        [
          {
            contractAddress: BOUNTY_CONTRACT_ADDRESS,
            entrypoint: 'get_bounty',
            calldata: ['0x1'] // Try bounty ID 1
          }
        ],
        userAddress,
        userPrivateKey
      )
      
      console.log('✅ Bounty ID 1 result:', bounty1Result)
    } catch (bounty1Error) {
      console.log('❌ Could not read bounty ID 1:', bounty1Error.message)
    }
    
    // Try to get bounty with ID 2
    console.log('\n📋 Trying to get bounty with ID 2...')
    try {
      const bounty2Result = await callExecuteEndpoint(
        apiKey,
        'sepolia',
        [
          {
            contractAddress: BOUNTY_CONTRACT_ADDRESS,
            entrypoint: 'get_bounty',
            calldata: ['0x2'] // Try bounty ID 2
          }
        ],
        userAddress,
        userPrivateKey
      )
      
      console.log('✅ Bounty ID 2 result:', bounty2Result)
    } catch (bounty2Error) {
      console.log('❌ Could not read bounty ID 2:', bounty2Error.message)
    }
    
    // Try with our generated ID to confirm it doesn't exist
    console.log('\n🔍 Trying to get bounty with our generated ID...')
    try {
      const ourIdResult = await callExecuteEndpoint(
        apiKey,
        'sepolia',
        [
          {
            contractAddress: BOUNTY_CONTRACT_ADDRESS,
            entrypoint: 'get_bounty',
            calldata: ['0x686089a7543e2936'] // Our generated ID
          }
        ],
        userAddress,
        userPrivateKey
      )
      
      console.log('✅ Our ID result:', ourIdResult)
    } catch (ourIdError) {
      console.log('❌ Our generated ID not found (expected):', ourIdError.message)
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error)
  }
}

checkContractState() 