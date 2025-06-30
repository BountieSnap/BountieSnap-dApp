import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Bounty } from '../types';

interface BountyCardProps {
  bounty: Bounty;
  onAccept?: (bountyId: string) => void;
  onPress?: () => void;
  showStatus?: boolean;
}

export default function BountyCard({ bounty, onAccept, onPress, showStatus = false }: BountyCardProps) {
  const categoryColors = {
    delivery: { bg: '#DBEAFE', text: '#1E40AF' },
    shopping: { bg: '#D1FAE5', text: '#065F46' },
    'pet-care': { bg: '#FED7AA', text: '#9A3412' },
    maintenance: { bg: '#E9D5FF', text: '#6B21A8' },
    other: { bg: '#F3F4F6', text: '#374151' }
  };

  const statusColors = {
    open: { bg: '#D1FAE5', text: '#065F46' },
    accepted: { bg: '#FEF3C7', text: '#92400E' },
    completed: { bg: '#DBEAFE', text: '#1E40AF' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' }
  };

  const formatTimeLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const categoryColor = categoryColors[bounty.category];
  const statusColor = statusColors[bounty.status];

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: categoryColor.bg }]}>
            <Text style={[styles.badgeText, { color: categoryColor.text }]}>
              {bounty.category.replace('-', ' ')}
            </Text>
          </View>
          {showStatus && (
            <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.badgeText, { color: statusColor.text }]}>
                {bounty.status}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.payment}>
          <Text style={styles.paymentAmount}>${bounty.payment}</Text>
        </View>
      </View>

      <Text style={styles.title}>{bounty.title}</Text>
      <Text style={styles.description}>{bounty.description}</Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{bounty.location.address}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{formatTimeLeft(bounty.deadline)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.seeker}>
          <Image source={{ uri: bounty.seeker.avatar }} style={styles.avatar} />
          <View style={styles.seekerInfo}>
            <Text style={styles.seekerName}>{bounty.seeker.name}</Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{bounty.seeker.rating}</Text>
            </View>
          </View>
        </View>

        {onAccept && bounty.status === 'open' && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAccept(bounty.id)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              style={styles.acceptButtonGradient}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  payment: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  details: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  seeker: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  seekerInfo: {
    flex: 1,
  },
  seekerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  acceptButton: {
    marginLeft: 12,
  },
  acceptButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export { BountyCard }