// Debug script to test contract calls
// Run this in your browser console to test different parameter combinations

// Test 1: Verify contract address and basic connectivity
console.log('🔍 Testing contract connectivity...')
console.log('Contract Address:', '0x0011d305739fea5de8fa56f6c84eeb52943ff17e82138ac035bcdce98ab81626')

// Test 2: Verify parameter encoding
const testParams = {
  bounty_id: '0x123',  // Simple test ID
  description: 'test',  // Simple description
  amount: '1000000000000000000',  // 1 STRK in wei
  deadline: Math.floor(Date.now() / 1000) + 3600  // 1 hour from now
}

console.log('🧪 Test Parameters:')
console.log('Raw params:', testParams)

// Test felt252 conversion
function stringToFelt252(str) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str.slice(0, 31))
  let result = 0n
  for (let i = 0; i < bytes.length; i++) {
    result = result * 256n + BigInt(bytes[i])
  }
  return '0x' + result.toString(16)
}

// Test u256 conversion
function amountToU256(amount) {
  const amountBigInt = BigInt(amount)
  const mask128 = (1n << 128n) - 1n
  const low = amountBigInt & mask128
  const high = amountBigInt >> 128n
  return [low.toString(10), high.toString(10)]
}

const encodedParams = {
  bounty_id: testParams.bounty_id,
  descriptionFelt: stringToFelt252(testParams.description),
  amountParts: amountToU256(testParams.amount),
  deadlineU64: testParams.deadline.toString()
}

console.log('🔧 Encoded Parameters:')
console.log('bounty_id:', encodedParams.bounty_id)
console.log('descriptionFelt:', encodedParams.descriptionFelt)
console.log('amountLow:', encodedParams.amountParts[0])
console.log('amountHigh:', encodedParams.amountParts[1])
console.log('deadlineU64:', encodedParams.deadlineU64)

// Validation checks
console.log('🔍 Validation Checks:')
console.log('bounty_id != 0:', encodedParams.bounty_id !== '0x0' && encodedParams.bounty_id !== '0')
console.log('amount > 0:', BigInt(encodedParams.amountParts[0]) > 0n || BigInt(encodedParams.amountParts[1]) > 0n)
console.log('deadline > now:', parseInt(encodedParams.deadlineU64) > Math.floor(Date.now() / 1000))

// Expected calldata format
const calldata = [
  encodedParams.bounty_id,
  encodedParams.descriptionFelt,
  encodedParams.amountParts[0],  // low
  encodedParams.amountParts[1],  // high
  encodedParams.deadlineU64
]

console.log('📝 Final Calldata Array:')
calldata.forEach((param, index) => {
  console.log(`[${index}]: ${param} (${typeof param})`)
})

console.log('💡 Debugging Tips:')
console.log('1. Check if your contract address is correct and deployed')
console.log('2. Verify the contract has the expected interface')
console.log('3. Ensure your wallet has sufficient STRK balance')
console.log('4. Check if the bounty_id already exists in the contract')
console.log('5. Verify token approvals are working correctly') 