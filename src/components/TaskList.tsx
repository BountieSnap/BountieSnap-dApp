import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, Upload } from 'lucide-react';
import { Bounty } from '../types';
import { BountyCard } from './BountyCard';

interface TaskListProps {
  userTasks: Bounty[];
  onCompleteTask: (taskId: string, proofImage: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ userTasks, onCompleteTask }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'posted'>('active');
  const [uploadingTask, setUploadingTask] = useState<string | null>(null);

  const activeTasks = userTasks.filter(task => task.status === 'accepted');
  const completedTasks = userTasks.filter(task => task.status === 'completed');
  const postedTasks = userTasks.filter(task => task.seeker.id === '1'); // Current user's posted bounties

  const handleFileUpload = (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate upload and task completion
      const reader = new FileReader();
      reader.onload = (e) => {
        const proofImage = e.target?.result as string;
        onCompleteTask(taskId, proofImage);
        setUploadingTask(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'active' as const, label: 'Active', count: activeTasks.length },
    { id: 'completed' as const, label: 'Completed', count: completedTasks.length },
    { id: 'posted' as const, label: 'Posted', count: postedTasks.length }
  ];

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'active': return activeTasks;
      case 'completed': return completedTasks;
      case 'posted': return postedTasks;
      default: return [];
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Tasks</h1>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {getCurrentTasks().length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'active' && <Clock className="text-gray-400" size={24} />}
              {activeTab === 'completed' && <CheckCircle className="text-gray-400" size={24} />}
              {activeTab === 'posted' && <Calendar className="text-gray-400" size={24} />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'active' && 'No Active Tasks'}
              {activeTab === 'completed' && 'No Completed Tasks'}
              {activeTab === 'posted' && 'No Posted Bounties'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'active' && 'Accept some bounties to start earning!'}
              {activeTab === 'completed' && 'Complete some tasks to see them here.'}
              {activeTab === 'posted' && 'Create your first bounty to get help.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getCurrentTasks().map((task) => (
              <div key={task.id} className="relative">
                <BountyCard bounty={task} showStatus />
                
                {/* Active Task Actions */}
                {activeTab === 'active' && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Complete Task</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(task.id, e)}
                        className="hidden"
                        id={`upload-${task.id}`}
                      />
                      <label
                        htmlFor={`upload-${task.id}`}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-green-700 transition-colors"
                      >
                        <Upload size={16} />
                        Upload Proof
                      </label>
                      {uploadingTask === task.id && (
                        <span className="text-gray-500 text-sm">Uploading...</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a photo showing task completion
                    </p>
                  </div>
                )}

                {/* Completed Task Proof */}
                {activeTab === 'completed' && task.proofImage && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Completion Proof</h4>
                    <img
                      src={task.proofImage}
                      alt="Task completion proof"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};