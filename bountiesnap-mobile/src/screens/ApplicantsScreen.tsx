import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { getUserWallet, getBountyApplications, updateBountyApplication, getBountyById, Bounty, BountyApplication } from '../utils/supabase'
import { approveHunterOnChain } from '../utils/bountyContractFixed'
import { extractPrivateKey } from '../utils/walletDebug'

interface ApplicantsScreenProps {
  navigation: any
  route: any
}

export default function ApplicantsScreen({ navigation, route }: ApplicantsScreenProps) {
  const { user } = useAuth()
  const { bounty: passedBounty } = route.params
  
  const [bounty, setBounty] = useState<Bounty | null>(passedBounty)
  const [applications, setApplications] = useState<BountyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    if (!bounty) return
    
    try {
      setLoading(true)
      const data = await getBountyApplications(bounty.id)
      console.log('📋 Loaded applications:', data.length)
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
      Alert.alert('Error', 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadApplications()
    setRefreshing(false)
  }

  const handleApproveHunter = async (application: BountyApplication) => {
    if (!user?.id || !bounty) {
      Alert.alert('Error', 'Missing required data')
      return
    }

    // Confirm approval
    Alert.alert(
      'Approve Hunter',
      `Are you sure you want to approve ${application.wallet_address.slice(0, 6)}...${application.wallet_address.slice(-4)} for this bounty?\n\nThis will start the bounty work and lock in the hunter.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => proceedWithApproval(application)
        }
      ]
    )
  }

  const proceedWithApproval = async (application: BountyApplication) => {
    if (!user?.id || !bounty) return

    try {
      setApproving(application.id)

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

      console.log('🎯 Approving hunter on chain:', {
        bountyId: bounty.on_chain_id,
        hunterAddress: application.wallet_address,
        userAddress: userWallet.wallet_address
      })

      // Approve hunter on blockchain
      const result = await approveHunterOnChain(
        bounty.on_chain_id,
        application.wallet_address,
        userWallet.wallet_address,
        privateKey
      )

      console.log('✅ Hunter approval result:', result)

      // Update application status in database
      await updateBountyApplication(application.id, {
        status: 'approved',
        updated_at: new Date().toISOString()
      })

      Alert.alert(
        'Success! 🎉',
        `Hunter approved successfully!\n\nThe bounty is now in progress and the hunter can start working.`,
        [
          {
            text: 'OK',
            onPress: () => {
              loadApplications() // Refresh applications
              navigation.goBack()
            }
          }
        ]
      )

    } catch (error) {
      console.error('Error approving hunter:', error)
      
      let errorMessage = 'Failed to approve hunter. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      Alert.alert('Error', errorMessage)
    } finally {
      setApproving(null)
    }
  }

  const formatStakeAmount = (amount: string) => {
    try {
      const amountFloat = parseFloat(amount) / Math.pow(10, 18)
      return amountFloat.toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const pendingApplications = applications.filter(app => app.status === 'pending')
  const approvedApplications = applications.filter(app => app.status === 'approved')
  const submittedApplications = applications.filter(app => app.status === 'submitted')
  const completedApplications = applications.filter(app => app.status === 'completed')

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bounty Applications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bounty Applications</Text>
        </View>

        {/* Bounty Summary */}
        <View style={styles.bountyCard}>
          <Text style={styles.bountyTitle}>{bounty?.title}</Text>
          <View style={styles.bountyMeta}>
            <Text style={styles.bountyAmount}>
              {bounty?.amount_strk?.toFixed(2) || '0.00'} STRK
            </Text>
            <Text style={styles.applicationCount}>
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Pending Applications */}
        {pendingApplications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Applications ({pendingApplications.length})
            </Text>
            {pendingApplications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.hunterInfo}>
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#6B7280" />
                    </View>
                    <View>
                      <Text style={styles.hunterAddress}>
                        {app.wallet_address.slice(0, 6)}...{app.wallet_address.slice(-4)}
                      </Text>
                      <Text style={styles.applicationDate}>
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.stakeAmount}>
                    {formatStakeAmount(app.stake_amount)} STRK stake
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.approveButton, approving === app.id && styles.disabledButton]}
                  onPress={() => handleApproveHunter(app)}
                  disabled={approving === app.id}
                >
                  {approving === app.id ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color="white" />
                      <Text style={styles.approveButtonText}>Approve Hunter</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Approved Applications */}
        {approvedApplications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Approved Hunter ({approvedApplications.length})
            </Text>
            {approvedApplications.map((app) => (
              <View key={app.id} style={[styles.applicationCard, styles.approvedCard]}>
                <View style={styles.applicationHeader}>
                  <View style={styles.hunterInfo}>
                    <View style={[styles.avatarPlaceholder, styles.approvedAvatar]}>
                      <Ionicons name="checkmark" size={20} color="#10B981" />
                    </View>
                    <View>
                      <Text style={styles.hunterAddress}>
                        {app.wallet_address.slice(0, 6)}...{app.wallet_address.slice(-4)}
                      </Text>
                      <Text style={styles.approvedText}>✅ Approved Hunter</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.progressNote}>
                  <Text style={styles.progressText}>
                    🎯 Hunter is working on your bounty. You'll be notified when they submit proof.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Submitted Applications - Awaiting Confirmation */}
        {submittedApplications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏆 Work Submitted - Needs Confirmation ({submittedApplications.length})
            </Text>
            {submittedApplications.map((app) => (
              <View key={app.id} style={[styles.applicationCard, styles.submittedCard]}>
                <View style={styles.applicationHeader}>
                  <View style={styles.hunterInfo}>
                    <View style={[styles.avatarPlaceholder, styles.submittedAvatar]}>
                      <Ionicons name="camera" size={20} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={styles.hunterAddress}>
                        {app.wallet_address.slice(0, 6)}...{app.wallet_address.slice(-4)}
                      </Text>
                      <Text style={styles.submittedText}>📸 Proof Submitted</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.submitNote}>
                  <Text style={styles.submitText}>
                    🎯 Hunter has submitted proof! Go to bounty details to review and confirm completion.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed Applications */}
        {completedApplications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✅ Completed ({completedApplications.length})
            </Text>
            {completedApplications.map((app) => (
              <View key={app.id} style={[styles.applicationCard, styles.completedCard]}>
                <View style={styles.applicationHeader}>
                  <View style={styles.hunterInfo}>
                    <View style={[styles.avatarPlaceholder, styles.completedAvatar]}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                    <View>
                      <Text style={styles.hunterAddress}>
                        {app.wallet_address.slice(0, 6)}...{app.wallet_address.slice(-4)}
                      </Text>
                      <Text style={styles.completedText}>🎉 Completed & Paid</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.completedNote}>
                  <Text style={styles.completedText}>
                    ✅ Bounty completed successfully! Funds have been released to hunter.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* No Applications */}
        {applications.length === 0 && (
          <View style={styles.noApplications}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.noApplicationsText}>No applications yet</Text>
            <Text style={styles.noApplicationsSubtext}>
              Hunters will see your bounty and can apply with a stake amount
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  bountyCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bountyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  bountyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bountyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  applicationCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  applicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  approvedCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hunterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  approvedAvatar: {
    backgroundColor: '#D1FAE5',
  },
  hunterAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  applicationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  approvedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  stakeAmount: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  progressNote: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    padding: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 16,
  },
  approveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  noApplications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noApplicationsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  noApplicationsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  submittedCard: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  submittedAvatar: {
    backgroundColor: '#FDE68A',
  },
  submittedText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    marginTop: 2,
  },
  submitNote: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
  },
  submitText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  completedCard: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  completedAvatar: {
    backgroundColor: '#A7F3D0',
  },
  completedText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
    marginTop: 2,
  },
  completedNote: {
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    padding: 8,
  },
}) 