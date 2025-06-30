import { RpcProvider, hash, Contract, CallData, cairo, InvokeTransactionReceiptResponse } from 'starknet'

// Starknet provider for Sepolia testnet
const provider = new RpcProvider({ 
  nodeUrl: 'https://starknet-sepolia.public.blastapi.io'
})

// Bounty contract details (updated from transaction analysis)
const BOUNTY_CONTRACT_ADDRESS = '0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53'

// BountyCreated event selector (computed from event name)
const BOUNTY_CREATED_EVENT_SELECTOR = hash.getSelectorFromName('BountyCreated')

export interface BountyCreatedEvent {
  bounty_id: string
  seeker: string
  description: string
  amount: string
  deadline: string
}

/**
 * Extract bounty ID from transaction using Starknet.js
 * @param transactionHash - The transaction hash from bounty creation
 * @returns The bounty ID or null if not found
 */
export async function extractBountyIdFromTransaction(transactionHash: string): Promise<string | null> {
  try {
    console.log('🔍 Using Starknet.js to extract bounty ID from transaction:', transactionHash)
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash) as any
    console.log('📋 Transaction receipt:', receipt)
    
    // Access events from the receipt (could be in different locations)
    const events = receipt.events || receipt.execution_resources?.events || []
    
    if (!events || events.length === 0) {
      console.log('❌ No events found in transaction receipt')
      return null
    }
    
    // Normalize addresses for comparison (handle leading zeros)
    const normalizeAddress = (addr: string) => '0x' + addr.replace('0x', '').replace(/^0+/, '')
    const normalizedContractAddress = normalizeAddress(BOUNTY_CONTRACT_ADDRESS)
    
    // Find BountyCreated event
    const bountyEvent = events.find((event: any) => {
      const normalizedFromAddress = normalizeAddress(event.from_address)
      return normalizedFromAddress === normalizedContractAddress &&
             event.keys && event.keys[0] === BOUNTY_CREATED_EVENT_SELECTOR
    })
    
    if (!bountyEvent) {
      console.log('❌ BountyCreated event not found in transaction')
      console.log('🔍 Available events:', events.map((e: any) => ({
        from: e.from_address,
        keys: e.keys,
        data_length: e.data?.length || 0
      })))
      return null
    }
    
    console.log('✅ Found BountyCreated event:', bountyEvent)
    
    // Parse event data
    // Event structure: BountyCreated { bounty_id, seeker, description, amount, deadline }
    if (!bountyEvent.data || bountyEvent.data.length < 1) {
      console.log('❌ Invalid event data length:', bountyEvent.data?.length || 0)
      return null
    }
    
    const bountyId = bountyEvent.data[0] // First data element is bounty_id
    console.log('🎯 Extracted bounty ID:', bountyId)
    
    return bountyId
    
  } catch (error) {
    console.error('❌ Error extracting bounty ID with Starknet.js:', error)
    return null
  }
}

/**
 * Parse complete BountyCreated event data
 * @param transactionHash - The transaction hash from bounty creation
 * @returns The parsed event data or null if not found
 */
export async function parseBountyCreatedEvent(transactionHash: string): Promise<BountyCreatedEvent | null> {
  try {
    console.log('🔍 Parsing complete BountyCreated event from transaction:', transactionHash)
    
    const receipt = await provider.getTransactionReceipt(transactionHash) as any
    
    // Access events from the receipt (could be in different locations)
    const events = receipt.events || receipt.execution_resources?.events || []
    
    if (!events || events.length === 0) {
      return null
    }
    
    // Normalize addresses for comparison (handle leading zeros)
    const normalizeAddress = (addr: string) => '0x' + addr.replace('0x', '').replace(/^0+/, '')
    const normalizedContractAddress = normalizeAddress(BOUNTY_CONTRACT_ADDRESS)
    
    const bountyEvent = events.find((event: any) => {
      const normalizedFromAddress = normalizeAddress(event.from_address)
      return normalizedFromAddress === normalizedContractAddress &&
             event.keys && event.keys[0] === BOUNTY_CREATED_EVENT_SELECTOR
    })
    
    if (!bountyEvent || !bountyEvent.data || bountyEvent.data.length < 5) {
      return null
    }
    
    // Parse the event data according to the Cairo struct
    const parsedEvent: BountyCreatedEvent = {
      bounty_id: bountyEvent.data[0],
      seeker: bountyEvent.data[1],
      description: bountyEvent.data[2],
      amount: bountyEvent.data[3], // This might be split into low/high parts
      deadline: bountyEvent.data[4]
    }
    
    console.log('✅ Parsed BountyCreated event:', parsedEvent)
    return parsedEvent
    
  } catch (error) {
    console.error('❌ Error parsing BountyCreated event:', error)
    return null
  }
}

/**
 * Wait for transaction confirmation and extract bounty ID
 * @param transactionHash - The transaction hash
 * @param maxWaitTime - Maximum time to wait in milliseconds (default 60s)
 * @returns The bounty ID or null if timeout/error
 */
export async function waitAndExtractBountyId(transactionHash: string, maxWaitTime: number = 60000): Promise<string | null> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const bountyId = await extractBountyIdFromTransaction(transactionHash)
      if (bountyId) {
        console.log('✅ Successfully extracted bounty ID after', Date.now() - startTime, 'ms')
        return bountyId
      }
    } catch (error) {
      console.log('⏳ Transaction not yet confirmed, waiting...')
    }
    
    // Wait 3 seconds before trying again
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  console.log('⏰ Timeout waiting for transaction confirmation')
  return null
} 