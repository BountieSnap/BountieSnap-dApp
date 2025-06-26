import React from 'react';
import { Trophy, Star, Lock, CheckCircle } from 'lucide-react';
import { Achievement, User } from '../types';

interface AchievementsProps {
  achievements: Achievement[];
  user: User;
}

export const Achievements: React.FC<AchievementsProps> = ({ achievements, user }) => {
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const inProgressAchievements = achievements.filter(a => a.progress && !a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.progress && !a.unlockedAt);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const AchievementCard: React.FC<{ achievement: Achievement; isUnlocked: boolean; isInProgress: boolean }> = ({
    achievement,
    isUnlocked,
    isInProgress
  }) => (
    <div className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
      isUnlocked ? getRarityBorder(achievement.rarity) : 'border-gray-200'
    } ${!isUnlocked && !isInProgress ? 'opacity-60' : ''}`}>
      
      {/* Rarity Glow Effect */}
      {isUnlocked && (
        <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(achievement.rarity)} opacity-10 rounded-2xl`}></div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
              isUnlocked ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white` : 'bg-gray-100'
            }`}>
              {isUnlocked ? achievement.icon : <Lock className="text-gray-400" size={24} />}
            </div>
            <div className="ml-4">
              <h3 className={`font-bold text-lg ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                {achievement.title}
              </h3>
              <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                {achievement.description}
              </p>
            </div>
          </div>
          
          {isUnlocked && (
            <div className="flex items-center text-green-600">
              <CheckCircle size={20} />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isInProgress && achievement.progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{achievement.progress.current}/{achievement.progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Rarity Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
            isUnlocked
              ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`
              : 'bg-gray-100 text-gray-500'
          }`}>
            {achievement.rarity}
          </span>
          
          {isUnlocked && achievement.unlockedAt && (
            <span className="text-xs text-gray-500">
              Unlocked {formatDate(achievement.unlockedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
          <Trophy className="text-yellow-500" size={28} />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{unlockedAchievements.length}</div>
            <div className="text-sm text-gray-500">Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{inProgressAchievements.length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{lockedAchievements.length}</div>
            <div className="text-sm text-gray-500">Locked</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="text-yellow-500 mr-2" size={20} />
              Unlocked Achievements
            </h2>
            <div className="space-y-4">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={true}
                  isInProgress={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Achievements */}
        {inProgressAchievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              In Progress
            </h2>
            <div className="space-y-4">
              {inProgressAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                  isInProgress={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="text-gray-400 mr-2" size={20} />
              Locked
            </h2>
            <div className="space-y-4">
              {lockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                  isInProgress={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {achievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Yet</h3>
            <p className="text-gray-500">Complete tasks to start earning achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
};