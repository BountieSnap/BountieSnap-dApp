import { Contract, CallData, Account, num, uint256, cairo, RpcProvider, shortString } from 'starknet'
import { 
  BOUNTY_CONTRACT_ADDRESS, 
  BOUNTY_CONTRACT_ABI, 
  STRK_TOKEN_ADDRESS, 
  STRK_TOKEN_ABI,
  getProvider,
  CreateBountyParams,
  Bounty,
  BountyStatus 
} from '../contracts/BountyContract'
import { formatAmount, callExecuteEndpoint } from '../utils/utils'
import { getUserWallet } from '../utils/supabase'

// Sepolia network configuration
const NETWORK = 'sepolia'

export class ContractService {
  private provider: RpcProvider
  private bountyContract: Contract
  private strkContract: Contract

  constructor() {
    this.provider = getProvider()
    this.bountyContract = new Contract(BOUNTY_CONTRACT_ABI, BOUNTY_CONTRACT_ADDRESS, this.provider)
    this.strkContract = new Contract(STRK_TOKEN_ABI, STRK_TOKEN_ADDRESS, this.provider)
  }

  /**
   * Create a new bounty on the smart contract
   */
  async createBounty(
    userId: string, 
    params: CreateBountyParams
  ): Promise<{ success: boolean; bountyId?: string; txHash?: string; error?: string }> {
    try {
      console.log('Creating bounty with params:', params)
      
      // Get user wallet data from database
      const walletData = await getUserWallet(userId)
      if (!walletData) {
        throw new Error('User wallet not found')
      }

      console.log('Using wallet:', walletData.wallet_address)

      // Convert amount to wei (18 decimals for STRK)
      const amountWei = formatAmount(params.amount, 18)
      console.log('Amount in wei:', amountWei)

      // Convert description to felt252 (simple string to felt conversion)
      const descriptionFelt = shortString.encodeShortString(params.description)
      console.log('Description felt:', descriptionFelt)

      // Prepare the calls
      const calls = [
        // First approve the bounty contract to spend STRK tokens
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: CallData.compile([
            BOUNTY_CONTRACT_ADDRESS, // spender
            amountWei // amount
          ])
        },
        // Then create the bounty
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'create_bounty',
          calldata: CallData.compile([
            descriptionFelt, // description
            amountWei, // amount
            params.deadline // deadline
          ])
        }
      ]

      console.log('Prepared calls:', calls)

      // Use Cavos API to execute the transaction
      const result = await callExecuteEndpoint(
        process.env.EXPO_PUBLIC_CAVOS_API_KEY!,
        NETWORK,
        calls,
        walletData.wallet_address,
        walletData.wallet_data.hashedPk || walletData.wallet_data.private_key
      )

      console.log('Transaction result:', result)

      return {
        success: true,
        bountyId: result.bountyId || 'pending', // The actual bounty ID will be in the transaction result
        txHash: result.transactionHash || result.transaction_hash,
      }

    } catch (error) {
      console.error('Error creating bounty:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Apply to an existing bounty
   */
  async applyToBounty(
    userId: string,
    bountyId: string,
    stakeAmount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log('Applying to bounty:', bountyId, 'with stake:', stakeAmount)

      const walletData = await getUserWallet(userId)
      if (!walletData) {
        throw new Error('User wallet not found')
      }

      const stakeWei = formatAmount(stakeAmount, 18)
      const bountyIdFelt = shortString.encodeShortString(bountyId)

      const calls = [
        // Approve stake amount
        {
          contractAddress: STRK_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: CallData.compile([
            BOUNTY_CONTRACT_ADDRESS,
            stakeWei
          ])
        },
        // Apply to bounty
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'apply_to_bounty',
          calldata: CallData.compile([
            bountyIdFelt,
            stakeWei
          ])
        }
      ]

      const result = await callExecuteEndpoint(
        process.env.EXPO_PUBLIC_CAVOS_API_KEY!,
        NETWORK,
        calls,
        walletData.wallet_address,
        walletData.wallet_data.hashedPk || walletData.wallet_data.private_key
      )

      return {
        success: true,
        txHash: result.transactionHash || result.transaction_hash,
      }

    } catch (error) {
      console.error('Error applying to bounty:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get bounty details from the contract
   */
  async getBounty(bountyId: string): Promise<Bounty | null> {
    try {
      const bountyIdFelt = shortString.encodeShortString(bountyId)
      const result = await this.bountyContract.call('get_bounty', [bountyIdFelt]) as any
      
      return {
        id: result.id?.toString() || '0',
        seeker: result.seeker?.toString() || '0x0',
        hunter: result.hunter?.toString() || '0x0',
        description: result.description ? shortString.decodeShortString(result.description) : '',
        amount: result.amount || { low: '0', high: '0' },
        stake: result.stake || { low: '0', high: '0' },
        deadline: result.deadline?.toString() || '0',
        status: result.status as BountyStatus || BountyStatus.Created,
        proof: result.proof ? shortString.decodeShortString(result.proof) : '',
      }
    } catch (error) {
      console.error('Error getting bounty:', error)
      return null
    }
  }

  /**
   * Get user's STRK balance
   */
  async getSTRKBalance(walletAddress: string): Promise<string> {
    try {
      const result = await this.strkContract.call('balance_of', [walletAddress])
      // Convert from wei to STRK (divide by 10^18)
      const balance = uint256.uint256ToBN(result as any)
      return (Number(balance) / 10**18).toString()
    } catch (error) {
      console.error('Error getting STRK balance:', error)
      return '0'
    }
  }

  /**
   * Submit completion proof for a bounty
   */
  async submitCompletion(
    userId: string,
    bountyId: string,
    proof: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const walletData = await getUserWallet(userId)
      if (!walletData) {
        throw new Error('User wallet not found')
      }

      const bountyIdFelt = shortString.encodeShortString(bountyId)
      const proofFelt = shortString.encodeShortString(proof)

      const calls = [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'submit_completion',
          calldata: CallData.compile([bountyIdFelt, proofFelt])
        }
      ]

      const result = await callExecuteEndpoint(
        process.env.EXPO_PUBLIC_CAVOS_API_KEY!,
        NETWORK,
        calls,
        walletData.wallet_address,
        walletData.wallet_data.hashedPk || walletData.wallet_data.private_key
      )

      return {
        success: true,
        txHash: result.transactionHash || result.transaction_hash,
      }

    } catch (error) {
      console.error('Error submitting completion:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Confirm completion of a bounty (for seekers)
   */
  async confirmCompletion(
    userId: string,
    bountyId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const walletData = await getUserWallet(userId)
      if (!walletData) {
        throw new Error('User wallet not found')
      }

      const bountyIdFelt = shortString.encodeShortString(bountyId)

      const calls = [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'confirm_completion',
          calldata: CallData.compile([bountyIdFelt])
        }
      ]

      const result = await callExecuteEndpoint(
        process.env.EXPO_PUBLIC_CAVOS_API_KEY!,
        NETWORK,
        calls,
        walletData.wallet_address,
        walletData.wallet_data.hashedPk || walletData.wallet_data.private_key
      )

      return {
        success: true,
        txHash: result.transactionHash || result.transaction_hash,
      }

    } catch (error) {
      console.error('Error confirming completion:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Release funds to the hunter (can be called by anyone after confirmation)
   */
  async releaseFunds(
    userId: string,
    bountyId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const walletData = await getUserWallet(userId)
      if (!walletData) {
        throw new Error('User wallet not found')
      }

      const bountyIdFelt = shortString.encodeShortString(bountyId)

      const calls = [
        {
          contractAddress: BOUNTY_CONTRACT_ADDRESS,
          entrypoint: 'release_funds',
          calldata: CallData.compile([bountyIdFelt])
        }
      ]

      const result = await callExecuteEndpoint(
        process.env.EXPO_PUBLIC_CAVOS_API_KEY!,
        NETWORK,
        calls,
        walletData.wallet_address,
        walletData.wallet_data.hashedPk || walletData.wallet_data.private_key
      )

      return {
        success: true,
        txHash: result.transactionHash || result.transaction_hash,
      }

    } catch (error) {
      console.error('Error releasing funds:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

// Export singleton instance
export const contractService = new ContractService() 