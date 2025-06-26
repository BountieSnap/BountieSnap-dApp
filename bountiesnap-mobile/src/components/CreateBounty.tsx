import React, { useState } from 'react';
import { ArrowLeft, MapPin, DollarSign, Clock, Camera, CheckCircle } from 'lucide-react';

interface CreateBountyProps {
  onClose: () => void;
  onSubmit: (bountyData: any) => void;
}

export const CreateBounty: React.FC<CreateBountyProps> = ({ onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [bountyData, setBountyData] = useState({
    title: '',
    description: '',
    category: 'delivery',
    payment: 0,
    location: '',
    deadline: '',
    requirements: [] as string[]
  });

  const categories = [
    { id: 'delivery', label: 'Delivery', emoji: '🚚', suggestedPrice: 15 },
    { id: 'shopping', label: 'Shopping', emoji: '🛒', suggestedPrice: 25 },
    { id: 'pet-care', label: 'Pet Care', emoji: '🐕', suggestedPrice: 30 },
    { id: 'maintenance', label: 'Maintenance', emoji: '🔧', suggestedPrice: 40 },
    { id: 'other', label: 'Other', emoji: '📦', suggestedPrice: 20 }
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = () => {
    onSubmit(bountyData);
    onClose();
  };

  const selectedCategory = categories.find(cat => cat.id === bountyData.category);

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Create Bounty</h1>
          <div className="text-sm text-gray-500">Step {step}/3</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: What do you need? */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What do you need help with?</h2>
                <p className="text-gray-600">Describe your task and select a category</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g., Pick up prescription from CVS"
                  value={bountyData.title}
                  onChange={(e) => setBountyData({ ...bountyData, title: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Provide more details about what you need..."
                  value={bountyData.description}
                  onChange={(e) => setBountyData({ ...bountyData, description: e.target.value })}
                  rows={4}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setBountyData({ 
                        ...bountyData, 
                        category: category.id,
                        payment: category.suggestedPrice 
                      })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        bountyData.category === category.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{category.emoji}</div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-sm text-gray-500">${category.suggestedPrice} suggested</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Where and When? */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Location & Payment</h2>
                <p className="text-gray-600">Set the location and reward amount</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Enter address or tap on map"
                    value={bountyData.location}
                    onChange={(e) => setBountyData({ ...bountyData, location: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-4 text-gray-400" size={20} />
                    <input
                      type="number"
                      placeholder="0"
                      value={bountyData.payment}
                      onChange={(e) => setBountyData({ ...bountyData, payment: Number(e.target.value) })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {selectedCategory && (
                    <p className="text-sm text-gray-500 mt-1">
                      AI suggests: ${selectedCategory.suggestedPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-4 text-gray-400" size={20} />
                    <input
                      type="datetime-local"
                      value={bountyData.deadline}
                      onChange={(e) => setBountyData({ ...bountyData, deadline: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500">Tap to select location on map</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Requirements & Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Final Details</h2>
                <p className="text-gray-600">Add requirements and confirm your bounty</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" defaultChecked />
                    <span className="text-sm">Photo proof of completion</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm">Text updates during task</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm">Receipt or purchase proof</span>
                  </label>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Bounty Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Task:</span>
                    <span className="font-medium">{bountyData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{bountyData.category.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium text-green-600">${bountyData.payment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{bountyData.location || 'To be set'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <CheckCircle className="text-blue-600 mt-0.5 mr-3" size={20} />
                  <div>
                    <p className="font-medium text-blue-900">Smart Contract Deployment</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment will be locked in escrow until task completion. No gas fees required!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={step === 1 && (!bountyData.title || !bountyData.description)}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3 ? 'Create Bounty' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};