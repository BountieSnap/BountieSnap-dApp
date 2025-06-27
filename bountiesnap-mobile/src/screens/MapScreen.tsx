import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBounties } from '../utils/supabase';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }: any) {
  const [bounties, setBounties] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [selectedBounty, setSelectedBounty] = useState<any>(null);
  const [showBountyList, setShowBountyList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();

    // Load bounties from database
    loadBounties();
  }, []);

  const loadBounties = async () => {
    try {
      setLoading(true);
      const dbBounties = await getBounties('open');
      console.log('📍 Loaded bounties for map:', dbBounties.length);
      setBounties(dbBounties);
    } catch (error) {
      console.error('Error loading bounties for map:', error);
      Alert.alert('Error', 'Failed to load bounties');
    } finally {
      setLoading(false);
    }
  };

  const openBounties = bounties.filter((bounty: any) => bounty.status === 'open');

  const handleMarkerPress = (bounty: any) => {
    setSelectedBounty(bounty);
  };

  const handleAcceptBounty = (bountyId: string) => {
    // Navigate to bounty details for acceptance
    navigation.navigate('BountyDetails', { bountyId });
    setSelectedBounty(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search nearby bounties..."
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.coords?.latitude || 40.7128,
          longitude: location?.coords?.longitude || -74.0060,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {openBounties
          .filter((bounty: any) => bounty.location_lat && bounty.location_lng)
          .map((bounty: any) => (
            <Marker
              key={bounty.id}
              coordinate={{
                latitude: bounty.location_lat,
                longitude: bounty.location_lng,
              }}
              onPress={() => handleMarkerPress(bounty)}
            >
              <View style={[styles.markerContainer, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.markerText}>{bounty.amount_strk?.toFixed(1) || '0'} STRK</Text>
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Floating Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={styles.listToggleButton}
          onPress={() => setShowBountyList(!showBountyList)}
        >
          <Text style={styles.listToggleText}>
            {showBountyList ? 'Map View' : 'List View'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateBounty')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bounty List Modal */}
      <Modal
        visible={showBountyList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nearby Bounties</Text>
            <TouchableOpacity onPress={() => setShowBountyList(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={styles.bountyList}>
            {openBounties.length > 0 ? (
              openBounties.map((bounty: any) => (
                <TouchableOpacity
                  key={bounty.id}
                  style={styles.simpleBountyCard}
                  onPress={() => navigation.navigate('BountyDetails', { bountyId: bounty.id })}
                >
                  <View style={styles.bountyHeader}>
                    <Text style={styles.bountyTitle}>{bounty.title}</Text>
                    <Text style={styles.bountyAmount}>{bounty.amount_strk?.toFixed(2) || '0'} STRK</Text>
                  </View>
                  <Text style={styles.bountyDescription} numberOfLines={2}>{bounty.description}</Text>
                  <View style={styles.bountyFooter}>
                    <Text style={styles.bountyCategory}>{bounty.category}</Text>
                    <Text style={styles.bountyLocation}>{bounty.location_address || 'Location TBD'}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#6B7280' }}>
                  {loading ? 'Loading bounties...' : 'No bounties found. Create one to get started!'}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Selected Bounty Modal */}
      <Modal
        visible={!!selectedBounty}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBounty(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bounty Details</Text>
            <TouchableOpacity onPress={() => setSelectedBounty(null)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          {selectedBounty && (
            <View style={styles.selectedBountyContainer}>
              <View style={styles.simpleBountyCard}>
                <View style={styles.bountyHeader}>
                  <Text style={styles.bountyTitle}>{selectedBounty.title}</Text>
                  <Text style={styles.bountyAmount}>{selectedBounty.amount_strk?.toFixed(2) || '0'} STRK</Text>
                </View>
                <Text style={styles.bountyDescription}>{selectedBounty.description}</Text>
                <View style={styles.bountyFooter}>
                  <Text style={styles.bountyCategory}>{selectedBounty.category}</Text>
                  <Text style={styles.bountyLocation}>{selectedBounty.location_address || 'Location TBD'}</Text>
                </View>
                <TouchableOpacity
                  style={{ 
                    backgroundColor: '#8B5CF6', 
                    padding: 12, 
                    borderRadius: 8, 
                    marginTop: 12, 
                    alignItems: 'center' 
                  }}
                  onPress={() => handleAcceptBounty(selectedBounty.id)}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listToggleButton: {
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
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    width: 64,
    height: 64,
  },
  createButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  bountyList: {
    flex: 1,
    padding: 16,
  },
  selectedBountyContainer: {
    padding: 16,
  },
  simpleBountyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bountyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bountyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  bountyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  bountyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bountyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bountyCategory: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bountyLocation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});