import React, { useState } from 'react';
import { CheckCircle, X, BookOpen, Clock, Globe, MessageSquare } from 'lucide-react';

const TutorOnboarding = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    expertise: [],
    bio: '',
    languages: ['English'],
    availability: { morning: false, afternoon: false, evening: false },
    teachingStyle: 'adaptive',
    hourlyRate: ''
  });

  const [customSubject, setCustomSubject] = useState('');

  const subjectOptions = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'Programming', 'Web Development', 'English', 'Literature', 'Writing',
    'History', 'Geography', 'Economics', 'Business', 'Art', 'Music'
  ];

  const languageOptions = ['English', 'Spanish', 'French', 'Mandarin', 'German', 'Arabic', 'Hindi'];
  
  const teachingStyles = [
    { value: 'adaptive', label: 'Adaptive' },
    { value: 'visual', label: 'Visual' },
    { value: 'hands-on', label: 'Hands-on' },
    { value: 'auditory', label: 'Auditory' }
  ];

  const toggleSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(subject)
        ? prev.expertise.filter(s => s !== subject)
        : [...prev.expertise, subject]
    }));
  };

  const toggleLanguage = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleAvailability = (time) => {
    setFormData(prev => ({
      ...prev,
      availability: { ...prev.availability, [time]: !prev.availability[time] }
    }));
  };

const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  
  try {
    const token = localStorage.getItem('token');
    
    // Construct the profile data from formData state
    const profileData = {
      expertise: formData.expertise,
      bio: formData.bio,
      languages: formData.languages,
      availability: formData.availability,
      teachingStyle: formData.teachingStyle,
      hourlyRate: formData.hourlyRate || null
    };
    
    const response = await fetch('https://hult-ten.vercel.app /api/tutor/profile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // ✅ Pass the profile data back to the parent
      onComplete(data); // This should include tutor_profile_id
    } else {
      alert('Failed to save profile: ' + data.error);
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to save profile');
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Welcome to EduConnect! 🎓</h2>
              <p className="text-green-100 text-sm">Set up your tutor profile</p>
            </div>
            <button onClick={onSkip} className="text-white hover:bg-white/20 p-2 rounded">
              <X size={24} />
            </button>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${(step/5)*100}%` }}></div>
          </div>
          <p className="text-xs text-green-100 mt-2">Step {step} of 5</p>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-4">What subjects do you teach?</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {subjectOptions.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`p-3 rounded-lg border-2 transition ${
                      formData.expertise.includes(subject)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {formData.expertise.includes(subject) && <CheckCircle size={16} className="inline mr-1" />}
                    {subject}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Add custom subject"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={() => {
                    if (customSubject.trim()) {
                      toggleSubject(customSubject.trim());
                      setCustomSubject('');
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-4">Selected: {formData.expertise.length} subjects</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Tell students about yourself</h3>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Share your teaching experience, qualifications, and teaching philosophy..."
                className="w-full p-3 border rounded h-32"
              />
              <p className="text-sm text-gray-600 mt-2">{formData.bio.length}/500 characters (min 20)</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-4">When are you available?</h3>
              <div className="space-y-3">
                {['morning', 'afternoon', 'evening'].map(time => (
                  <button
                    key={time}
                    onClick={() => toggleAvailability(time)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      formData.availability[time]
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock size={20} />
                        <span className="font-semibold capitalize">{time}</span>
                      </div>
                      {formData.availability[time] && <CheckCircle className="text-green-600" size={20} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-4">What languages do you speak?</h3>
              <div className="grid grid-cols-2 gap-2">
                {languageOptions.map(language => (
                  <button
                    key={language}
                    onClick={() => toggleLanguage(language)}
                    className={`p-3 rounded-lg border-2 transition ${
                      formData.languages.includes(language)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {formData.languages.includes(language) && <CheckCircle size={16} className="inline mr-1" />}
                    {language}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 className="text-xl font-bold mb-4">What's your teaching style?</h3>
              <div className="space-y-2 mb-4">
                {teachingStyles.map(style => (
                  <button
                    key={style.value}
                    onClick={() => setFormData({...formData, teachingStyle: style.value})}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      formData.teachingStyle === style.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{style.label}</span>
                      {formData.teachingStyle === style.value && <CheckCircle className="text-green-600" size={20} />}
                    </div>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate (Optional)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                  placeholder="e.g., 25"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < 5 ? setStep(step + 1) : handleSubmit()}
            disabled={
              (step === 1 && formData.expertise.length === 0) ||
              (step === 2 && formData.bio.length < 20) ||
              (step === 3 && !Object.values(formData.availability).some(v => v))
            }
            className={`px-6 py-2 rounded ml-auto ${
              (step === 1 && formData.expertise.length === 0) ||
              (step === 2 && formData.bio.length < 20) ||
              (step === 3 && !Object.values(formData.availability).some(v => v))
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {step === 5 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorOnboarding;