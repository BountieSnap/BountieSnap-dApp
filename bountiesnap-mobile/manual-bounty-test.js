// Manual test for bounty contract debugging
// Copy this to your browser console or create a simple test function

async function manualBountyTest() {
  console.log('🧪 Starting manual bounty contract test...')
  
  // Your current parameters
  const params = {
    apiKey: process.env.EXPO_PUBLIC_CAVOS_API_KEY,
    userAddress: '0x14237afb331890feaa4e3e757ce8818a61ef8f9531cf7a8af6406d3a2d4ccd3',  // Replace with actual
    userPrivateKey: 'your-private-key', // Replace with actual
    bountyContract: '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626',
    strkToken: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
  }
  
  // Test 1: Verify contract exists
  console.log('📋 Test 1: Contract existence')
  try {
    const response = await fetch(`https://sepolia.starkscan.co/api/v1/contract/${params.bountyContract}`)
    const contractInfo = await response.json()
    console.log('Contract info:', contractInfo)
    
    if (contractInfo.error) {
      console.error('❌ Contract not found on Starkscan!')
      return false
    } else {
      console.log('✅ Contract exists on Starkscan')
    }
  } catch (error) {
    console.error('Failed to check contract:', error)
  }
  
  // Test 2: Try read-only function call
  console.log('📋 Test 2: Read-only function')
  // This would need the actual API call implementation
  
  // Test 3: Check if bounty ID already exists
  console.log('📋 Test 3: Bounty ID collision check')
  const testBountyId = '0x123'
  console.log('Testing with bounty ID:', testBountyId)
  
  // Test 4: Parameter validation
  console.log('📋 Test 4: Parameter validation')
  const testAmount = '1000000000000000000' // 1 STRK
  const amountBigInt = BigInt(testAmount)
  const low = (amountBigInt & ((1n << 128n) - 1n)).toString()
  const high = (amountBigInt >> 128n).toString()
  
  console.log('Amount validation:', {
    original: testAmount,
    low,
    high,
    reconstructed: (BigInt(low) + (BigInt(high) << 128n)).toString()
  })
  
  // Test 5: Calldata structure
  console.log('📋 Test 5: Calldata structure')
  const calldata = [
    testBountyId,                    // bounty_id: felt252
    '0x74657374',                    // description: 'test' as felt252
    low,                             // amount.low: u128
    high,                            // amount.high: u128
    (Math.floor(Date.now() / 1000) + 3600).toString() // deadline: u64
  ]
  
  console.log('Expected calldata:', calldata)
  console.log('Calldata types:', calldata.map(x => typeof x))
  console.log('Calldata lengths:', calldata.map(x => x.length))
  
  return true
}

// Common issues and solutions
console.log(`
🔍 Common Issues to Check:

1. **Contract Not Deployed**: 
   Visit https://sepolia.starkscan.co/contract/0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626
   
2. **Insufficient STRK Balance**:
   Check your wallet balance on Starkscan
   Get test STRK from: https://starknet-faucet.vercel.app/
   
3. **Wrong Network**:
   Ensure you're on Sepolia testnet
   
4. **Contract Interface Mismatch**:
   Verify the deployed contract has the expected create_bounty function
   
5. **Parameter Encoding**:
   u256 values must be split into [low, high] felt252 pairs
   
6. **Bounty ID Collision**:
   The bounty_id might already exist in the contract
   
7. **Wallet Issues**:
   Argent wallet might have compatibility issues with the transaction format

💡 Quick Tests:
- Try with a different bounty_id like 0x456 or 0x789
- Try with a smaller amount like 0.1 STRK
- Check if the contract was deployed correctly
- Verify STRK token balance and allowances
`)

// Run the test
// manualBountyTest() 