import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useBounty } from '../context/BountyContext';
import { Achievement } from '../types';

export default function AchievementsScreen() {
  const { achievements, user } = useBounty();

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const inProgressAchievements = achievements.filter(a => a.progress && !a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.progress && !a.unlockedAt);

  const getRarityColors = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return ['#9CA3AF', '#6B7280'];
      case 'rare': return ['#60A5FA', '#3B82F6'];
      case 'epic': return ['#A78BFA', '#8B5CF6'];
      case 'legendary': return ['#FBBF24', '#F59E0B'];
      default: return ['#9CA3AF', '#6B7280'];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const AchievementCard: React.FC<{ 
    achievement: Achievement; 
    isUnlocked: boolean; 
    isInProgress: boolean 
  }> = ({ achievement, isUnlocked, isInProgress }) => (
    <View style={[
      styles.achievementCard,
      !isUnlocked && !isInProgress && styles.lockedCard
    ]}>
      {isUnlocked && (
        <LinearGradient
          colors={[...getRarityColors(achievement.rarity), 'transparent']}
          style={styles.rarityGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            {isUnlocked ? (
              <LinearGradient
                colors={getRarityColors(achievement.rarity)}
                style={styles.iconGradient}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.lockedIconContainer}>
                <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              !isUnlocked && !isInProgress && styles.lockedText
            ]}>
              {achievement.title}
            </Text>
            <Text style={[
              styles.achievementDescription,
              !isUnlocked && !isInProgress && styles.lockedText
            ]}>
              {achievement.description}
            </Text>
          </View>
          
          {isUnlocked && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
        </View>

        {/* Progress Bar */}
        {isInProgress && achievement.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressNumbers}>
                {achievement.progress.current}/{achievement.progress.total}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={getRarityColors(achievement.rarity)}
                style={[
                  styles.progressFill,
                  { width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }
                ]}
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={[
            styles.rarityBadge,
            isUnlocked && { backgroundColor: getRarityColors(achievement.rarity)[0] }
          ]}>
            <Text style={[
              styles.rarityText,
              isUnlocked && styles.rarityTextUnlocked
            ]}>
              {achievement.rarity.toUpperCase()}
            </Text>
          </View>
          
          {isUnlocked && achievement.unlockedAt && (
            <Text style={styles.unlockedDate}>
              Unlocked {formatDate(achievement.unlockedAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Achievements</Text>
          <Ionicons name="trophy" size={28} color="#F59E0B" />
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>
              {inProgressAchievements.length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#9CA3AF' }]}>
              {lockedAchievements.length}
            </Text>
            <Text style={styles.statLabel}>Locked</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Unlocked Achievements</Text>
            </View>
            {unlockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={true}
                isInProgress={false}
              />
            ))}
          </View>
        )}

        {/* In Progress Achievements */}
        {inProgressAchievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.loadingSpinner} />
              <Text style={styles.sectionTitle}>In Progress</Text>
            </View>
            {inProgressAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={false}
                isInProgress={true}
              />
            ))}
          </View>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              <Text style={styles.sectionTitle}>Locked</Text>
            </View>
            {lockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={false}
                isInProgress={false}
              />
            ))}
          </View>
        )}
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderTopColor: 'transparent',
    borderRadius: 10,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  lockedCard: {
    opacity: 0.6,
  },
  rarityGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressNumbers: {
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  rarityTextUnlocked: {
    color: 'white',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});