import React, { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { Bounty } from '../types';
import { BountyCard } from './BountyCard';

interface MapViewProps {
  bounties: Bounty[];
  onCreateBounty: () => void;
  onAcceptBounty: (bountyId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ 
  bounties, 
  onCreateBounty, 
  onAcceptBounty 
}) => {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [showBountyList, setShowBountyList] = useState(false);

  const handlePinClick = (bounty: Bounty) => {
    setSelectedBounty(bounty);
  };

  return (
    <div className="relative h-full">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
        {/* Simulated Map Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-12 h-full">
            {Array.from({ length: 96 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Location Pins */}
        {bounties.map((bounty, index) => (
          <div
            key={bounty.id}
            className={`absolute animate-bounce cursor-pointer transform-gpu ${
              index === 0 ? 'top-1/3 left-1/4' :
              index === 1 ? 'top-1/2 right-1/3' :
              'bottom-1/3 left-1/2'
            }`}
            onClick={() => handlePinClick(bounty)}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-full shadow-lg border-4 border-white flex items-center justify-center text-white font-bold ${
                bounty.status === 'open' ? 'bg-red-500' :
                bounty.status === 'accepted' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                ${bounty.payment}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            </div>
          </div>
        ))}

        {/* User Location */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search nearby bounties..."
              className="flex-1 outline-none text-gray-700"
            />
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Filter className="text-gray-400" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Create Button */}
      <button
        onClick={onCreateBounty}
        className="absolute bottom-24 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <Plus size={28} />
      </button>

      {/* Toggle List View Button */}
      <button
        onClick={() => setShowBountyList(!showBountyList)}
        className="absolute bottom-24 left-6 bg-white text-gray-700 px-4 py-3 rounded-2xl shadow-sm border border-gray-100 font-medium hover:shadow-md transition-all duration-200"
      >
        {showBountyList ? 'Map View' : 'List View'}
      </button>

      {/* Bounty List Overlay */}
      {showBountyList && (
        <div className="absolute inset-0 bg-white z-20">
          <div className="p-4 h-full overflow-y-auto pb-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nearby Bounties</h2>
              <button
                onClick={() => setShowBountyList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {bounties.map((bounty) => (
                <BountyCard
                  key={bounty.id}
                  bounty={bounty}
                  onAccept={onAcceptBounty}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Bounty Modal */}
      {selectedBounty && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end z-30">
          <div className="bg-white rounded-t-3xl p-6 w-full max-h-2/3 overflow-y-auto">
            <div className="w-12 h-1 bg-gray-300 mx-auto mb-6 rounded-full"></div>
            <BountyCard
              bounty={selectedBounty}
              onAccept={onAcceptBounty}
            />
            <button
              onClick={() => setSelectedBounty(null)}
              className="mt-4 w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};