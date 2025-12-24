import React, { useState, useEffect } from 'react';
import { User, BookOpen, Clock, Globe, DollarSign, Star, Edit2, Save, X, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TutorProfile = ({ onClose }) => {
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
    
    // Professional info - REQUIRED FIELDS
    bio: '',
    expertise: [],
    hourly_rate: '',
    languages: [],
    availability: {},
    teaching_style: 'adaptive',
    
    // Experience & Credentials - REQUIRED FIELDS
    years_experience: '',
    education: '',
    
    // Optional fields
    certifications: '',
    specializations: '',
    teaching_philosophy: '',
    
    // Preferences
    min_session_length: '30',
    max_students: '10',
    preferred_age_groups: []
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
      console.log('Fetched user data:', userData);
      
      // Fetch tutor profile
      const profileResponse = await fetch(`${API_URL}/api/tutor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileResponse.json();
      console.log('Fetched profile data:', profileData);
      
      setUserInfo(userData.user);
      setProfile(profileData.profile);
      
      // Populate form with existing data - handle both profile existing and not existing
      const newFormData = {
        full_name: userData.user?.full_name || '',
        email: userData.user?.email || '',
        phone: userData.user?.phone || '',
        location: userData.user?.location || '',
        date_of_birth: userData.user?.date_of_birth || '',
        
        bio: profileData.profile?.bio || '',
        expertise: profileData.profile?.expertise || [],
        hourly_rate: profileData.profile?.hourly_rate?.toString() || '',
        languages: profileData.profile?.languages || [],
        availability: profileData.profile?.availability || {},
        teaching_style: profileData.profile?.teaching_style || 'adaptive',
        
        years_experience: profileData.profile?.years_experience || '',
        education: profileData.profile?.education || '',
        certifications: profileData.profile?.certifications || '',
        specializations: profileData.profile?.specializations || '',
        teaching_philosophy: profileData.profile?.teaching_philosophy || '',
        
        min_session_length: profileData.profile?.min_session_length || '30',
        max_students: profileData.profile?.max_students || '10',
        preferred_age_groups: profileData.profile?.preferred_age_groups || []
      };
      
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateRequiredFields = () => {
    const errors = [];
    
    console.log('🔍 Validating required fields:', {
      full_name: formData.full_name,
      phone: formData.phone,
      location: formData.location,
      bio_length: formData.bio?.length,
      expertise_count: formData.expertise?.length,
      hourly_rate: formData.hourly_rate,
      languages_count: formData.languages?.length,
      years_experience: formData.years_experience,
      education: formData.education,
      availability: formData.availability
    });
    
    // Required fields
    if (!formData.full_name?.trim()) {
      console.log('❌ Missing: Full name');
      errors.push('Full name');
    }
    if (!formData.phone?.trim()) {
      console.log('❌ Missing: Phone number');
      errors.push('Phone number');
    }
    if (!formData.location?.trim()) {
      console.log('❌ Missing: Location');
      errors.push('Location');
    }
    if (!formData.bio?.trim() || formData.bio.length < 20) {
      console.log('❌ Missing or too short: Bio');
      errors.push('Bio (minimum 20 characters)');
    }
    if (!formData.expertise || formData.expertise.length === 0) {
      console.log('❌ Missing: Expertise');
      errors.push('At least one expertise/subject');
    }
    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
      console.log('❌ Missing or invalid: Hourly rate');
      errors.push('Hourly rate');
    }
    if (!formData.languages || formData.languages.length === 0) {
      console.log('❌ Missing: Languages');
      errors.push('At least one language');
    }
    if (!formData.years_experience) {
      console.log('❌ Missing: Years of experience');
      errors.push('Years of experience');
    }
    if (!formData.education?.trim()) {
      console.log('❌ Missing: Education');
      errors.push('Education');
    }
    
    // Check if at least one availability slot is selected
    const hasAvailability = Object.values(formData.availability || {}).some(v => v === true);
    if (!hasAvailability) {
      console.log('❌ Missing: Availability');
      errors.push('At least one availability slot');
    }
    
    console.log(`✅ Validation complete. Missing fields: ${errors.length}`, errors);
    return errors;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare user data
      const userData = {
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        date_of_birth: formData.date_of_birth
      };
      
      console.log('📤 Sending user update:', userData);
      
      // Update user info first
      const userResponse = await fetch(`${API_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const userResponseText = await userResponse.text();
      console.log('📥 User update response status:', userResponse.status);
      console.log('📥 User update response:', userResponseText);
      
      if (!userResponse.ok) {
        let userError;
        try {
          userError = JSON.parse(userResponseText);
        } catch {
          userError = { error: userResponseText };
        }
        console.error('❌ User update error:', userError);
        throw new Error(`Failed to update user info: ${userError.error || 'Unknown error'}`);
      }
      
      console.log('✅ User info updated successfully');
      
      // Update tutor profile - send ALL fields regardless of completion
      const profilePayload = {
        bio: formData.bio || '',
        expertise: formData.expertise || [],
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        languages: formData.languages || [],
        availability: formData.availability || {},
        teaching_style: formData.teaching_style || 'adaptive',
        years_experience: formData.years_experience || '',
        education: formData.education || '',
        certifications: formData.certifications || '',
        specializations: formData.specializations || '',
        teaching_philosophy: formData.teaching_philosophy || '',
        min_session_length: formData.min_session_length || '30',
        max_students: formData.max_students || '10',
        preferred_age_groups: formData.preferred_age_groups || []
      };
      
      console.log('📤 Sending profile update:', profilePayload);
      
      const profileResponse = await fetch(`${API_URL}/api/tutor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profilePayload)
      });

      const profileResponseText = await profileResponse.text();
      console.log('📥 Profile update response status:', profileResponse.status);
      console.log('📥 Profile update response:', profileResponseText);

      if (!profileResponse.ok) {
        let profileError;
        try {
          profileError = JSON.parse(profileResponseText);
        } catch {
          profileError = { error: profileResponseText };
        }
        console.error('❌ Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.error || 'Unknown error'}`);
      }
      
      const data = JSON.parse(profileResponseText);
      console.log('✅ Profile updated successfully:', data);
      
      // Update local profile and userInfo state with saved data
      if (data.profile) {
        setProfile(data.profile);
      }
      
      // Check if profile is complete based on OUR validation
      const missingFields = validateRequiredFields();
      
      if (missingFields.length === 0) {
        console.log('🎉 Profile is COMPLETE! Updating localStorage');
        localStorage.setItem('profileComplete', 'true');
        alert('✅ Profile completed successfully! You are now visible to students.');
        // Trigger a page refresh to update the app state
        window.location.reload();
      } else {
        console.log('⚠️ Profile is INCOMPLETE. Missing:', missingFields);
        localStorage.setItem('profileComplete', 'false');
        alert(`💾 Profile saved successfully!\n\n⚠️ To be visible to students, please complete these required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`);
      }
      
      setEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action cannot be undone!\n\n' +
      'This will permanently delete:\n' +
      '• Your profile and account\n' +
      '• All your courses\n' +
      '• Your teaching history\n' +
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

  const toggleAvailability = (time) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [time]: !formData.availability[time]
      }
    });
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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
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
              className="text-white hover:bg-white/20 p-2 rounded transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Profile Completion Status */}
          {(() => {
            const missingFields = validateRequiredFields();
            const isComplete = missingFields.length === 0;
            
            return (
              <div className={`p-4 rounded-lg border-2 ${isComplete ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                <h4 className={`font-bold mb-2 ${isComplete ? 'text-green-800' : 'text-yellow-800'}`}>
                  {isComplete ? '✅ Profile Complete' : '⚠️ Profile Incomplete'}
                </h4>
                {isComplete ? (
                  <p className="text-sm text-green-700">Your profile is complete and visible to students!</p>
                ) : (
                  <div className="text-sm text-yellow-800">
                    <p className="mb-2">Required fields to be visible to students:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {missingFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Stats Overview */}
          {profile && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <Star className="text-yellow-600 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-gray-800">{profile.rating || '5.0'}</p>
                <p className="text-xs text-gray-600">Rating</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <BookOpen className="text-blue-600 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-gray-800">{profile.total_sessions || 0}</p>
                <p className="text-xs text-gray-600">Sessions</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <DollarSign className="text-green-600 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-gray-800">${formData.hourly_rate || 0}</p>
                <p className="text-xs text-gray-600">Per Hour</p>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-green-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
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
                  Phone Number <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="text-gray-800">{formData.phone || 'Not set'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <MapPin size={16} />
                  Location <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-gray-800">{formData.location || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Professional Bio <span className="text-red-500">*</span> (min 20 characters)
              </label>
              {editing ? (
                <>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-green-500"
                    placeholder="Tell students about your teaching experience..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.bio.length} characters</p>
                </>
              ) : (
                <p className="text-gray-800">{formData.bio || 'No bio yet'}</p>
              )}
            </div>
          </div>

          {/* Teaching Profile */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <GraduationCap size={20} className="text-green-600" />
              Teaching Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <Briefcase size={16} />
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                    placeholder="5"
                  />
                ) : (
                  <p className="text-gray-800">{formData.years_experience || 'Not set'} years</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                  <DollarSign size={16} />
                  Hourly Rate ($) <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                    placeholder="25"
                  />
                ) : (
                  <p className="text-gray-800">${formData.hourly_rate || 0}/hour</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Teaching Style</label>
                {editing ? (
                  <select
                    value={formData.teaching_style}
                    onChange={(e) => setFormData({...formData, teaching_style: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                  >
                    <option value="adaptive">Adaptive</option>
                    <option value="structured">Structured</option>
                    <option value="interactive">Interactive</option>
                    <option value="hands-on">Hands-on</option>
                  </select>
                ) : (
                  <p className="text-gray-800 capitalize">{formData.teaching_style || 'Adaptive'}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Min Session Length</label>
                {editing ? (
                  <select
                    value={formData.min_session_length}
                    onChange={(e) => setFormData({...formData, min_session_length: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                ) : (
                  <p className="text-gray-800">{formData.min_session_length} minutes</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Expertise & Subjects <span className="text-red-500">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.expertise.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Math, Physics, Programming, etc."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.expertise.length > 0 ? (
                    formData.expertise.map((subject, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No expertise listed</span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                <Globe size={16} />
                Languages <span className="text-red-500">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.languages.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                  })}
                  placeholder="English, Spanish, etc."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.languages.length > 0 ? (
                    formData.languages.map((lang, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No languages listed</span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                <Award size={16} />
                Education <span className="text-red-500">*</span>
              </label>
              {editing ? (
                <textarea
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  className="w-full p-2 border rounded h-20 focus:ring-2 focus:ring-green-500"
                  placeholder="Your degrees and certifications..."
                />
              ) : (
                <p className="text-gray-800">{formData.education || 'Not set'}</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Teaching Philosophy (Optional)</label>
              {editing ? (
                <textarea
                  value={formData.teaching_philosophy}
                  onChange={(e) => setFormData({...formData, teaching_philosophy: e.target.value})}
                  className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-green-500"
                  placeholder="Your approach to teaching..."
                />
              ) : (
                <p className="text-gray-800">{formData.teaching_philosophy || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-green-600" />
              Availability <span className="text-red-500">*</span>
            </h3>
            
            {editing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['morning', 'afternoon', 'evening', 'weekends', 'weekdays', 'flexible'].map(time => (
                  <button
                    key={time}
                    onClick={() => toggleAvailability(time)}
                    className={`p-3 rounded-lg border-2 transition ${
                      formData.availability[time]
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="capitalize">{time}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.availability).filter(([k, v]) => v).length > 0 ? (
                  Object.entries(formData.availability).filter(([k, v]) => v).map(([time], idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
                      {time}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No availability set</span>
                )}
              </div>
            )}
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
                    // Don't refetch, just keep current form data
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
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
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

export default TutorProfile;