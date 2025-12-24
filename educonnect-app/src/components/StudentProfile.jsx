import React, { useState, useEffect } from 'react';
import { User, BookOpen, Clock, Globe, Edit2, Save, X, Mail, Phone, MapPin, Calendar, Award, TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StudentProfile = ({ onClose }) => {
  const [profile, setProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    // User info
    full_name: '',
    email: '',
    phone: '',
    location: '',
    date_of_birth: '',
    bio: '',
    
    // Learning profile
    learning_style: '',
    preferred_subjects: [],
    skill_level: '',
    learning_goals: '',
    available_time: '',
    preferred_languages: [],
    
    // Detailed preferences
    motivation_level: 5,
    weekly_study_hours: '',
    preferred_session_length: '60',
    learning_pace: 'moderate',
    
    // Skills assessment
    math_score: 5,
    science_score: 5,
    language_score: 5,
    tech_score: 5
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user info
      const userResponse = await fetch(`${API_URL}/api/user/info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();
      
      // Fetch student profile
      const profileResponse = await fetch(`${API_URL}/api/student/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileResponse.json();
      
      setUserInfo(userData.user);
      setProfile(profileData.profile);
      
      // Populate form with existing data
      if (profileData.profile) {
        setFormData({
          full_name: userData.user?.full_name || '',
          email: userData.user?.email || '',
          phone: userData.user?.phone || '',
          location: userData.user?.location || '',
          date_of_birth: userData.user?.date_of_birth || '',
          bio: profileData.profile.bio || '',
          
          learning_style: profileData.profile.learning_style || '',
          preferred_subjects: profileData.profile.preferred_subjects || [],
          skill_level: profileData.profile.skill_level || '',
          learning_goals: profileData.profile.learning_goals || '',
          available_time: profileData.profile.available_time || '',
          preferred_languages: profileData.profile.preferred_languages || [],
          
          motivation_level: profileData.profile.motivation_level || 5,
          weekly_study_hours: profileData.profile.weekly_study_hours || '',
          preferred_session_length: profileData.profile.preferred_session_length || '60',
          learning_pace: profileData.profile.learning_pace || 'moderate',
          
          math_score: profileData.profile.math_score || 5,
          science_score: profileData.profile.science_score || 5,
          language_score: profileData.profile.language_score || 5,
          tech_score: profileData.profile.tech_score || 5
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Update user info
      await fetch(`${API_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          date_of_birth: formData.date_of_birth
        })
      });
      
      // Update student profile
      const response = await fetch(`${API_URL}/api/student/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: formData.bio,
          learning_style: formData.learning_style,
          preferred_subjects: formData.preferred_subjects,
          skill_level: formData.skill_level,
          learning_goals: formData.learning_goals,
          available_time: formData.available_time,
          preferred_languages: formData.preferred_languages,
          motivation_level: formData.motivation_level,
          weekly_study_hours: formData.weekly_study_hours,
          preferred_session_length: formData.preferred_session_length,
          learning_pace: formData.learning_pace,
          math_score: formData.math_score,
          science_score: formData.science_score,
          language_score: formData.language_score,
          tech_score: formData.tech_score
        })
      });

      if (response.ok) {
        alert('✅ Profile updated successfully!');
        setEditing(false);
        fetchProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action cannot be undone!\n\n' +
      'This will permanently delete:\n' +
      '• Your profile and account\n' +
      '• All your enrollments\n' +
      '• Your learning progress\n' +
      '• All your messages\n\n' +
      'Are you absolutely sure you want to delete your account?'
    );
    
    if (!confirmed) return;
    
    const doubleCheck = window.prompt('Type DELETE to confirm account deletion:');
    
    if (doubleCheck !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      localStorage.clear();
      alert('✅ Your account has been permanently deleted.');
      window.location.reload();
      
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Failed to delete account. Please try again or contact support.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Student Profile</h2>
                <p className="text-blue-100 text-sm">Manage your learning journey</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                ) : (
                  <p className="text-gray-800">{formData.full_name || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <Mail size={16} />
                  Email
                </label>
                <p className="text-gray-800">{formData.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <Phone size={16} />
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="text-gray-800">{formData.phone || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <MapPin size={16} />
                  Location
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-gray-800">{formData.location || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <Calendar size={16} />
                  Date of Birth
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-800">
                    {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Bio</label>
              {editing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-800">{formData.bio || 'No bio yet'}</p>
              )}
            </div>
          </div>

          {/* Learning Profile */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              Learning Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Learning Style</label>
                {editing ? (
                  <select
                    value={formData.learning_style}
                    onChange={(e) => setFormData({...formData, learning_style: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select style</option>
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="reading">Reading/Writing</option>
                  </select>
                ) : (
                  <p className="text-gray-800 capitalize">{formData.learning_style || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Skill Level</label>
                {editing ? (
                  <select
                    value={formData.skill_level}
                    onChange={(e) => setFormData({...formData, skill_level: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                ) : (
                  <p className="text-gray-800 capitalize">{formData.skill_level || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <Clock size={16} />
                  Available Time
                </label>
                {editing ? (
                  <select
                    value={formData.available_time}
                    onChange={(e) => setFormData({...formData, available_time: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="flexible">Flexible</option>
                  </select>
                ) : (
                  <p className="text-gray-800 capitalize">{formData.available_time || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Learning Pace</label>
                {editing ? (
                  <select
                    value={formData.learning_pace}
                    onChange={(e) => setFormData({...formData, learning_pace: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="slow">Slow & Steady</option>
                    <option value="moderate">Moderate</option>
                    <option value="fast">Fast Track</option>
                  </select>
                ) : (
                  <p className="text-gray-800 capitalize">{formData.learning_pace || 'Moderate'}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Preferred Subjects</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.preferred_subjects.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData, 
                    preferred_subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Math, Science, English, etc."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.preferred_subjects.length > 0 ? (
                    formData.preferred_subjects.map((subject, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No subjects selected</span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                <Globe size={16} />
                Preferred Languages
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.preferred_languages.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferred_languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                  })}
                  placeholder="English, Spanish, etc."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.preferred_languages.length > 0 ? (
                    formData.preferred_languages.map((lang, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No languages selected</span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                <Award size={16} />
                Learning Goals
              </label>
              {editing ? (
                <textarea
                  value={formData.learning_goals}
                  onChange={(e) => setFormData({...formData, learning_goals: e.target.value})}
                  className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500"
                  placeholder="What do you want to achieve?"
                />
              ) : (
                <p className="text-gray-800">{formData.learning_goals || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Skills Assessment */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Skills Assessment (1-10)
            </h3>
            
            <div className="space-y-4">
              {[
                { key: 'math_score', label: 'Mathematics', color: 'blue' },
                { key: 'science_score', label: 'Science', color: 'green' },
                { key: 'language_score', label: 'Language Arts', color: 'purple' },
                { key: 'tech_score', label: 'Technology', color: 'orange' }
              ].map(({ key, label, color }) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700">{label}</label>
                    <span className={`text-${color}-600 font-bold text-lg`}>{formData[key]}/10</span>
                  </div>
                  {editing ? (
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData[key]}
                      onChange={(e) => setFormData({...formData, [key]: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${color}-500 h-2 rounded-full transition-all`}
                        style={{ width: `${formData[key] * 10}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0">
          <div className="flex gap-2 mb-4">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchProfile(); // Reset form
                  }}
                  className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-100 transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Edit2 size={20} />
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="border-t-2 border-red-200 pt-4">
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Delete My Account Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;