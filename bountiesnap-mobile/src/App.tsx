import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { MapView } from './components/MapView';
import { TaskList } from './components/TaskList';
import { Achievements } from './components/Achievements';
import { Profile } from './components/Profile';
import { CreateBounty } from './components/CreateBounty';
import { BottomNavigation } from './components/BottomNavigation';
import { ViewType, Bounty } from './types';
import { mockBounties, currentUser, mockAchievements } from './utils/mockData';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('map');
  const [bounties, setBounties] = useState(mockBounties);
  const [userTasks, setUserTasks] = useState(mockBounties);
  const [showCreateBounty, setShowCreateBounty] = useState(false);
  const [user, setUser] = useState(currentUser);
  const [achievements, setAchievements] = useState(mockAchievements);

  const handleAcceptBounty = (bountyId: string) => {
    setBounties(prev => prev.map(bounty => 
      bounty.id === bountyId
        ? { ...bounty, status: 'accepted' as const, hunter: currentUser }
        : bounty
    ));
    
    setUserTasks(prev => prev.map(task =>
      task.id === bountyId
        ? { ...task, status: 'accepted' as const, hunter: currentUser }
        : task
    ));

    // Show success notification
    console.log('Bounty accepted successfully!');
  };

  const handleCompleteTask = (taskId: string, proofImage: string) => {
    setBounties(prev => prev.map(bounty =>
      bounty.id === taskId
        ? { ...bounty, status: 'completed' as const, proofImage }
        : bounty
    ));

    setUserTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: 'completed' as const, proofImage }
        : task
    ));

    // Update user stats
    const completedTask = userTasks.find(task => task.id === taskId);
    if (completedTask) {
      setUser(prev => ({
        ...prev,
        completedTasks: prev.completedTasks + 1,
        totalEarned: prev.totalEarned + completedTask.payment
      }));

      // Check for achievement unlocks
      checkAchievementProgress(completedTask);
    }
  };

  const checkAchievementProgress = (completedTask: Bounty) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.category === 'community' && achievement.progress) {
        const newProgress = Math.min(achievement.progress.current + 1, achievement.progress.total);
        return {
          ...achievement,
          progress: { ...achievement.progress, current: newProgress },
          unlockedAt: newProgress === achievement.progress.total ? new Date().toISOString() : achievement.unlockedAt
        };
      }
      return achievement;
    }));
  };

  const handleCreateBounty = (bountyData: any) => {
    const newBounty: Bounty = {
      id: Date.now().toString(),
      title: bountyData.title,
      description: bountyData.description,
      category: bountyData.category,
      payment: bountyData.payment,
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.01,
        lng: -74.0060 + (Math.random() - 0.5) * 0.01,
        address: bountyData.location || 'Location to be confirmed'
      },
      deadline: bountyData.deadline,
      status: 'open',
      seeker: currentUser,
      createdAt: new Date().toISOString(),
      requirements: bountyData.requirements || ['Photo proof of completion']
    };

    setBounties(prev => [newBounty, ...prev]);
    setUserTasks(prev => [newBounty, ...prev]);
  };

  const renderCurrentView = () => {
    switch (activeView) {
      case 'map':
        return (
          <MapView
            bounties={bounties.filter(b => b.status === 'open')}
            onCreateBounty={() => setShowCreateBounty(true)}
            onAcceptBounty={handleAcceptBounty}
          />
        );
      case 'tasks':
        return (
          <TaskList
            userTasks={userTasks}
            onCompleteTask={handleCompleteTask}
          />
        );
      case 'achievements':
        return (
          <Achievements
            achievements={achievements}
            user={user}
          />
        );
      case 'profile':
        return (
          <Profile
            user={user}
            recentTasks={userTasks.slice(0, 3)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderCurrentView()}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Create Bounty Modal */}
      {showCreateBounty && (
        <CreateBounty
          onClose={() => setShowCreateBounty(false)}
          onSubmit={handleCreateBounty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
});

export default App;