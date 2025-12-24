import React from 'react';

const ProfileCompletionPrompt = ({ onComplete, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Your Profile
          </h3>
        </div>
        
        {/* Message */}
        <div className="px-6 pb-6">
          <p className="text-gray-600">
            Students can't see you yet. Complete your profile to start receiving messages and bookings.
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition font-medium"
          >
            Later
          </button>
          <button
            onClick={onComplete}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            Complete Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPrompt;