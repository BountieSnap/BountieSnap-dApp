import { User, Bounty, Achievement } from '../types';

export const currentUser: User = {
  id: '1',
  name: 'Alex Hunter',
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  rating: 4.8,
  completedTasks: 47,
  totalEarned: 1250.50,
  achievements: [],
  role: 'both'
};

export const mockBounties: Bounty[] = [
  {
    id: '1',
    title: 'Pick up prescription from CVS',
    description: 'Need someone to pick up my heart medication. Very urgent!',
    category: 'delivery',
    payment: 15,
    location: { lat: 40.7128, lng: -74.0060, address: 'CVS Pharmacy, 123 Main St' },
    deadline: '2025-01-10T18:00:00Z',
    status: 'open',
    seeker: {
      id: '2',
      name: 'Margaret Smith',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.9,
      completedTasks: 23,
      totalEarned: 450,
      achievements: [],
      role: 'seeker'
    },
    createdAt: '2025-01-10T14:30:00Z',
    requirements: ['Photo of receipt', 'Text when arriving']
  },
  {
    id: '2',
    title: 'Walk my golden retriever',
    description: 'Max needs a 30-minute walk around the neighborhood. He\'s very friendly!',
    category: 'pet-care',
    payment: 25,
    location: { lat: 40.7589, lng: -73.9851, address: 'Central Park, Dog Run Area' },
    deadline: '2025-01-10T20:00:00Z',
    status: 'open',
    seeker: {
      id: '3',  
      name: 'Jake Wilson',
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.7,
      completedTasks: 18,
      totalEarned: 320,
      achievements: [],
      role: 'seeker'
    },
    createdAt: '2025-01-10T13:15:00Z',
    requirements: ['Photo with Max', 'GPS tracking enabled']
  },
  {
    id: '3',
    title: 'Grocery shopping at Whole Foods',
    description: 'Need organic vegetables and fruits for tonight\'s dinner party. List provided.',
    category: 'shopping',
    payment: 30,
    location: { lat: 40.7505, lng: -73.9934, address: 'Whole Foods, 456 Broadway' },
    deadline: '2025-01-10T17:00:00Z',
    status: 'accepted',
    seeker: {
      id: '4',
      name: 'Emma Davis',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.6,
      completedTasks: 31,
      totalEarned: 720,
      achievements: [],
      role: 'seeker'
    },
    hunter: currentUser,
    createdAt: '2025-01-10T12:45:00Z',
    requirements: ['Receipt photo', 'Quality check photos']
  }
];

export const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Speed Demon',
    description: 'Complete 10 deliveries in under 30 minutes',
    icon: '🚗',
    category: 'speed',
    rarity: 'rare',
    unlockedAt: '2025-01-05T10:30:00Z'
  },
  {
    id: '2',
    title: 'Shopping Pro',
    description: 'Make 25 perfect purchases',
    icon: '🛒',
    category: 'shopping',
    rarity: 'epic',
    progress: { current: 18, total: 25 }
  },
  {
    id: '3',
    title: 'Pet Whisperer',
    description: 'Walk 50 happy pets',
    icon: '🐕',
    category: 'pets',
    rarity: 'common',
    unlockedAt: '2025-01-08T16:20:00Z'
  },
  {
    id: '4',
    title: '5-Star Hunter',
    description: 'Maintain perfect rating for 1 month',
    icon: '⭐',
    category: 'rating',
    rarity: 'legendary',
    progress: { current: 23, total: 30 }
  },
  {
    id: '5',
    title: 'Local Hero',
    description: 'Help 100 neighbors',
    icon: '🌟',
    category: 'community',
    rarity: 'legendary',
    progress: { current: 47, total: 100 }
  }
];