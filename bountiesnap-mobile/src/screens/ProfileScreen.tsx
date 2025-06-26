import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useBounty } from '../context/BountyContext';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, userTasks } = useBounty();
  const { signOut, user: authUser } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const completedTasks = userTasks.filter(task => task.status === 'completed');
  const streakDays = 12; // Simulated

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out');
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
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="pencil" size={14} color="#8B5CF6" />
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

        <View style={styles.content}>
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
});