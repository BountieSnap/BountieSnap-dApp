import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useBounty } from '../context/BountyContext';
import { useContract } from '../hooks/useContract';
import { CreateBountyParams } from '../contracts/BountyContract';

export default function CreateBountyScreen({ navigation }: any) {
  const { createBounty } = useBounty();
  const { createBounty: createContractBounty, loading, error } = useContract();
  const [step, setStep] = useState(1);
  const [bountyData, setBountyData] = useState({
    title: '',
    description: '',
    category: 'delivery',
    payment: 0,
    location: '',
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

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!bountyData.title || !bountyData.description || !bountyData.payment || !bountyData.deadline) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Parse deadline to timestamp (assuming deadline is in format "MM/DD/YYYY" or similar)
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Default: 24 hours from now
      
      // Prepare contract parameters
      const contractParams: CreateBountyParams = {
        description: `${bountyData.title}: ${bountyData.description}`, // Combine title and description
        amount: bountyData.payment.toString(), // Amount in STRK
        deadline: deadlineTimestamp
      };

      console.log('Creating bounty on blockchain with params:', contractParams);

      // Create bounty on the smart contract
      const result = await createContractBounty(contractParams);
      
      console.log('Smart contract result:', result);

      // Also create locally for UI
      createBounty({
        ...bountyData,
        contractBountyId: result.bountyId,
        txHash: result.txHash,
      });

      Alert.alert(
        'Success!', 
        `Bounty created successfully!\n\nBounty ID: ${result.bountyId}\nTransaction: ${result.txHash?.slice(0, 10)}...`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error creating bounty:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to create bounty. Please try again.',
        [{ text: 'OK' }]
      );
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
          <Text style={styles.inputLabel}>Deadline</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="time-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.textInputWithIcon}
              placeholder="Set deadline"
              value={bountyData.deadline}
              onChangeText={(text) => setBountyData({ ...bountyData, deadline: text })}
            />
          </View>
        </View>
      </View>

      <View style={styles.mapPreview}>
        <Ionicons name="map-outline" size={32} color="#9CA3AF" />
        <Text style={styles.mapPreviewText}>Tap to select location on map</Text>
      </View>
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
          disabled={(step === 1 && (!bountyData.title || !bountyData.description)) || (step === 3 && loading)}
        >
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {step === 3 && loading ? 'Creating on Blockchain...' : (step === 3 ? 'Create Bounty' : 'Next')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  mapPreviewText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
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
});