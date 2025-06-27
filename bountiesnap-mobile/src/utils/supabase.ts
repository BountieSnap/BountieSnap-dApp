import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY!

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase environment variables not found. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Service role client for admin operations (bypasses RLS)
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface UserWallet {
  id: string
  wallet_address: string
  private_key?: string
  public_key?: string
  wallet_data?: any
  network?: string
  created_at: string
  updated_at: string
}

export interface Bounty {
  id: string
  creator_id: string
  on_chain_id: string
  title: string
  description: string
  amount: string // Amount in wei
  amount_strk?: number // Amount in STRK for display
  deadline: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  transaction_hash: string
  wallet_address: string
  created_at: string
  updated_at: string
}

export interface BountyApplication {
  id: string
  bounty_id: string
  hunter_id: string
  stake_amount: string // Stake amount in wei
  stake_amount_strk?: number // Stake amount in STRK for display
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  transaction_hash?: string
  wallet_address: string
  applied_at: string
  updated_at: string
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('user_wallets').select('count').single()
    if (error) throw error
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Wallet management functions
export async function createUserWallet(userId: string, walletData: any) {
  try {
    const walletRecord = {
      id: userId,
      wallet_address: walletData.walletAddress || walletData.address,
      private_key: walletData.privateKey || walletData.private_key,
      public_key: walletData.publicKey || walletData.public_key,
      wallet_data: walletData,
      network: walletData.network || 'sepolia'
    }

    const { data, error } = await supabaseService
      .from('user_wallets')
      .insert([walletRecord])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Wallet stored successfully:', data)
    return data
  } catch (error) {
    console.error('Error storing wallet:', error)
    throw error
  }
}

export async function getUserWallet(userId: string): Promise<UserWallet | null> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No wallet found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting user wallet:', error)
    throw error
  }
}

// Bounty management functions
export async function createBounty(bountyData: {
  creator_id: string
  on_chain_id: string
  title: string
  description: string
  amount: string
  deadline: string
  transaction_hash: string
  wallet_address: string
}): Promise<Bounty> {
  try {
    // Convert wei to STRK for display
    const amountBigInt = BigInt(bountyData.amount)
    const amountStrk = Number(amountBigInt) / Math.pow(10, 18)

    const bountyRecord = {
      ...bountyData,
      amount_strk: amountStrk,
      deadline: new Date(bountyData.deadline).toISOString()
    }

    console.log('About to insert bounty record:', JSON.stringify(bountyRecord, null, 2))
    
    const { data, error } = await supabase
      .from('bounties')
      .insert([bountyRecord])
      .select()
      .single()

    if (error) {
      console.error('Error creating bounty:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log('Bounty stored successfully:', data)
    return data
  } catch (error) {
    console.error('Error storing bounty:', error)
    throw error
  }
}

export async function getBounties(status?: string): Promise<Bounty[]> {
  try {
    let query = supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting bounties:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error getting bounties:', error)
    throw error
  }
}

export async function getBountyById(bountyId: string): Promise<Bounty | null> {
  try {
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', bountyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No bounty found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting bounty:', error)
    throw error
  }
}

export async function updateBountyStatus(bountyId: string, status: Bounty['status']): Promise<Bounty> {
  try {
    const { data, error } = await supabase
      .from('bounties')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bountyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating bounty status:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating bounty status:', error)
    throw error
  }
}

// Bounty application management functions
export async function createBountyApplication(applicationData: {
  bounty_id: string
  hunter_id: string
  stake_amount: string
  wallet_address: string
  transaction_hash?: string
}): Promise<BountyApplication> {
  try {
    // Convert wei to STRK for display
    const stakeAmountBigInt = BigInt(applicationData.stake_amount)
    const stakeAmountStrk = Number(stakeAmountBigInt) / Math.pow(10, 18)

    const applicationRecord = {
      ...applicationData,
      stake_amount_strk: stakeAmountStrk
    }

    const { data, error } = await supabase
      .from('bounty_applications')
      .insert([applicationRecord])
      .select()
      .single()

    if (error) {
      console.error('Error creating bounty application:', error)
      throw error
    }

    console.log('Bounty application stored successfully:', data)
    return data
  } catch (error) {
    console.error('Error storing bounty application:', error)
    throw error
  }
}

export async function getBountyApplications(bountyId: string): Promise<BountyApplication[]> {
  try {
    const { data, error } = await supabase
      .from('bounty_applications')
      .select('*')
      .eq('bounty_id', bountyId)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('Error getting bounty applications:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error getting bounty applications:', error)
    throw error
  }
}

export async function getUserBountyApplications(userId: string): Promise<BountyApplication[]> {
  try {
    const { data, error } = await supabase
      .from('bounty_applications')
      .select('*')
      .eq('hunter_id', userId)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('Error getting user bounty applications:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error getting user bounty applications:', error)
    throw error
  }
}

export async function updateApplicationStatus(
  applicationId: string, 
  status: BountyApplication['status'],
  transactionHash?: string
): Promise<BountyApplication> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (transactionHash) {
      updateData.transaction_hash = transactionHash
    }

    const { data, error } = await supabase
      .from('bounty_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating application status:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating application status:', error)
    throw error
  }
} 