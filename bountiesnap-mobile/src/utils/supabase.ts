import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || ''

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase environment variables not found. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Service role client for administrative operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Test function to check if user_wallets table exists and is accessible
export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...')
    const { data, error } = await supabase
      .from('user_wallets')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Database test error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { success: false, error }
    }

    console.log('Database test successful')
    return { success: true, data }
  } catch (error) {
    console.error('Database test failed:', error)
    return { success: false, error }
  }
}

// Helper function to store user wallet data using service role (bypasses RLS)
export async function createUserWallet(userId: string, walletData: any) {
  try {
    console.log('Attempting to store wallet data for user:', userId)
    console.log('Wallet data received:', JSON.stringify(walletData, null, 2))
    
    // Validate required fields
    if (!walletData || !walletData.address) {
      throw new Error('Invalid wallet data: missing address field')
    }

    const walletRecord = {
      id: userId,
      wallet_address: walletData.address,
      wallet_data: walletData,
      network: walletData.network || 'sepolia',
      created_at: new Date().toISOString(),
    }
    
    console.log('Wallet record to insert:', JSON.stringify(walletRecord, null, 2))

    // Use service role client if available, otherwise use regular client
    const client = supabaseAdmin || supabase
    console.log('Using client:', supabaseAdmin ? 'Service Role (bypasses RLS)' : 'Regular Client (subject to RLS)')

    const { data, error } = await client
      .from('user_wallets')
      .insert([walletRecord])
      .select()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('Wallet data stored successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to store wallet data:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Helper function to get user wallet data
export async function getUserWallet(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching wallet data:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to fetch wallet data:', error)
    throw error
  }
} 