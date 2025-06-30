import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { getUserWallet, createBountyApplication, getBountyApplications, getBountyById, BountyApplication, Bounty, updateBountyApplication, updateBountyStatus } from '../utils/supabase'
import { applyToBountyOnChain, submitCompletionOnChain, confirmCompletionOnChain, releaseFundsOnChain } from '../utils/bountyContractFixed'
import { extractPrivateKey } from '../utils/walletDebug'
import { selectProofPhoto, PhotoResult } from '../utils/camera'

interface BountyDetailsScreenProps {
  navigation: any
  route: any
}

export default function BountyDetailsScreen({ navigation, route }: BountyDetailsScreenProps) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { bounty: passedBounty, bountyId } = route.params
  
  const [bounty, setBounty] = useState<Bounty | null>(passedBounty || null)
  const [stakeAmount, setStakeAmount] = useState('0.1') // Default stake amount
  const [loading, setLoading] = useState(false)
  const [loadingBounty, setLoadingBounty] = useState(!passedBounty)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applications, setApplications] = useState<BountyApplication[]>([])
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [submittingProof, setSubmittingProof] = useState(false)
  const [confirmingCompletion, setConfirmingCompletion] = useState(false)
  const [proofPhoto, setProofPhoto] = useState<PhotoResult | null>(null)
  const [completionConfirmed, setCompletionConfirmed] = useState(false)
  const [releasingFunds, setReleasingFunds] = useState(false)

  useEffect(() => {
    loadBounty()
    if (bounty) {
      loadApplications()
    }
  }, [bountyId])

  const loadBounty = async () => {
    if (passedBounty) {
      setBounty(passedBounty)
      setLoadingBounty(false)
      return
    }

    if (!bountyId) {
      Alert.alert('Error', 'No bounty specified')
      navigation.goBack()
      return
    }

    try {
      setLoadingBounty(true)
      console.log('🔍 Loading bounty by ID:', bountyId)
      const loadedBounty = await getBountyById(bountyId)
      
      if (!loadedBounty) {
        Alert.alert('Error', 'Bounty not found')
        navigation.goBack()
        return
      }

      console.log('📄 Loaded bounty:', loadedBounty)
      setBounty(loadedBounty)
      
      // Load applications after bounty is loaded
      const data = await getBountyApplications(loadedBounty.id)
      setApplications(data)
      
    } catch (error) {
      console.error('Error loading bounty:', error)
      Alert.alert('Error', 'Failed to load bounty details')
      navigation.goBack()
    } finally {
      setLoadingBounty(false)
      setLoadingApplications(false)
    }
  }

  const loadApplications = async () => {
    if (!bounty) return
    
    try {
      setLoadingApplications(true)
      const data = await getBountyApplications(bounty.id)
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffMs = deadlineDate.getTime() - now.getTime()
    
    if (diffMs <= 0) {
      return 'Expired'
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const isExpired = () => {
    if (!bounty) return true
    const now = new Date()
    const deadlineDate = new Date(bounty.deadline)
    return deadlineDate.getTime() <= now.getTime()
  }

  const getMyApplication = () => {
    return applications.find(app => app.hunter_id === user?.id)
  }

  const isMyBounty = () => {
    return bounty?.creator_id === user?.id
  }

  const getApprovedApplication = () => {
    // Find the active application (either approved or submitted)
    return applications.find(app => app.status === 'approved' || app.status === 'submitted')
  }

  const hasAlreadyApplied = () => {
    return applications.some(app => app.hunter_id === user?.id)
  }

  const canApply = () => {
    if (!bounty) return false
    return !isExpired() && !hasAlreadyApplied() && bounty.creator_id !== user?.id
  }

  const handleApply = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to apply')
      return
    }

    if (!bounty) {
      Alert.alert('Error', 'Bounty data not available')
      return
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid stake amount')
      return
    }

    try {
      setLoading(true)

      // Get user wallet
      const userWallet = await getUserWallet(user.id)
      if (!userWallet) {
        Alert.alert('Error', 'No wallet found. Please create a wallet first.')
        return
      }

      const privateKey = extractPrivateKey(userWallet)
      if (!privateKey) {
        Alert.alert('Error', 'Could not extract private key from wallet')
        return
      }

      // Convert stake amount to wei
      const stakeAmountFloat = parseFloat(stakeAmount)
      const stakeAmountWei = (stakeAmountFloat * Math.pow(10, 18)).toString()

      console.log('Applying to bounty on chain...')
      console.log('Bounty on-chain ID:', bounty.on_chain_id)
      console.log('Stake amount (STRK):', stakeAmount)
      console.log('Stake amount (wei):', stakeAmountWei)

      // Apply to bounty on chain
      const result = await applyToBountyOnChain(
        bounty.on_chain_id,
        stakeAmountWei,
        userWallet.wallet_address,
        privateKey
      )

      console.log('Application submitted on chain:', result)

      // Get transaction hash
      const transactionHash = result.applyTransaction?.result?.transactionHash

      // Store application in database
      await createBountyApplication({
        bounty_id: bounty.id,
        hunter_id: user.id,
        stake_amount: stakeAmountWei,
        wallet_address: userWallet.wallet_address,
        transaction_hash: transactionHash
      })

      setShowApplyModal(false)
      
      Alert.alert(
        'Success! 🎉',
        `Application submitted successfully!\n\nStake: ${stakeAmount} STRK\nTransaction: ${transactionHash || 'Pending'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              loadApplications() // Refresh applications
            }
          }
        ]
      )

    } catch (error) {
      console.error('Error applying to bounty:', error)
      
      let errorMessage = 'Failed to apply to bounty. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient STRK balance')) {
          errorMessage = `🪙 Insufficient STRK Balance!\n\nYou need at least ${stakeAmount} STRK to apply.\n\n💡 Get test STRK tokens from a Sepolia faucet.`
        } else {
          errorMessage = error.message
        }
      }
      
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitProof = async () => {
    if (!user?.id || !bounty) {
      Alert.alert('Error', 'Missing required data')
      return
    }

    const myApp = getMyApplication()
    if (!myApp || myApp.status !== 'approved') {
      Alert.alert('Error', 'You are not approved for this bounty')
      return
    }

    // First, let user take/select photo
    const photo = await selectProofPhoto()
    if (!photo) {
      return // User cancelled
    }

    try {
      setSubmittingProof(true)

      // Get user wallet
      const userWallet = await getUserWallet(user.id)
      if (!userWallet) {
        Alert.alert('Error', 'No wallet found. Please create a wallet first.')
        return
      }

      const privateKey = extractPrivateKey(userWallet)
      if (!privateKey) {
        Alert.alert('Error', 'Could not extract private key from wallet')
        return
      }

      console.log('📸 Submitting proof on chain:', {
        bountyId: bounty.on_chain_id,
        proofHash: photo.proofHash,
        userAddress: userWallet.wallet_address
      })

      // Submit completion on blockchain
      const result = await submitCompletionOnChain(
        bounty.on_chain_id,
        photo.proofHash,
        userWallet.wallet_address,
        privateKey
      )

      console.log('✅ Proof submission result:', result)

      // Update application in database - set to 'submitted' (waiting for creator confirmation)
      await updateBountyApplication(myApp.id, {
        status: 'submitted',
        updated_at: new Date().toISOString()
      })

      setProofPhoto(photo)

      Alert.alert(
        'Proof Submitted! 📸',
        'Your proof has been submitted to the blockchain. The bounty creator will review it and confirm completion.',
        [
          {
            text: 'OK',
            onPress: () => {
              loadApplications() // Refresh applications
            }
          }
        ]
      )

    } catch (error) {
      console.error('Error submitting proof:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit proof')
    } finally {
      setSubmittingProof(false)
    }
  }

  const handleConfirmCompletion = async () => {
    if (!user?.id || !bounty) {
      Alert.alert('Error', 'Missing required data')
      return
    }

    if (!isMyBounty()) {
      Alert.alert('Error', 'Only the bounty creator can confirm completion')
      return
    }

    const approvedApp = getApprovedApplication()
    if (!approvedApp || approvedApp.status !== 'submitted') {
      Alert.alert('Error', 'No submitted work to confirm')
      return
    }

    Alert.alert(
      'Confirm Completion',
      'Are you satisfied with the work submitted? This will confirm completion and release funds to the hunter.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Release Funds',
          style: 'default',
          onPress: () => proceedWithConfirmation()
        }
      ]
    )
  }

  const handleReleaseFunds = async () => {
    if (!user?.id || !bounty) {
      Alert.alert('Error', 'Missing required data')
      return
    }

    try {
      setReleasingFunds(true)

      // Get user wallet
      const userWallet = await getUserWallet(user.id)
      if (!userWallet) {
        Alert.alert('Error', 'No wallet found. Please create a wallet first.')
        return
      }

      const privateKey = extractPrivateKey(userWallet)
      if (!privateKey) {
        Alert.alert('Error', 'Could not extract private key from wallet')
        return
      }

      console.log('💰 Attempting to release funds...')

      // Release funds on blockchain
      const releaseResult = await releaseFundsOnChain(
        bounty.on_chain_id,
        userWallet.wallet_address,
        privateKey
      )

      console.log('✅ Fund release result:', releaseResult)

      // Update application status to 'completed' after successful fund release
      const approvedApp = getApprovedApplication()
      if (approvedApp) {
        await updateBountyApplication(approvedApp.id, {
          status: 'completed',
          updated_at: new Date().toISOString()
        })
      }

      // Update bounty status to 'completed' after successful fund release
      try {
        await updateBountyStatus(bounty.id, 'completed')
        console.log('✅ Bounty status updated to completed')
        
        // Update local bounty state to reflect the status change
        setBounty(prev => prev ? { ...prev, status: 'completed' } : null)
      } catch (statusError) {
        console.error('⚠️ Warning: Failed to update bounty status in database:', statusError)
        // Don't throw error - funds were released successfully, just log the warning
      }

      setCompletionConfirmed(false) // Reset state
      
      Alert.alert(
        'Funds Released! 🎉',
        'The funds have been successfully released to the hunter.',
        [
          {
            text: 'OK',
            onPress: () => {
              loadApplications() // Refresh to show updated status
              navigation.goBack()
            }
          }
        ]
      )

    } catch (error) {
      console.error('Error releasing funds:', error)
      Alert.alert(
        'Fund Release Failed',
        error instanceof Error ? error.message : 'Failed to release funds. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleReleaseFunds()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      )
    } finally {
      setReleasingFunds(false)
    }
  }

  const proceedWithConfirmation = async () => {
    if (!user?.id || !bounty) return

    try {
      setConfirmingCompletion(true)

      // Get user wallet
      const userWallet = await getUserWallet(user.id)
      if (!userWallet) {
        Alert.alert('Error', 'No wallet found. Please create a wallet first.')
        return
      }

      const privateKey = extractPrivateKey(userWallet)
      if (!privateKey) {
        Alert.alert('Error', 'Could not extract private key from wallet')
        return
      }

      console.log('✅ Confirming completion on chain:', {
        bountyId: bounty.on_chain_id,
        userAddress: userWallet.wallet_address
      })

      // Confirm completion on blockchain
      const confirmResult = await confirmCompletionOnChain(
        bounty.on_chain_id,
        userWallet.wallet_address,
        privateKey
      )

      console.log('✅ Completion confirmation result:', confirmResult)

      // Mark completion as confirmed
      setCompletionConfirmed(true)

      // Try to release funds immediately
      console.log('💰 Attempting to release funds...')
      
      try {
        // Release funds on blockchain
        const releaseResult = await releaseFundsOnChain(
          bounty.on_chain_id,
          userWallet.wallet_address,
          privateKey
        )

        console.log('✅ Fund release result:', releaseResult)

        // Update application status to 'completed' after successful fund release
        const approvedApp = getApprovedApplication()
        if (approvedApp) {
          await updateBountyApplication(approvedApp.id, {
            status: 'completed',
            updated_at: new Date().toISOString()
          })
        }

        // Update bounty status to 'completed' after successful fund release
        try {
          await updateBountyStatus(bounty.id, 'completed')
          console.log('✅ Bounty status updated to completed')
          
          // Update local bounty state to reflect the status change
          setBounty(prev => prev ? { ...prev, status: 'completed' } : null)
        } catch (statusError) {
          console.error('⚠️ Warning: Failed to update bounty status in database:', statusError)
          // Don't throw error - funds were released successfully, just log the warning
        }

        setCompletionConfirmed(false) // Reset state
        
        Alert.alert(
          'Success! 🎉',
          'The bounty has been completed successfully and funds have been released to the hunter.',
          [
            {
              text: 'OK',
              onPress: () => {
                loadApplications() // Refresh to show updated status
                navigation.goBack()
              }
            }
          ]
        )

      } catch (releaseError) {
        console.error('Fund release failed:', releaseError)
        
        Alert.alert(
          'Completion Confirmed ✅',
          'The completion has been confirmed on the blockchain, but fund release failed. This may be due to a timing issue. You can retry releasing funds manually.',
          [
            {
              text: 'OK',
              onPress: () => {
                loadApplications() // Refresh to show updated status
              }
            }
          ]
        )
      }

    } catch (error) {
      console.error('Error confirming completion:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to confirm completion')
    } finally {
      setConfirmingCompletion(false)
    }
  }

  const navigateToApplicants = () => {
    navigation.navigate('Applicants', { bounty })
  }

  const renderActionButtons = () => {
    const myApp = getMyApplication()
    const approvedApp = getApprovedApplication()

    // Dynamic action section style with bottom safe area
    const actionSectionStyle = [
      styles.actionSection,
      { paddingBottom: Math.max(16, insets.bottom + 8) }
    ]

    // For Bounty Creator
    if (isMyBounty()) {
      return (
        <View style={actionSectionStyle}>
          {/* Manage Applications Button */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={navigateToApplicants}
          >
            <Ionicons name="people" size={20} color="white" />
            <Text style={styles.primaryActionText}>
              Manage Applications ({applications.length})
            </Text>
          </TouchableOpacity>

          {/* Confirm Completion Button (if hunter submitted proof) */}
          {approvedApp?.status === 'submitted' && !completionConfirmed && (
            <TouchableOpacity
              style={[styles.secondaryActionButton, confirmingCompletion && styles.disabledButton]}
              onPress={handleConfirmCompletion}
              disabled={confirmingCompletion}
            >
              {confirmingCompletion ? (
                <ActivityIndicator color="#8B5CF6" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                  <Text style={styles.secondaryActionText}>Confirm & Release Funds</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Release Funds Button (if completion confirmed but funds not released) */}
          {completionConfirmed && (
            <>
              <TouchableOpacity
                style={[styles.primaryActionButton, styles.releaseButton, releasingFunds && styles.disabledButton]}
                onPress={handleReleaseFunds}
                disabled={releasingFunds}
              >
                {releasingFunds ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="cash" size={20} color="white" />
                    <Text style={styles.primaryActionText}>Release Funds</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.manualReleaseNote}>
                ✅ Completion confirmed. Click above to release funds to the hunter.
              </Text>
            </>
          )}
        </View>
      )
    }

    // For Hunters
    if (myApp) {
      if (myApp.status === 'pending') {
        return (
          <View style={actionSectionStyle}>
            <View style={styles.statusButton}>
              <Ionicons name="time" size={20} color="#F59E0B" />
              <Text style={[styles.actionStatusText, { color: '#F59E0B' }]}>Application Pending</Text>
            </View>
          </View>
        )
      }

      if (myApp.status === 'approved') {
        return (
          <View style={actionSectionStyle}>
            <TouchableOpacity
              style={[styles.primaryActionButton, styles.proofButton, submittingProof && styles.disabledButton]}
              onPress={handleSubmitProof}
              disabled={submittingProof}
            >
              {submittingProof ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.primaryActionText}>Submit Proof Photo</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.approvedHunterText}>
              ✅ You're approved! Complete the task and submit proof.
            </Text>
          </View>
        )
      }

      if (myApp.status === 'submitted') {
        return (
          <View style={actionSectionStyle}>
            <View style={styles.statusButton}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.actionStatusText, { color: '#10B981' }]}>
                Proof Submitted - Awaiting Confirmation
              </Text>
            </View>
            {proofPhoto && (
              <Text style={styles.proofNote}>
                📸 Proof photo submitted successfully
              </Text>
            )}
          </View>
        )
      }

      if (myApp.status === 'completed') {
        return (
          <View style={actionSectionStyle}>
            <View style={styles.statusButton}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.actionStatusText, { color: '#10B981' }]}>
                ✅ Work Completed & Confirmed!
              </Text>
            </View>
            <Text style={styles.approvedHunterText}>
              🎉 Bounty completed successfully! Funds have been released.
            </Text>
          </View>
        )
      }

      return (
        <View style={actionSectionStyle}>
          <View style={styles.statusButton}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={[styles.actionStatusText, { color: '#6B7280' }]}>
              Application {myApp.status}
            </Text>
          </View>
        </View>
      )
    }

    // For users who haven't applied yet
    if (canApply()) {
      return (
        <View style={actionSectionStyle}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => setShowApplyModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.primaryActionText}>Apply to Bounty</Text>
          </TouchableOpacity>
        </View>
      )
    }

    // Default case (expired, can't apply, etc.)
    return (
      <View style={actionSectionStyle}>
        <View style={styles.statusButton}>
          <Ionicons name="close-circle" size={20} color="#6B7280" />
          <Text style={[styles.actionStatusText, { color: '#6B7280' }]}>
            {isExpired() ? 'Bounty Expired' : 'Cannot Apply'}
          </Text>
        </View>
      </View>
    )
  }

  const renderApplyModal = () => (
    <Modal
      visible={showApplyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowApplyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply to Bounty</Text>
            <TouchableOpacity
              onPress={() => setShowApplyModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Set your stake amount. This shows your commitment and will be returned when you complete the task.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Stake Amount (STRK)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.stakeInput}
                value={stakeAmount}
                onChangeText={setStakeAmount}
                placeholder="0.1"
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>STRK</Text>
            </View>
            <Text style={styles.inputHint}>
              Recommended: 10-20% of bounty amount ({bounty?.amount_strk ? `${(bounty.amount_strk * 0.1).toFixed(2)} - ${(bounty.amount_strk * 0.2).toFixed(2)} STRK` : 'N/A'})
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowApplyModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.applyButton, loading && styles.disabledButton]}
              onPress={handleApply}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  // Show loading state while bounty is being loaded
  if (loadingBounty || !bounty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bounty Details</Text>
        </View>
        <View style={[styles.loadingContainer, { flex: 1, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading bounty details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bounty Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Bounty Info */}
        <View style={styles.bountyCard}>
          <View style={styles.titleSection}>
            <Text style={styles.bountyTitle}>{bounty.title}</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.amountValue}>
                {bounty.amount_strk?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.amountCurrency}>STRK</Text>
            </View>
          </View>

          <Text style={styles.description}>{bounty.description}</Text>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                {getTimeRemaining(bounty.deadline)} remaining
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                Due: {new Date(bounty.deadline).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                Creator: {bounty.wallet_address.slice(0, 6)}...{bounty.wallet_address.slice(-4)}
              </Text>
            </View>
          </View>

          <View style={styles.statusSection}>
            <View style={[
              styles.statusBadge,
              isExpired() ? styles.expiredBadge : styles.openBadge
            ]}>
              <Text style={[
                styles.statusText,
                isExpired() ? styles.expiredText : styles.openText
              ]}>
                {isExpired() ? 'Expired' : 'Open'}
              </Text>
            </View>
          </View>
        </View>

        {/* Applications Section */}
        <View style={styles.applicationsSection}>
          <Text style={styles.sectionTitle}>
            Applications ({applications.length})
          </Text>
          
          {loadingApplications ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading applications...</Text>
            </View>
          ) : applications.length > 0 ? (
            applications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <Text style={styles.applicationHunter}>
                    {app.wallet_address.slice(0, 6)}...{app.wallet_address.slice(-4)}
                  </Text>
                  <Text style={styles.applicationStake}>
                    {app.stake_amount_strk?.toFixed(2)} STRK stake
                  </Text>
                </View>
                <Text style={styles.applicationDate}>
                  Applied {new Date(app.applied_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noApplications}>No applications yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {renderActionButtons()}

      {renderApplyModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  bountyCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bountyTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  amountCurrency: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  metaInfo: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusSection: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  openBadge: {
    backgroundColor: '#D1FAE5',
  },
  expiredBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openText: {
    color: '#065F46',
  },
  expiredText: {
    color: '#991B1B',
  },
  applicationsSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  applicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  applicationHunter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  applicationStake: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  applicationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  noApplications: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  actionSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyActionButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 16,
  },
  appliedText: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ownerButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ownerText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stakeInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  inputSuffix: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryActionButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStatusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  proofButton: {
    backgroundColor: '#059669', // Green for proof submission
  },
  releaseButton: {
    backgroundColor: '#F59E0B', // Orange for fund release
  },
  approvedHunterText: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '500',
  },
  proofNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  manualReleaseNote: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
}) 