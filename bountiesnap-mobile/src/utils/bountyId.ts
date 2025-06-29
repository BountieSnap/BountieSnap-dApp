import { stringToFelt252 } from './bountyContractFixed';

// Generate a unique bounty ID for on-chain use
export function generateUniqueBountyId(): string {
  // Generate a unique identifier using timestamp + random
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const uniqueString = `bounty_${timestamp}_${random}`;
  
  // Convert to felt252 format for Cairo
  return stringToFelt252(uniqueString);
}

// Convert database UUID to felt252 (alternative approach)
export function uuidToFelt252(uuid: string): string {
  // Remove dashes and take first 31 characters to fit in felt252
  const cleanUuid = uuid.replace(/-/g, '').substring(0, 31);
  return stringToFelt252(cleanUuid);
}

// Generate a shorter numeric ID for better compatibility
export function generateNumericBountyId(): string {
  // Generate a much more unique ID to avoid collisions
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 0xFFFFFF); // 24-bit random
  const random2 = Math.floor(Math.random() * 0xFFFFFF); // 24-bit random
  const counter = (timestamp % 10000); // Use last 4 digits of timestamp
  
  // Create a complex combination that's less likely to collide
  const combined = BigInt(Math.floor(timestamp / 1000)) * 0x100000000n + 
                   BigInt(random1) * 0x10000n + 
                   BigInt(random2) + 
                   BigInt(counter);
  
  // Convert to hex format
  let bountyId = '0x' + combined.toString(16);
  
  // Ensure it's within reasonable bounds for felt252 (keep it around 15-20 characters)
  if (bountyId.length > 20) {
    // If too long, create a shorter version
    const shorterCombined = BigInt(Math.floor(timestamp / 1000)) * 0x10000n + BigInt(random1 % 0xFFFF);
    bountyId = '0x' + shorterCombined.toString(16);
  }
  
  console.log('🆔 Generated anti-collision bounty ID:', {
    bountyId,
    length: bountyId.length,
    timestamp: Math.floor(timestamp / 1000),
    randoms: [random1, random2],
    counter,
    bigIntValue: combined.toString()
  });
  
  return bountyId;
}

// Validate bounty ID format
export function isValidBountyId(bountyId: string): boolean {
  if (!bountyId || bountyId === '0' || bountyId === '0x0') {
    return false;
  }
  
  // Check if it's a valid hex string
  if (bountyId.startsWith('0x')) {
    const hex = bountyId.substring(2);
    return /^[0-9a-fA-F]+$/.test(hex) && hex.length > 0;
  }
  
  return false;
} 