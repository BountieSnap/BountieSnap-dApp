import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useBounty } from '../context/BountyContext';
import BountyCard from '../components/BountyCard';

export default function TasksScreen({ navigation }: any) {
  const { userTasks, completeTask } = useBounty();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'posted'>('active');

  const activeTasks = userTasks.filter(task => task.status === 'accepted');
  const completedTasks = userTasks.filter(task => task.status === 'completed');
  const postedTasks = userTasks.filter(task => task.seeker.id === '1');

  const handleCompleteTask = async (taskId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to upload proof');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      completeTask(taskId, result.assets[0].uri);
      Alert.alert('Success', 'Task completed successfully!');
    }
  };

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'active': return activeTasks;
      case 'completed': return completedTasks;
      case 'posted': return postedTasks;
      default: return [];
    }
  };

  const tabs = [
    { id: 'active' as const, label: 'Active', count: activeTasks.length },
    { id: 'completed' as const, label: 'Completed', count: completedTasks.length },
    { id: 'posted' as const, label: 'Posted', count: postedTasks.length }
  ];

  const getEmptyStateIcon = () => {
    switch (activeTab) {
      case 'active': return 'time-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'posted': return 'calendar-outline';
      default: return 'help-outline';
    }
  };

  const getEmptyStateTitle = () => {
    switch (activeTab) {
      case 'active': return 'No Active Tasks';
      case 'completed': return 'No Completed Tasks';
      case 'posted': return 'No Posted Bounties';
      default: return 'No Tasks';
    }
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'active': return 'Accept some bounties to start earning!';
      case 'completed': return 'Complete some tasks to see them here.';
      case 'posted': return 'Create your first bounty to get help.';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Tasks</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('BountiesList')}
          >
            <Ionicons name="search-outline" size={20} color="#8B5CF6" />
            <Text style={styles.browseButtonText}>Browse</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getCurrentTasks().length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name={getEmptyStateIcon()} size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>{getEmptyStateTitle()}</Text>
            <Text style={styles.emptyMessage}>{getEmptyStateMessage()}</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {getCurrentTasks().map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <BountyCard bounty={task} showStatus />
                
                {/* Active Task Actions */}
                {activeTab === 'active' && (
                  <View style={styles.taskActions}>
                    <Text style={styles.actionTitle}>Complete Task</Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => handleCompleteTask(task.id)}
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color="white" />
                      <Text style={styles.uploadButtonText}>Upload Proof</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionHint}>
                      Upload a photo showing task completion
                    </Text>
                  </View>
                )}
              </View>
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
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  taskList: {
    padding: 16,
  },
  taskItem: {
    marginBottom: 16,
  },
  taskActions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});