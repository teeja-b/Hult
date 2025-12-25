import React, { useState, useEffect } from 'react';
import { GraduationCap, Briefcase, DollarSign, Globe, Clock, BookOpen, ChevronRight, ChevronLeft, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const TutorOnboarding = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState({
    expertise: [],
    bio: '',
    hourly_rate: '',
    languages: [],
    availability: {
      morning: false,
      afternoon: false,
      evening: false,
      weekends: false
    },
    teaching_style: 'adaptive',
    years_experience: '',
    education: ''
  });
  
  const [expertiseInput, setExpertiseInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  // Load saved progress on mount
  useEffect(() => {
    loadSavedProgress();
  }, []);

  // Auto-save whenever formData changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep > 1) { // Don't auto-save on first step before user starts
        autoSaveProgress();
      }
    }, 2000); // Save 2 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [formData]);

  const loadSavedProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tutor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setFormData({
            expertise: data.profile.expertise || [],
            bio: data.profile.bio || '',
            hourly_rate: data.profile.hourly_rate?.toString() || '',
            languages: data.profile.languages || [],
            availability: data.profile.availability || {
              morning: false,
              afternoon: false,
              evening: false,
              weekends: false
            },
            teaching_style: data.profile.teaching_style || 'adaptive',
            years_experience: data.profile.years_experience || '',
            education: data.profile.education || ''
          });
          
          console.log('✅ Loaded saved progress from server');
        }
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error);
    }
  };

  const autoSaveProgress = async () => {
    setAutoSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/tutor/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expertise: formData.expertise,
          bio: formData.bio,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          languages: formData.languages,
          availability: formData.availability,
          teaching_style: formData.teaching_style,
          years_experience: formData.years_experience,
          education: formData.education
        })
      });
      
      console.log('💾 Auto-saved progress');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setTimeout(() => setAutoSaving(false), 1000);
    }
  };

  const handleComplete = async () => {
    // Validation
    if (formData.expertise.length === 0) {
      alert('Please add at least one subject you can teach');
      setCurrentStep(1);
      return;
    }
    
    if (!formData.bio || formData.bio.length < 20) {
      alert('Please write a bio (at least 20 characters)');
      setCurrentStep(2);
      return;
    }
    
    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
      alert('Please set your hourly rate');
      setCurrentStep(3);
      return;
    }
    
    if (formData.languages.length === 0) {
      alert('Please add at least one language');
      setCurrentStep(4);
      return;
    }

    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tutor/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expertise: formData.expertise,
          bio: formData.bio,
          hourlyRate: parseFloat(formData.hourly_rate),
          languages: formData.languages,
          availability: formData.availability,
          teaching_style: formData.teaching_style,
          years_experience: formData.years_experience,
          education: formData.education
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Onboarding completed!');
        
        // Update localStorage
        localStorage.setItem('profileComplete', 'true');
        
        if (data.tutor_profile_id) {
          localStorage.setItem('tutorProfileId', data.tutor_profile_id);
        }
        
        onComplete && onComplete(data);
      } else {
        const error = await response.json();
        alert(`Failed to complete onboarding: ${error.error}`);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertiseInput.trim()]
      });
      setExpertiseInput('');
    }
  };

  const removeExpertise = (subject) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter(s => s !== subject)
    });
  };

  const addLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, languageInput.trim()]
      });
      setLanguageInput('');
    }
  };

  const removeLanguage = (lang) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== lang)
    });
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

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="text-green-600" size={32} />
              <div>
                <h3 className="text-xl font-bold text-gray-800">What do you teach?</h3>
                <p className="text-sm text-gray-600">Add subjects you're qualified to teach</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addExpertise()}
                placeholder="e.g., Mathematics, Physics, Programming"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addExpertise}
                className="bg-green-600 text-white px-6 rounded-lg hover:bg-green-700 transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {formData.expertise.map((subject, idx) => (
                <span
                  key={idx}
                  className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center gap-2"
                >
                  {subject}
                  <button
                    onClick={() => removeExpertise(subject)}
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.expertise.length === 0 && (
                <p className="text-gray-400 italic">No subjects added yet</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">
                💡 Tip: Add at least 2-3 subjects to attract more students
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="text-green-600" size={32} />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Tell us about yourself</h3>
                <p className="text-sm text-gray-600">Write a compelling bio for students</p>
              </div>
            </div>

            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Share your teaching experience, qualifications, and what makes you a great tutor..."
              className="w-full p-4 border rounded-lg h-48 focus:ring-2 focus:ring-green-500"
            />

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {formData.bio.length} characters
              </span>
              <span className={formData.bio.length >= 20 ? 'text-green-600' : 'text-gray-400'}>
                Minimum: 20 characters
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience (optional)
                </label>
                <input
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
                  placeholder="5"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Education & Certifications (optional)
                </label>
                <textarea
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  placeholder="e.g., Bachelor's in Education, Teaching Certification..."
                  className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="text-green-600" size={32} />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Set your rate</h3>
                <p className="text-sm text-gray-600">How much do you charge per hour?</p>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-500 text-xl">$</span>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                placeholder="25"
                className="w-full p-4 pl-10 border rounded-lg text-xl focus:ring-2 focus:ring-green-500"
              />
              <span className="absolute right-4 top-4 text-gray-500">/hour</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-800 mb-3">Suggested rates:</h4>
              <div className="space-y-2">
                {[
                  { rate: 15, level: 'Beginner tutor' },
                  { rate: 25, level: 'Experienced tutor' },
                  { rate: 40, level: 'Expert/Specialized' },
                  { rate: 60, level: 'Professional educator' }
                ].map(({ rate, level }) => (
                  <button
                    key={rate}
                    onClick={() => setFormData({...formData, hourly_rate: rate.toString()})}
                    className="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-green-50 transition border"
                  >
                    <span className="text-gray-700">{level}</span>
                    <span className="font-bold text-green-600">${rate}/hr</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teaching Style
              </label>
              <select
                value={formData.teaching_style}
                onChange={(e) => setFormData({...formData, teaching_style: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="adaptive">Adaptive - Adjust to student needs</option>
                <option value="structured">Structured - Follow curriculum closely</option>
                <option value="interactive">Interactive - Lots of discussions</option>
                <option value="hands-on">Hands-on - Practical exercises</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-green-600" size={32} />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Languages</h3>
                <p className="text-sm text-gray-600">What languages can you teach in?</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                placeholder="e.g., English, Spanish, French"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addLanguage}
                className="bg-green-600 text-white px-6 rounded-lg hover:bg-green-700 transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {formData.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2"
                >
                  {lang}
                  <button
                    onClick={() => removeLanguage(lang)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.languages.length === 0 && (
                <p className="text-gray-400 italic">No languages added yet</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                💡 Adding multiple languages helps you reach more students
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-green-600" size={32} />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Availability</h3>
                <p className="text-sm text-gray-600">When are you available to teach?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'morning', label: 'Morning', icon: '🌅' },
                { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
                { key: 'evening', label: 'Evening', icon: '🌙' },
                { key: 'weekends', label: 'Weekends', icon: '📅' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => toggleAvailability(key)}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.availability[key]
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="font-semibold">{label}</div>
                </button>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-green-900 mb-2">Review Your Profile</h4>
              <div className="space-y-2 text-sm">
                <p>✓ Expertise: {formData.expertise.join(', ')}</p>
                <p>✓ Rate: ${formData.hourly_rate}/hour</p>
                <p>✓ Languages: {formData.languages.join(', ')}</p>
                <p>✓ Available: {Object.entries(formData.availability).filter(([k, v]) => v).map(([k]) => k).join(', ')}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1: return formData.expertise.length > 0;
      case 2: return formData.bio.length >= 20;
      case 3: return formData.hourly_rate && parseFloat(formData.hourly_rate) > 0;
      case 4: return formData.languages.length > 0;
      case 5: return Object.values(formData.availability).some(v => v);
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Complete Your Tutor Profile</h2>
            {autoSaving && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <Save size={16} className="animate-pulse" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {[...Array(totalSteps)].map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-2 rounded-full transition-all ${
                  idx < currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-green-100 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-gray-100 transition"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
            >
              Skip for now
            </button>
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving || !canProceed()}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Completing...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorOnboarding;