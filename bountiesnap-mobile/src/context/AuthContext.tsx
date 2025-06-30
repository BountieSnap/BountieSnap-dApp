import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, createUserWallet, getUserWallet, testDatabaseConnection } from '../utils/supabase'
import { createWallet } from '../utils/utils'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: any }>
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<{ error?: any }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Helper function to create wallet with retry logic for foreign key constraint
const createUserWalletWithRetry = async (userId: string, walletData: any, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to create wallet (attempt ${attempt}/${maxRetries})`)
      await createUserWallet(userId, walletData)
      return // Success, exit the function
    } catch (error: any) {
      console.log(`Wallet creation attempt ${attempt} failed:`, error?.message)
      
      // If it's a foreign key constraint error and we haven't exhausted retries
      if (error?.code === '23503' && attempt < maxRetries) {
        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 1.5 // Exponential backoff
        continue
      }
      
      // If it's not a foreign key error or we've exhausted retries, throw the error
      throw error
    }
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to ensure user has a wallet
  const ensureUserWallet = async (userId: string) => {
    try {
      // Check if wallet already exists
      const existingWallet = await getUserWallet(userId)
      if (existingWallet) {
        console.log('User wallet already exists')
        return
      }

      // Create wallet if it doesn't exist
      console.log('Creating wallet for user:', userId)
      const walletData = await createWallet('sepolia')
      
      // Store wallet data in Supabase with retry logic
      await createUserWalletWithRetry(userId, walletData)
      
      console.log('Wallet created successfully for user:', userId)
    } catch (error) {
      console.error('Failed to ensure user wallet:', error)
      // Don't throw error here, just log it - user can still use the app
    }
  }

  useEffect(() => {
    // Test database connection on app start
    testDatabaseConnection()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Ensure wallet exists for authenticated user
      if (session?.user?.id) {
        ensureUserWallet(session.user.id)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Ensure wallet exists when user signs in
      if (session?.user?.id) {
        ensureUserWallet(session.user.id)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Create the user account with metadata (no wallet creation here)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || '',
          }
        }
      })

      if (authError) {
        return { error: authError }
      }

      // Wallet will be created on first login when user is fully available
      console.log('User created successfully, wallet will be created on first login')
      return { error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 