import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { useBounty } from '../context/BountyContext';
import { useAuth } from '../context/AuthContext';
import { getUserWallet } from '../utils/supabase';
import { getWalletBalance, formatWalletAddress, getExplorerUrl, getFaucetUrl } from '../utils/walletHelpers';

export default function ProfileScreen() {
  const { user, userTasks, updateAvatar } = useBounty();
  const { signOut, user: authUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [strkBalance, setStrkBalance] = useState<string>('0.0000');
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const completedTasks = userTasks.filter(task => task.status === 'completed');
  const streakDays = 12; // Simulated

  // Load wallet data on component mount
  useEffect(() => {
    loadWalletData();
  }, [authUser?.id]);

  const loadWalletData = async () => {
    if (!authUser?.id) {
      setLoadingWallet(false);
      return;
    }

    try {
      setLoadingWallet(true);
      const wallet = await getUserWallet(authUser.id);
      
      if (wallet) {
        setWalletAddress(wallet.wallet_address);
        await loadBalance(wallet);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const loadBalance = async (wallet: any) => {
    try {
      setLoadingBalance(true);
      const balanceInfo = await getWalletBalance(wallet);
      
      if (balanceInfo.error) {
        console.error('Error loading balance:', balanceInfo.error);
        setStrkBalance('Error');
      } else {
        setStrkBalance(balanceInfo.balanceFormatted);
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      setStrkBalance('Error');
    } finally {
      setLoadingBalance(false);
    }
  };

  const copyWalletAddress = () => {
    if (walletAddress) {
      Clipboard.setString(walletAddress);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const refreshBalance = async () => {
    if (!authUser?.id) return;
    
    try {
      const wallet = await getUserWallet(authUser.id);
      if (wallet) {
        await loadBalance(wallet);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      Alert.alert('Error', 'Failed to refresh balance');
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleEditAvatar = async () => {
    if (uploadingAvatar) return;

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to upload an avatar');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for avatar
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        await updateAvatar(result.assets[0].uri);
        Alert.alert('Success', 'Avatar updated successfully!');
      } catch (error) {
        console.error('Error updating avatar:', error);
        Alert.alert('Error', 'Failed to update avatar. Please try again.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const settingsItems = [
    { label: 'Edit Profile', icon: 'person-outline' },
    { label: 'Payment Methods', icon: 'card-outline' },
    { label: 'Notifications', icon: 'notifications-outline' },
    { label: 'Privacy & Security', icon: 'shield-outline' },
    { label: 'Help & Support', icon: 'help-circle-outline' },
    { label: 'Logout', icon: 'log-out-outline', action: handleLogout, isLogout: true }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleEditAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#8B5CF6" />
                ) : (
                  <Ionicons name="pencil" size={14} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FBBF24" />
                <Text style={styles.rating}>{user.rating.toFixed(1)}</Text>
                <Text style={styles.taskCount}>({user.completedTasks} tasks)</Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user.role === 'both' ? 'Seeker & Hunter' : user.role}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(user.totalEarned)}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.content, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          {/* Performance Stats */}
          <View style={styles.performanceCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Performance</Text>
            </View>
            
            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceLabel}>Average Rating</Text>
                  <Text style={styles.performanceValue}>{user.rating.toFixed(1)}/5.0</Text>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#FBBF24', '#F59E0B']}
                    style={[styles.progressFill, { width: `${(user.rating / 5) * 100}%` }]}
                  />
                </View>
              </View>
              
              <View style={styles.performanceItem}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceLabel}>Completion Rate</Text>
                  <Text style={styles.performanceValue}>94%</Text>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={[styles.progressFill, { width: '94%' }]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.additionalStats}>
              <View style={styles.additionalStatItem}>
                <Text style={styles.additionalStatValue}>2.3h</Text>
                <Text style={styles.additionalStatLabel}>Avg. Task Time</Text>
              </View>
              <View style={styles.additionalStatItem}>
                <Text style={styles.additionalStatValue}>8.2</Text>
                <Text style={styles.additionalStatLabel}>Response Time (min)</Text>
              </View>
            </View>
          </View>

          {/* Wallet Information */}
          <View style={styles.walletCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet-outline" size={20} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Wallet</Text>
            </View>
            
            {loadingWallet ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading wallet...</Text>
              </View>
            ) : walletAddress ? (
              <>
                {/* STRK Balance */}
                <View style={styles.balanceContainer}>
                  <View style={styles.balanceHeader}>
                    <Text style={styles.balanceLabel}>STRK Balance</Text>
                    <TouchableOpacity 
                      onPress={refreshBalance}
                      disabled={loadingBalance}
                      style={styles.refreshButton}
                    >
                      {loadingBalance ? (
                        <ActivityIndicator size="small" color="#8B5CF6" />
                      ) : (
                        <Ionicons name="refresh" size={16} color="#8B5CF6" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.balanceValue}>
                    {strkBalance} STRK
                  </Text>
                </View>

                {/* Wallet Address */}
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Wallet Address</Text>
                  <TouchableOpacity 
                    style={styles.addressRow}
                    onPress={copyWalletAddress}
                  >
                                         <Text style={styles.addressValue}>
                       {formatWalletAddress(walletAddress)}
                     </Text>
                    <View style={styles.copyButton}>
                      <Ionicons name="copy-outline" size={16} color="#8B5CF6" />
                      <Text style={styles.copyText}>Copy</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.walletActions}>
                                     <TouchableOpacity 
                     style={styles.actionButton}
                     onPress={() => Alert.alert('Get Test Tokens', `Visit ${getFaucetUrl()} to get test STRK tokens`)}
                   >
                     <Ionicons name="water-outline" size={16} color="#10B981" />
                     <Text style={styles.actionButtonText}>Get Test Tokens</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={styles.actionButton}
                     onPress={() => Alert.alert('View on Explorer', `Visit ${getExplorerUrl(walletAddress)} to view your wallet on StarkScan`)}
                   >
                     <Ionicons name="open-outline" size={16} color="#3B82F6" />
                     <Text style={styles.actionButtonText}>View Explorer</Text>
                   </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noWalletContainer}>
                <Ionicons name="wallet-outline" size={32} color="#D1D5DB" />
                <Text style={styles.noWalletText}>No wallet found</Text>
                <Text style={styles.noWalletSubtext}>A wallet will be created automatically when you sign up</Text>
              </View>
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.activityCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Recent Activity</Text>
            </View>
            
            {completedTasks.length > 0 ? (
              <View style={styles.activityList}>
                {completedTasks.slice(0, 3).map((task) => (
                  <View key={task.id} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    </View>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityTitle}>{task.title}</Text>
                      <Text style={styles.activityDate}>
                        {new Date(task.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.activityEarning}>
                      <Text style={styles.earningAmount}>${task.payment}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
              </View>
            )}
          </View>

          {/* Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.cardTitle}>Settings</Text>
            <View style={styles.settingsList}>
              {settingsItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.settingsItem, item.isLogout && styles.logoutItem]}
                  onPress={item.action}
                >
                  <View style={styles.settingsItemLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={item.isLogout ? "#EF4444" : "#6B7280"} 
                    />
                    <Text style={[styles.settingsItemText, item.isLogout && styles.logoutText]}>
                      {item.label}
                    </Text>
                  </View>
                  {!item.isLogout && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  taskCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  performanceGrid: {
    marginBottom: 16,
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  additionalStatItem: {
    alignItems: 'center',
  },
  additionalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityEarning: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsList: {
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  // Wallet card styles
  walletCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  balanceContainer: {
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#374151',
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  noWalletContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noWalletText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  noWalletSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
});