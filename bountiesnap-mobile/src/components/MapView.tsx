import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bounty } from '../types';
import BountyCard from './BountyCard';

interface MapViewProps {
  bounties: Bounty[];
  onCreateBounty: () => void;
  onAcceptBounty: (bountyId: string) => void;
}

export const MapView = ({ 
  bounties, 
  onCreateBounty, 
  onAcceptBounty 
}: MapViewProps) => {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [showBountyList, setShowBountyList] = useState(false);

  const handlePinClick = (bounty: Bounty) => {
    setSelectedBounty(bounty);
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapBackground}>
        {/* Simple Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>Bounties in your area</Text>
        </View>

        {/* Location Pins */}
        {bounties.map((bounty, index) => (
          <TouchableOpacity
            key={bounty.id}
            style={[styles.pinContainer, { top: 100 + index * 80, left: 50 + index * 100 }]}
            onPress={() => handlePinClick(bounty)}
          >
            <View style={styles.pin}>
              <View style={[
                styles.pinCircle,
                bounty.status === 'open' ? styles.pinOpen :
                bounty.status === 'accepted' ? styles.pinAccepted :
                styles.pinCompleted
              ]}>
                <Text style={styles.pinText}>${bounty.payment}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* User Location */}
        <View style={styles.userLocation}>
          <View style={styles.userDot} />
        </View>
      </View>

      {/* Top Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nearby bounties..."
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateBounty}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Toggle List View Button */}
      <TouchableOpacity
        style={styles.listToggleButton}
        onPress={() => setShowBountyList(!showBountyList)}
      >
        <Text style={styles.listToggleText}>
          {showBountyList ? 'Map View' : 'List View'}
        </Text>
      </TouchableOpacity>

      {/* Bounty List Modal */}
      <Modal
        visible={showBountyList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nearby Bounties</Text>
            <TouchableOpacity onPress={() => setShowBountyList(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bountyList}>
            {bounties.map((bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onAccept={onAcceptBounty}
              />
            ))}
          </View>
        </View>
      </Modal>

      {/* Selected Bounty Modal */}
      <Modal
        visible={!!selectedBounty}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBounty(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bounty Details</Text>
            <TouchableOpacity onPress={() => setSelectedBounty(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedBounty && (
            <View style={styles.selectedBountyContainer}>
              <BountyCard
                bounty={selectedBounty}
                onAccept={onAcceptBounty}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  mapSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  pinContainer: {
    position: 'absolute',
  },
  pin: {
    alignItems: 'center',
  },
  pinCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinOpen: {
    backgroundColor: '#EF4444',
  },
  pinAccepted: {
    backgroundColor: '#F59E0B',
  },
  pinCompleted: {
    backgroundColor: '#10B981',
  },
  pinText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userLocation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -8,
  },
  userDot: {
    width: 16,
    height: 16,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  createButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#8B5CF6',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  listToggleButton: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listToggleText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
  bountyList: {
    flex: 1,
    padding: 16,
  },
  selectedBountyContainer: {
    flex: 1,
    padding: 16,
  },
});