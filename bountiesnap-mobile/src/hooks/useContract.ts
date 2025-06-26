import { useState, useCallback } from 'react'
import { contractService } from '../services/contractService'
import { CreateBountyParams, Bounty } from '../contracts/BountyContract'
import { useAuth } from '../context/AuthContext'

export const useContract = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create a new bounty
  const createBounty = useCallback(async (params: CreateBountyParams) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await contractService.createBounty(user.id, params)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create bounty')
      }

      return {
        bountyId: result.bountyId,
        txHash: result.txHash,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Apply to a bounty
  const applyToBounty = useCallback(async (bountyId: string, stakeAmount: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await contractService.applyToBounty(user.id, bountyId, stakeAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to apply to bounty')
      }

      return {
        txHash: result.txHash,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Get bounty details
  const getBounty = useCallback(async (bountyId: string): Promise<Bounty | null> => {
    setLoading(true)
    setError(null)

    try {
      const bounty = await contractService.getBounty(bountyId)
      return bounty
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get STRK balance
  const getSTRKBalance = useCallback(async (walletAddress: string): Promise<string> => {
    setLoading(true)
    setError(null)

    try {
      const balance = await contractService.getSTRKBalance(walletAddress)
      return balance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Submit completion proof
  const submitCompletion = useCallback(async (bountyId: string, proof: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await contractService.submitCompletion(user.id, bountyId, proof)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit completion')
      }

      return {
        txHash: result.txHash,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Confirm completion (for seekers)
  const confirmCompletion = useCallback(async (bountyId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await contractService.confirmCompletion(user.id, bountyId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm completion')
      }

      return {
        txHash: result.txHash,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Release funds
  const releaseFunds = useCallback(async (bountyId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await contractService.releaseFunds(user.id, bountyId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to release funds')
      }

      return {
        txHash: result.txHash,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  return {
    // State
    loading,
    error,
    
    // Actions
    createBounty,
    applyToBounty,
    getBounty,
    getSTRKBalance,
    submitCompletion,
    confirmCompletion,
    releaseFunds,
    
    // Clear error
    clearError: useCallback(() => setError(null), []),
  }
} 