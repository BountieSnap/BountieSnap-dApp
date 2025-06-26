import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Bounty, Achievement } from '../types';
import { mockBounties, currentUser, mockAchievements } from '../utils/mockData';

interface BountyContextType {
  bounties: Bounty[];
  userTasks: Bounty[];
  user: User;
  achievements: Achievement[];
  acceptBounty: (bountyId: string) => void;
  completeTask: (taskId: string, proofImage: string) => void;
  createBounty: (bountyData: any) => void;
}

const BountyContext = createContext<BountyContextType | undefined>(undefined);

export const BountyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bounties, setBounties] = useState(mockBounties);
  const [userTasks, setUserTasks] = useState(mockBounties);
  const [user, setUser] = useState(currentUser);
  const [achievements, setAchievements] = useState(mockAchievements);

  const acceptBounty = (bountyId: string) => {
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
  };

  const completeTask = (taskId: string, proofImage: string) => {
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

    const completedTask = userTasks.find(task => task.id === taskId);
    if (completedTask) {
      setUser(prev => ({
        ...prev,
        completedTasks: prev.completedTasks + 1,
        totalEarned: prev.totalEarned + completedTask.payment
      }));

      // Update achievements
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
    }
  };

  const createBounty = (bountyData: any) => {
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

  return (
    <BountyContext.Provider value={{
      bounties,
      userTasks,
      user,
      achievements,
      acceptBounty,
      completeTask,
      createBounty
    }}>
      {children}
    </BountyContext.Provider>
  );
};

export const useBounty = () => {
  const context = useContext(BountyContext);
  if (context === undefined) {
    throw new Error('useBounty must be used within a BountyProvider');
  }
  return context;
};