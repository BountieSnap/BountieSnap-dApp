// Simple bounty creation test to isolate the issue
const { callExecuteEndpoint } = require('./src/utils/utils');

async function testSimpleBounty() {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ API key not found');
    return;
  }

  // Test parameters
  const BOUNTY_CONTRACT = '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626';
  const userAddress = '0x14237afb331890feaa4e3e757ce8818a61ef8f9531cf7a8af6406d3a2d4ccd3';
  const userPrivateKey = 'your-private-key'; // Replace with actual

  console.log('🧪 Testing simple bounty creation...');

  // Try with a very unique bounty ID using timestamp + random
  const uniqueId = '0x' + (Date.now() + Math.floor(Math.random() * 1000000)).toString(16);
  
  const testParams = {
    bounty_id: uniqueId,
    description: '0x74657374', // 'test' in hex
    amount_low: '100000000000000000', // 0.1 STRK (smaller amount)
    amount_high: '0',
    deadline: (Math.floor(Date.now() / 1000) + 7200).toString() // 2 hours from now
  };

  console.log('📋 Test parameters:', testParams);

  try {
    // Test 1: Check if contract responds to read-only calls
    console.log('🔍 Test 1: Contract accessibility...');
    
    const readTest = await callExecuteEndpoint(
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
    );
    
    console.log('✅ Contract is accessible:', readTest);

    // Test 2: Try minimal bounty creation (assumes STRK is pre-approved)
    console.log('🔍 Test 2: Simple bounty creation...');
    
    const createResult = await callExecuteEndpoint(
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
            testParams.deadline
          ]
        }
      ],
      userAddress,
      userPrivateKey
    );
    
    console.log('✅ Bounty creation succeeded:', createResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Analyze the specific error
    const errorStr = error.toString().toLowerCase();
    
    if (errorStr.includes('contract not found')) {
      console.log('💡 Issue: Contract address is invalid or not deployed');
    } else if (errorStr.includes('entrypoint not found')) {
      console.log('💡 Issue: create_bounty function does not exist in the contract');
    } else if (errorStr.includes('bounty id already exists')) {
      console.log('💡 Issue: Bounty ID collision - try with different ID');
    } else if (errorStr.includes('transfer failed')) {
      console.log('💡 Issue: Insufficient STRK balance or missing approval');
    } else if (errorStr.includes('argent/multicall-failed')) {
      console.log('💡 Issue: Argent wallet parameter format problem');
      console.log('🔧 Suggestion: The u256 parameter encoding might be incorrect');
    } else {
      console.log('💡 Unknown issue - full error:', error);
    }
  }
}

// Uncomment to run:
// testSimpleBounty(); 