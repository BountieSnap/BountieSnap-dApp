import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Bounty, Achievement } from '../types';
import { mockAchievements } from '../utils/mockData';
import { 
  getBounties, 
  getBountyApplications, 
  getUserBountyApplications,
  updateBountyStatus,
  createBountyApplication,
  getUserWallet,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  Bounty as DbBounty,
  BountyApplication,
  UserProfile 
} from '../utils/supabase';
import { useAuth } from './AuthContext';

interface BountyContextType {
  bounties: Bounty[];
  userTasks: Bounty[];
  user: User;
  achievements: Achievement[];
  loading: boolean;
  acceptBounty: (bountyId: string) => void;
  completeTask: (taskId: string, proofImage: string) => void;
  createBounty: (bountyData: any) => void;
  refreshData: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateAvatar: (imageUri: string) => Promise<void>;
}

const BountyContext = createContext<BountyContextType | undefined>(undefined);

// Transform database bounty to UI bounty format
const transformDbBountyToUiBounty = (dbBounty: DbBounty): Bounty => {
  // Map database status to UI status
  const mapStatus = (dbStatus: DbBounty['status']): Bounty['status'] => {
    switch (dbStatus) {
      case 'in_progress':
        return 'accepted'; // Map in_progress to accepted for UI
      case 'open':
      case 'accepted':
      case 'completed':
      case 'cancelled':
        return dbStatus; // These match UI types directly
      default:
        return 'open'; // Default fallback for any unrecognized status
    }
  };

  return {
    id: dbBounty.id,
    title: dbBounty.title,
    description: dbBounty.description,
    category: (dbBounty.category as 'delivery' | 'shopping' | 'pet-care' | 'maintenance' | 'other') || 'other',
    payment: dbBounty.payment || dbBounty.amount_strk || 0,
    location: {
      lat: dbBounty.location_lat || 40.7128,
      lng: dbBounty.location_lng || -74.0060,
      address: dbBounty.location_address || 'Location to be confirmed'
    },
    deadline: dbBounty.deadline,
    status: mapStatus(dbBounty.status),
    seeker: {
      id: dbBounty.creator_id,
      name: 'User', // We'll need to fetch user profiles later
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.8,
      completedTasks: 0,
      totalEarned: 0,
      achievements: [],
      role: 'seeker'
    },
    hunter: undefined, // We'll populate this based on applications
    proofImage: dbBounty.proof_image,
    createdAt: dbBounty.created_at,
    requirements: dbBounty.requirements || ['Photo proof of completion']
  };
};

export const BountyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [userTasks, setUserTasks] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState(mockAchievements);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Create user object from profile data
  const user: User = {
    id: authUser?.id || '1',
    name: userProfile?.full_name || authUser?.email?.split('@')[0] || 'User',
    avatar: userProfile?.avatar_url || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    rating: 4.8,
    completedTasks: userTasks.filter(task => task.status === 'completed').length,
    totalEarned: userTasks.filter(task => task.status === 'completed').reduce((sum, task) => sum + task.payment, 0),
    achievements: [],
    role: 'both'
  };

  const loadUserProfile = async () => {
    if (!authUser?.id) return;
    
    try {
      const profile = await getUserProfile(authUser.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadBounties = async () => {
    try {
      const dbBounties = await getBounties();
      const transformedBounties = dbBounties.map(transformDbBountyToUiBounty);
      setBounties(transformedBounties);
    } catch (error) {
      console.error('Error loading bounties:', error);
    }
  };

  const loadUserTasks = async () => {
    if (!authUser?.id) return;
    
    try {
      // Get bounties created by the user
      const createdBounties = await getBounties();
      const userCreatedBounties = createdBounties.filter(bounty => bounty.creator_id === authUser.id);
      
      // Get bounty applications by the user
      const userApplications = await getUserBountyApplications(authUser.id);
      
      // Get bounties where user has applied/been accepted
      const appliedBountyIds = userApplications.map(app => app.bounty_id);
      const appliedBounties = createdBounties.filter(bounty => appliedBountyIds.includes(bounty.id));
      
      // Transform and combine all user tasks
      const allUserBounties = [...userCreatedBounties, ...appliedBounties];
      const uniqueBounties = allUserBounties.filter((bounty, index, self) => 
        index === self.findIndex(b => b.id === bounty.id)
      );
      
      // Transform to UI format and set status based on applications
      const transformedTasks = await Promise.all(
        uniqueBounties.map(async (dbBounty) => {
          const uiBounty = transformDbBountyToUiBounty(dbBounty);
          
          // Check if user applied to this bounty
          const userApplication = userApplications.find(app => app.bounty_id === dbBounty.id);
          if (userApplication) {
            // Map application status to bounty status
            if (userApplication.status === 'approved') {
              uiBounty.status = 'accepted';
            } else if (userApplication.status === 'completed') {
              uiBounty.status = 'completed';
            }
            
            // Add hunter info if user is the hunter
            if (userApplication.hunter_id === authUser.id) {
              uiBounty.hunter = {
                id: authUser.id,
                name: authUser.email?.split('@')[0] || 'Hunter',
                avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
                rating: 4.8,
                completedTasks: 0,
                totalEarned: 0,
                achievements: [],
                role: 'hunter'
              };
            }
          }
          
          return uiBounty;
        })
      );
      
      setUserTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading user tasks:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadUserProfile(), loadBounties(), loadUserTasks()]);
    setLoading(false);
  };

  useEffect(() => {
    if (authUser) {
      refreshData();
    }
  }, [authUser]);

  const acceptBounty = async (bountyId: string) => {
    if (!authUser?.id) return;
    
    try {
      // Get user wallet for the application
      const userWallet = await getUserWallet(authUser.id);
      if (!userWallet) {
        throw new Error('User wallet not found');
      }

      // Create bounty application in database
      await createBountyApplication({
        bounty_id: bountyId,
        hunter_id: authUser.id,
        stake_amount: '100000000000000000', // 0.1 STRK in wei
        wallet_address: userWallet.wallet_address
      });

      // Update local state
      setBounties(prev => prev.map(bounty => 
        bounty.id === bountyId
          ? { 
              ...bounty, 
              status: 'accepted' as const, 
              hunter: {
                id: authUser.id,
                name: authUser.email?.split('@')[0] || 'Hunter',
                avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
                rating: 4.8,
                completedTasks: 0,
                totalEarned: 0,
                achievements: [],
                role: 'hunter'
              }
            }
          : bounty
      ));
      
      // Refresh user tasks to include the newly accepted bounty
      await loadUserTasks();
      
    } catch (error) {
      console.error('Error accepting bounty:', error);
      throw error;
    }
  };

  const completeTask = async (taskId: string, proofImage: string) => {
    try {
      // Update bounty status in database
      await updateBountyStatus(taskId, 'completed');
      
      // Update local state
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

      // Update achievements (keep existing logic)
      const completedTask = userTasks.find(task => task.id === taskId);
      if (completedTask) {
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
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  const createBounty = async (bountyData: any) => {
    // This would integrate with the existing bounty creation service
    // For now, just refresh the data to pick up new bounties
    await refreshData();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authUser?.id) return;
    
    try {
      const updatedProfile = await updateUserProfile(authUser.id, updates);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateAvatarHandler = async (imageUri: string) => {
    if (!authUser?.id) return;
    
    try {
      // Upload image and get URL
      const avatarUrl = await uploadAvatar(authUser.id, imageUri);
      
      // Update profile with new avatar URL
      await updateProfile({ avatar_url: avatarUrl });
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  };

  return (
    <BountyContext.Provider value={{
      bounties,
      userTasks,
      user,
      achievements,
      loading,
      acceptBounty,
      completeTask,
      createBounty,
      refreshData,
      updateProfile,
      updateAvatar: updateAvatarHandler
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