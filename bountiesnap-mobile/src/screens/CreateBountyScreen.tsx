import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

import { useBounty } from '../context/BountyContext';
import { useAuth } from '../context/AuthContext';
import { getUserWallet } from '../utils/supabase';
import { debugWalletData, extractPrivateKey, validateWalletForTransaction } from '../utils/walletDebug';
import { createBountyWithManagedId } from '../services/bountyService';

const { width, height } = Dimensions.get('window');

export default function CreateBountyScreen({ navigation }: any) {
  const { createBounty } = useBounty();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128, // Default while loading
    longitude: -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [bountyData, setBountyData] = useState({
    title: '',
    description: '',
    category: 'delivery',
    payment: 0,
    location: '',
    location_lat: 0,
    location_lng: 0,
    deadline: '',
    requirements: [] as string[]
  });

  const categories = [
    { id: 'delivery', label: 'Delivery', emoji: '🚚', suggestedPrice: 15 },
    { id: 'shopping', label: 'Shopping', emoji: '🛒', suggestedPrice: 25 },
    { id: 'pet-care', label: 'Pet Care', emoji: '🐕', suggestedPrice: 30 },
    { id: 'maintenance', label: 'Maintenance', emoji: '🔧', suggestedPrice: 40 },
    { id: 'other', label: 'Other', emoji: '📦', suggestedPrice: 20 }
  ];

  // Get user's current location on component mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      // Update map region to user's location
      if (location?.coords) {
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        console.log('📍 Current location:', location.coords);
      }
    })();
  }, []);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLocationSelect = () => {
    setShowLocationPicker(true);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude,
    });
    console.log('📍 Selected location:', { latitude, longitude });
  };

  const confirmLocationSelection = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    try {
      // Reverse geocoding to get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      if (address && address.length > 0) {
        const addr = address[0];
        const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        
        setBountyData({
          ...bountyData,
          location: formattedAddress,
          location_lat: selectedLocation.latitude,
          location_lng: selectedLocation.longitude,
        });
        
        console.log('📍 Location saved:', {
          address: formattedAddress,
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
        });
      } else {
        setBountyData({
          ...bountyData,
          location: `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`,
          location_lat: selectedLocation.latitude,
          location_lng: selectedLocation.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setBountyData({
        ...bountyData,
        location: `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`,
        location_lat: selectedLocation.latitude,
        location_lng: selectedLocation.longitude,
      });
    }

    setShowLocationPicker(false);
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setSelectedLocation(newLocation);
      // Also center the map on current location
      setMapRegion({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a bounty');
      return;
    }

    if (!bountyData.title || !bountyData.description || !bountyData.payment || !bountyData.deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Get user wallet from database
      console.log('Getting user wallet from database...');
      const userWallet = await getUserWallet(user.id);
      
      if (!userWallet || !userWallet.wallet_data) {
        Alert.alert('Error', 'No wallet found. Please contact support.');
        setLoading(false);
        return;
      }

      // Debug wallet data structure
      debugWalletData(userWallet);
      
      // Validate wallet for transaction
      const validation = validateWalletForTransaction(userWallet);
      if (!validation.isValid) {
        Alert.alert('Error', `Wallet validation failed: ${validation.error}`);
        setLoading(false);
        return;
      }

      console.log('User wallet found:', userWallet.wallet_address);
      
      // Extract private key
      const privateKey = extractPrivateKey(userWallet);
      if (!privateKey) {
        Alert.alert('Error', 'Could not extract private key from wallet data.');
        setLoading(false);
        return;
      }
      
      // Convert deadline to Unix timestamp (assuming deadline is in days from now)
      const deadlineDays = parseInt(bountyData.deadline);
      if (isNaN(deadlineDays) || deadlineDays <= 0) {
        Alert.alert('Error', 'Please enter a valid deadline (number of days)');
        setLoading(false);
        return;
      }
      
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);
      console.log('Deadline calculation:', {
        input: bountyData.deadline,
        days: deadlineDays,
        timestamp: deadlineTimestamp,
        date: new Date(deadlineTimestamp * 1000).toISOString()
      });

      // Use the new managed bounty creation service
      console.log('🚀 Creating bounty with managed ID system...');
      const result = await createBountyWithManagedId({
        title: bountyData.title,
        description: bountyData.description,
        category: bountyData.category,
        payment: bountyData.payment,
        location_address: bountyData.location || undefined,
        location_lat: bountyData.location_lat || undefined,
        location_lng: bountyData.location_lng || undefined,
        deadline: deadlineTimestamp,
        requirements: ['Photo proof of completion'],
        userAddress: userWallet.wallet_address,
        userPrivateKey: privateKey,
        userId: user.id
      });

      if (result.success) {
        console.log('✅ Bounty created successfully:', result);
        
        Alert.alert(
          'Success! 🎉', 
          `Bounty created successfully!\n\nTitle: ${bountyData.title}\nAmount: ${bountyData.payment} STRK\nDeadline: ${bountyData.deadline} days\nOn-chain ID: ${result.onChainId}\n\nTransaction: ${result.transactionHash}`,
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        throw new Error(result.error || 'Unknown error occurred during bounty creation');
      }

    } catch (error) {
      console.error('Error creating bounty:', error);
      
      let errorMessage = 'Failed to create bounty. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient STRK balance')) {
          errorMessage = `🪙 Insufficient STRK Balance!\n\nYour wallet doesn't have enough STRK tokens to create this bounty.\n\n💡 Get test STRK tokens from:\n• Starknet Sepolia Faucet\n• StarkGate Testnet Bridge\n\nUse the Debug Screen to check your wallet address.`;
        } else {
          errorMessage = 'Failed to create bounty: ' + error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === bountyData.category);

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What do you need help with?</Text>
        <Text style={styles.stepSubtitle}>Describe your task and select a category</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Task Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Pick up prescription from CVS"
          value={bountyData.title}
          onChangeText={(text) => setBountyData({ ...bountyData, title: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Provide more details about what you need..."
          value={bountyData.description}
          onChangeText={(text) => setBountyData({ ...bountyData, description: text })}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                bountyData.category === category.id && styles.selectedCategory
              ]}
              onPress={() => setBountyData({ 
                ...bountyData, 
                category: category.id,
                payment: category.suggestedPrice 
              })}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <Text style={styles.categorySuggestion}>${category.suggestedPrice} suggested</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Location & Payment</Text>
        <Text style={styles.stepSubtitle}>Set the location and reward amount</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="location-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.textInputWithIcon}
            placeholder="Enter address or tap on map"
            value={bountyData.location}
            onChangeText={(text) => setBountyData({ ...bountyData, location: text })}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Payment</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="cash-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.textInputWithIcon}
              placeholder="0"
              value={bountyData.payment.toString()}
              onChangeText={(text) => setBountyData({ ...bountyData, payment: Number(text) })}
              keyboardType="numeric"
            />
          </View>
          {selectedCategory && (
            <Text style={styles.suggestion}>
              AI suggests: ${selectedCategory.suggestedPrice}
            </Text>
          )}
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Deadline (days)</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="time-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.textInputWithIcon}
              placeholder="e.g., 3"
              value={bountyData.deadline}
              onChangeText={(text) => setBountyData({ ...bountyData, deadline: text })}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.suggestion}>
            How many days from now?
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.mapPreview} onPress={handleLocationSelect}>
        {bountyData.location ? (
          <View style={styles.selectedLocationContainer}>
            <Ionicons name="location" size={24} color="#10B981" />
            <View style={styles.selectedLocationText}>
              <Text style={styles.selectedLocationTitle}>Location Selected</Text>
              <Text style={styles.selectedLocationAddress} numberOfLines={2}>
                {bountyData.location}
              </Text>
              <Text style={styles.coordinates}>
                {bountyData.location_lat.toFixed(6)}, {bountyData.location_lng.toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.mapPreviewPlaceholder}>
            <Ionicons name="map-outline" size={32} color="#9CA3AF" />
            <Text style={styles.mapPreviewText}>Tap to select location on map</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Final Details</Text>
        <Text style={styles.stepSubtitle}>Add requirements and confirm your bounty</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Requirements</Text>
        <View style={styles.requirementsList}>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.requirementText}>Photo proof of completion</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
            <Text style={styles.requirementText}>Text updates during task</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="receipt-outline" size={20} color="#9CA3AF" />
            <Text style={styles.requirementText}>Receipt or purchase proof</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Bounty Summary</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Task:</Text>
          <Text style={styles.summaryValue}>{bountyData.title}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Category:</Text>
          <Text style={styles.summaryValue}>
            {bountyData.category.replace('-', ' ')}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Payment:</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            ${bountyData.payment}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Location:</Text>
          <Text style={styles.summaryValue}>
            {bountyData.location || 'To be set'}
          </Text>
        </View>
      </View>

      <View style={styles.contractInfo}>
        <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
        <View style={styles.contractText}>
          <Text style={styles.contractTitle}>Smart Contract Deployment</Text>
          <Text style={styles.contractDescription}>
            Your payment will be locked in escrow until task completion. No gas fees required!
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Bounty</Text>
        <Text style={styles.stepIndicator}>Step {step}/3</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backFooterButton} onPress={handleBack}>
            <Text style={styles.backFooterButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && styles.fullWidthButton]}
          onPress={step === 3 ? handleSubmit : handleNext}
          disabled={loading || (step === 1 && (!bountyData.title || !bountyData.description))}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#3B82F6']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Creating Bounty...' : (step === 3 ? 'Create Bounty' : 'Next')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.locationPickerContainer}>
          <View style={styles.locationPickerHeader}>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.locationPickerTitle}>Select Location</Text>
            <TouchableOpacity onPress={confirmLocationSelection}>
              <Text style={styles.confirmLocationText}>Done</Text>
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.locationPickerMap}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onRegionChangeComplete={setMapRegion}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                draggable
                onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="location" size={32} color="#EF4444" />
                </View>
              </Marker>
            )}
          </MapView>

          <View style={styles.locationPickerFooter}>
            <TouchableOpacity style={styles.currentLocationButton} onPress={useCurrentLocation}>
              <Ionicons name="locate" size={20} color="#8B5CF6" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
            {selectedLocation && (
              <Text style={styles.selectedCoordinates}>
                Selected: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInputWithIcon: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  suggestion: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedCategory: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categorySuggestion: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapPreview: {
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  mapPreviewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPreviewText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedLocationText: {
    flex: 1,
    marginLeft: 12,
  },
  selectedLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#6B7280',
  },
  requirementsList: {
    marginTop: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contractInfo: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
  },
  contractText: {
    flex: 1,
    marginLeft: 12,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  contractDescription: {
    fontSize: 12,
    color: '#1D4ED8',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backFooterButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  backFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
  fullWidthButton: {
    marginLeft: 0,
  },
  nextButtonGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Location Picker Modal Styles
  locationPickerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  locationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  locationPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  confirmLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  locationPickerMap: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPickerFooter: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  selectedCoordinates: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});