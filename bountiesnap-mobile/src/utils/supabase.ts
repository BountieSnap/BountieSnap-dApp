import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

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

// Helper function to store user wallet data
export async function createUserWallet(userId: string, walletData: any) {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .insert([
        {
          id: userId,
          wallet_address: walletData.address,
          wallet_data: walletData,
          network: walletData.network || 'sepolia',
          created_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) {
      console.error('Error storing wallet data:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to store wallet data:', error)
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