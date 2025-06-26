import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, createUserWallet } from '../utils/supabase'
import { createWallet } from '../utils/utils'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error?: any }>
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        return { error: authError }
      }

      // If user creation was successful and we have a user ID, create wallet
      if (authData.user?.id) {
        try {
          console.log('Creating wallet for user:', authData.user.id)
          const walletData = await createWallet('sepolia')
          
          // Store wallet data in Supabase
          await createUserWallet(authData.user.id, walletData)
          
          console.log('Wallet created successfully for user:', authData.user.id)
        } catch (walletError) {
          console.error('Failed to create wallet:', walletError)
          // Note: We don't return the wallet error here as the user account was created successfully
          // The wallet creation can be retried later if needed
        }
      }

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