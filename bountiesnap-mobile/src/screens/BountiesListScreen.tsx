import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { getBounties, Bounty } from '../utils/supabase'

interface BountiesListScreenProps {
  navigation: any
}

export default function BountiesListScreen({ navigation }: BountiesListScreenProps) {
  const { user } = useAuth()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadBounties()
  }, [])

  const loadBounties = async () => {
    try {
      setLoading(true)
      const data = await getBounties('open') // Only show open bounties
      setBounties(data)
    } catch (error) {
      console.error('Error loading bounties:', error)
      Alert.alert('Error', 'Failed to load bounties. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadBounties()
    setRefreshing(false)
  }

  const handleBountyPress = (bounty: Bounty) => {
    navigation.navigate('BountyDetails', { bounty })
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
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else {
      return `${hours}h`
    }
  }

  const getStatusColor = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffMs = deadlineDate.getTime() - now.getTime()
    const hours = diffMs / (1000 * 60 * 60)
    
    if (hours <= 0) return '#EF4444' // Red for expired
    if (hours <= 24) return '#F59E0B' // Orange for urgent
    return '#10B981' // Green for normal
  }

  const renderBountyItem = ({ item }: { item: Bounty }) => {
    const timeRemaining = getTimeRemaining(item.deadline)
    const statusColor = getStatusColor(item.deadline)
    const isExpired = timeRemaining === 'Expired'
    
    return (
      <TouchableOpacity
        style={[styles.bountyCard, isExpired && styles.expiredCard]}
        onPress={() => handleBountyPress(item)}
        disabled={isExpired}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.bountyTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.bountyDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountValue}>
              {item.amount_strk?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.amountCurrency}>STRK</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={statusColor} />
            <Text style={[styles.timeText, { color: statusColor }]}>
              {timeRemaining}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>
              {isExpired ? 'Expired' : 'Open'}
            </Text>
          </View>
        </View>

        <View style={styles.creatorInfo}>
          <Ionicons name="person-outline" size={14} color="#9CA3AF" />
          <Text style={styles.creatorText}>
            {item.wallet_address.slice(0, 6)}...{item.wallet_address.slice(-4)}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Bounties Available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new opportunities or create your own bounty!
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading bounties...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Bounties</Text>
        <Text style={styles.headerSubtitle}>
          {bounties.length} bounties available
        </Text>
      </View>

      <FlatList
        data={bounties}
        renderItem={renderBountyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  bountyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expiredCard: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  bountyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bountyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  amountCurrency: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  creatorText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
}) 