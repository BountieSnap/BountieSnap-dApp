export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  completedTasks: number;
  totalEarned: number;
  achievements: Achievement[];
  role: 'seeker' | 'hunter' | 'both';
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: 'delivery' | 'shopping' | 'pet-care' | 'maintenance' | 'other';
  payment: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  deadline: string;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  seeker: User;
  hunter?: User;
  proofImage?: string;
  createdAt: string;
  requirements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'speed' | 'shopping' | 'pets' | 'rating' | 'community';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export type ViewType = 'map' | 'tasks' | 'achievements' | 'profile';