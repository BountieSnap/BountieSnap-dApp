import React from 'react';
import { Settings, Edit3, Star, TrendingUp, Calendar, Award, DollarSign } from 'lucide-react';
import { User, Bounty } from '../types';

interface ProfileProps {
  user: User;
  recentTasks: Bounty[];
}

export const Profile: React.FC<ProfileProps> = ({ user, recentTasks }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStreakDays = () => {
    // Simulate activity streak
    return 12;
  };

  const completedTasks = recentTasks.filter(task => task.status === 'completed');
  const averageRating = user.rating;

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <Settings size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center mb-6">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl border-4 border-white/20"
            />
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <Edit3 size={14} />
            </button>
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="flex items-center mt-1">
              <Star className="text-yellow-300 fill-current mr-1" size={16} />
              <span className="font-medium">{user.rating.toFixed(1)}</span>
              <span className="text-white/70 ml-2">({user.completedTasks} tasks)</span>
            </div>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
              {user.role === 'both' ? 'Seeker & Hunter' : user.role}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(user.totalEarned)}</div>
            <div className="text-white/70 text-sm">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.completedTasks}</div>
            <div className="text-white/70 text-sm">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getStreakDays()}</div>
            <div className="text-white/70 text-sm">Day Streak</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Performance Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="text-green-500 mr-2" size={20} />
            Performance
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Average Rating</span>
                <span className="font-semibold text-gray-900">{averageRating.toFixed(1)}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                  style={{ width: `${(averageRating / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Completion Rate</span>
                <span className="font-semibold text-gray-900">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full w-[94%]"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">2.3h</div>
              <div className="text-sm text-gray-500">Avg. Task Time</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">8.2</div>
              <div className="text-sm text-gray-500">Response Time (min)</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="text-blue-500 mr-2" size={20} />
            Recent Activity
          </h3>
          
          {completedTasks.length > 0 ? (
            <div className="space-y-4">
              {completedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="text-green-600" size={16} />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign size={14} />
                    {task.payment}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-300 mb-3" size={32} />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>

        {/* Settings Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            
            <div className="space-y-1">
              {[
                { label: 'Edit Profile', icon: Edit3 },
                { label: 'Payment Methods', icon: DollarSign },
                { label: 'Notifications', icon: Settings },
                { label: 'Privacy & Security', icon: Settings },
                { label: 'Help & Support', icon: Settings }
              ].map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    <item.icon className="text-gray-400 mr-3" size={20} />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <div className="text-gray-400">›</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};