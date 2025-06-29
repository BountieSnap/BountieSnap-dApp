const fetch = require('node-fetch');

async function verifyBountyContract() {
  const contractAddress = '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626';
  
  console.log('🔍 Verifying bounty contract deployment...');
  console.log('📍 Contract address:', contractAddress);
  
  try {
    // Check via Starkscan API
    console.log('\n1️⃣ Checking via Starkscan...');
    const starkscanUrl = `https://sepolia.starkscan.co/api/v1/contract/${contractAddress}`;
    
    const response = await fetch(starkscanUrl);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Contract not found on Starkscan');
      console.log('Error:', data.error);
      return false;
    }
    
    console.log('✅ Contract found on Starkscan');
    console.log('📋 Contract info:', {
      address: data.address,
      type: data.type,
      classHash: data.class_hash,
      deployedAt: data.deployed_at
    });
    
    // Check if it has the expected functions
    if (data.abi) {
      const functions = data.abi.filter(item => item.type === 'function');
      const createBountyFunc = functions.find(f => f.name === 'create_bounty');
      
      if (createBountyFunc) {
        console.log('✅ create_bounty function found');
        console.log('📋 Function signature:', {
          name: createBountyFunc.name,
          inputs: createBountyFunc.inputs?.map(i => `${i.name}: ${i.type}`) || [],
          outputs: createBountyFunc.outputs?.map(o => o.type) || []
        });
      } else {
        console.log('❌ create_bounty function NOT found in ABI');
        console.log('Available functions:', functions.map(f => f.name));
      }
    }
    
    // Check via JSON RPC
    console.log('\n2️⃣ Checking via JSON RPC...');
    const rpcUrl = 'https://starknet-sepolia.public.blastapi.io/rpc/v0.7';
    
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'starknet_getClassAt',
        params: [
          'latest',
          contractAddress
        ],
        id: 1
      })
    });
    
    const rpcData = await rpcResponse.json();
    
    if (rpcData.error) {
      console.log('❌ RPC Error:', rpcData.error);
      return false;
    }
    
    if (rpcData.result) {
      console.log('✅ Contract exists via RPC');
      console.log('📋 Contract class hash:', rpcData.result.class_hash);
      
      // Check if ABI contains create_bounty
      if (rpcData.result.abi) {
        const createBountyInAbi = rpcData.result.abi.find(
          item => item.type === 'function' && item.name === 'create_bounty'
        );
        
        if (createBountyInAbi) {
          console.log('✅ create_bounty function confirmed via RPC');
        } else {
          console.log('❌ create_bounty function NOT found in RPC ABI');
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying contract:', error);
    return false;
  }
}

// Manual deployment check
async function checkDeploymentStatus() {
  console.log('🚀 Bounty Contract Verification Report');
  console.log('='.repeat(50));
  
  const isDeployed = await verifyBountyContract();
  
  if (!isDeployed) {
    console.log('\n❌ CONTRACT NOT FOUND OR NOT PROPERLY DEPLOYED');
    console.log('\n💡 Next steps:');
    console.log('1. Deploy the contract to Starknet Sepolia');
    console.log('2. Update the contract address in your code');
    console.log('3. Ensure the contract has the correct create_bounty function');
    console.log('\n📋 Expected create_bounty signature:');
    console.log('create_bounty(bounty_id: felt252, description: felt252, amount: u256, deadline: u64) -> felt252');
  } else {
    console.log('\n✅ CONTRACT VERIFICATION SUCCESSFUL');
    console.log('\n💡 The issue might be:');
    console.log('1. Parameter encoding/serialization');
    console.log('2. Insufficient STRK balance');
    console.log('3. Argent wallet compatibility');
    console.log('4. Bounty ID collision');
  }
}

// Uncomment to run
// checkDeploymentStatus(); 