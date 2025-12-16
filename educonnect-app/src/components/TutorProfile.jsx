import React, { useState, useEffect } from 'react';
import { User, BookOpen, Clock, Globe, DollarSign, Star, Edit2, Save, X } from 'lucide-react';

const TutorProfile = ({ onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    expertise: [],
    bio: '',
    hourly_rate: '',
    languages: [],
    availability: {},
    teaching_style: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://hult.onrender.com/api/tutor/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
        setFormData({
          expertise: data.profile.expertise || [],
          bio: data.profile.bio || '',
          hourly_rate: data.profile.hourly_rate || '',
          languages: data.profile.languages || [],
          availability: data.profile.availability || {},
          teaching_style: data.profile.teaching_style || 'adaptive'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://hult.onrender.com/api/tutor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        setEditing(false);
        fetchProfile();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tutor Profile</h2>
                <p className="text-green-100 text-sm">Manage your teaching profile</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!profile ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No profile found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <Star className="text-yellow-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-gray-800">{profile.rating}</p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <BookOpen className="text-blue-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-gray-800">{profile.total_sessions}</p>
                  <p className="text-xs text-gray-600">Sessions</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <DollarSign className="text-green-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-gray-800">${profile.hourly_rate || 0}</p>
                  <p className="text-xs text-gray-600">Per Hour</p>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Bio</h3>
                {editing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Tell students about yourself..."
                  />
                ) : (
                  <p className="text-gray-700">{profile.bio || 'No bio yet'}</p>
                )}
              </div>

              {/* Expertise */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Expertise</h3>
                {editing ? (
                  <input
                    type="text"
                    value={formData.expertise.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      expertise: e.target.value.split(',').map(s => s.trim())
                    })}
                    placeholder="Math, Physics, Programming"
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map((subject, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Globe size={20} className="text-green-600" />
                  Languages
                </h3>
                {editing ? (
                  <input
                    type="text"
                    value={formData.languages.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      languages: e.target.value.split(',').map(l => l.trim())
                    })}
                    placeholder="English, Spanish"
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((lang, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Clock size={20} className="text-green-600" />
                  Availability
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.availability).filter(([k, v]) => v).map(([time], idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
                      {time}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hourly Rate */}
              {editing && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Hourly Rate ($)</h3>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="25"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {profile && (
          <div className="p-6 border-t flex justify-end gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Edit2 size={20} />
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorProfile;
