import React from 'react';
import { Map, Briefcase, Trophy, User } from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeView, 
  onViewChange 
}) => {
  const navItems = [
    { id: 'map' as ViewType, icon: Map, label: 'Map' },
    { id: 'tasks' as ViewType, icon: Briefcase, label: 'My Tasks' },
    { id: 'achievements' as ViewType, icon: Trophy, label: 'Achievements' },
    { id: 'profile' as ViewType, icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
              activeView === id
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={24} className="mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};