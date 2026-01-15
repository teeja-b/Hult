import React, { useState } from 'react';
import { Brain, BookOpen, Languages, Code, Zap, Clock, Star, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const StudentSurvey = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    // Skill scores (1-10)
    mathScore: 5,
    scienceScore: 5,
    languageScore: 5,
    techScore: 5,
    motivationLevel: 5,
    
    // Profile data
    learningStyle: '',
    preferredSubjects: [],
    skillLevel: '',
    availableTime: '',
    preferredLanguages: [],
    learningGoals: ''
  });

  const totalSteps = 4;

  const updateData = (field, value) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setSurveyData(prev => {
      const currentArray = prev[field];
      if (currentArray.includes(item)) {
        return { ...prev, [field]: currentArray.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...currentArray, item] };
      }
    });
  };

  const handleSubmit = async () => {
    console.log('🚀 ========== SUBMIT STARTED ==========');
    console.log('Survey data:', surveyData);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'EXISTS' : 'MISSING');
      
      if (!token) {
        alert('Please log in first');
        return;
      }

      console.log('📤 About to send survey request...');

      // Convert camelCase to snake_case for backend
      const backendData = {
        math_score: surveyData.mathScore,
        science_score: surveyData.scienceScore,
        language_score: surveyData.languageScore,
        tech_score: surveyData.techScore,
        motivation_level: surveyData.motivationLevel,
        learning_style: surveyData.learningStyle,
        preferred_subjects: surveyData.preferredSubjects,
        skill_level: surveyData.skillLevel,
        available_time: surveyData.availableTime,
        preferred_languages: surveyData.preferredLanguages,
        learning_goals: surveyData.learningGoals
      };

      const surveyResponse = await fetch('https://hult.onrender.com/api/student/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      console.log('📥 Survey response received:', surveyResponse.status);
      
      const surveyResult = await surveyResponse.json();
      console.log('Survey result:', surveyResult);

      if (!surveyResponse.ok) {
        throw new Error(surveyResult.error || 'Failed to submit survey');
      }

      console.log('✅ Survey saved! Now updating profile...');

      // Update profile with snake_case
      const profileResponse = await fetch('https://hult.onrender.com/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      console.log('📥 Profile response received:', profileResponse.status);

      const profileResult = await profileResponse.json();
      console.log('Profile result:', profileResult);

      if (!profileResponse.ok) {
        throw new Error(profileResult.error || 'Failed to update profile');
      }

      // ✅ SAVE CAMELCASE TO LOCALSTORAGE for AI matching
      localStorage.setItem('studentSurvey', JSON.stringify(surveyData));
      console.log('✅ Survey data saved to localStorage (camelCase)');

      console.log('✅ ========== SUBMIT COMPLETE ==========');
      alert('Survey completed successfully! 🎉');
      onComplete();
      
    } catch (error) {
      console.error('❌ Survey submission error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Brain className="mx-auto text-purple-600 mb-3" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Rate Your Skills</h2>
        <p className="text-gray-600">Help us understand your current abilities</p>
      </div>

      {/* Math Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            Mathematics
          </label>
          <span className="text-2xl font-bold text-blue-600">{surveyData.mathScore}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={surveyData.mathScore}
          onChange={(e) => updateData('mathScore', parseInt(e.target.value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Beginner</span>
          <span>Expert</span>
        </div>
      </div>

      {/* Science Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <Zap size={20} className="text-green-600" />
            Science
          </label>
          <span className="text-2xl font-bold text-green-600">{surveyData.scienceScore}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={surveyData.scienceScore}
          onChange={(e) => updateData('scienceScore', parseInt(e.target.value))}
          className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Beginner</span>
          <span>Expert</span>
        </div>
      </div>

      {/* Language Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <Languages size={20} className="text-purple-600" />
            Language Arts
          </label>
          <span className="text-2xl font-bold text-purple-600">{surveyData.languageScore}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={surveyData.languageScore}
          onChange={(e) => updateData('languageScore', parseInt(e.target.value))}
          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Beginner</span>
          <span>Expert</span>
        </div>
      </div>

      {/* Tech Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <Code size={20} className="text-orange-600" />
            Technology
          </label>
          <span className="text-2xl font-bold text-orange-600">{surveyData.techScore}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={surveyData.techScore}
          onChange={(e) => updateData('techScore', parseInt(e.target.value))}
          className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Beginner</span>
          <span>Expert</span>
        </div>
      </div>

      {/* Motivation Level */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <Star size={20} className="text-yellow-600" />
            Motivation Level
          </label>
          <span className="text-2xl font-bold text-yellow-600">{surveyData.motivationLevel}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={surveyData.motivationLevel}
          onChange={(e) => updateData('motivationLevel', parseInt(e.target.value))}
          className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Very High</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <BookOpen className="mx-auto text-blue-600 mb-3" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Learning Preferences</h2>
        <p className="text-gray-600">Tell us how you learn best</p>
      </div>

      {/* Learning Style */}
      <div>
        <label className="font-semibold text-gray-700 mb-3 block">How do you learn best?</label>
        <div className="space-y-2">
          {['visual', 'auditory', 'kinesthetic'].map(style => (
            <button
              key={style}
              onClick={() => updateData('learningStyle', style)}
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                surveyData.learningStyle === style
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold capitalize">{style}</div>
              <div className="text-sm text-gray-600">
                {style === 'visual' && 'I learn best by seeing diagrams, videos, and written content'}
                {style === 'auditory' && 'I learn best by listening and discussing'}
                {style === 'kinesthetic' && 'I learn best by doing and hands-on practice'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Skill Level */}
      <div>
        <label className="font-semibold text-gray-700 mb-3 block">Overall Skill Level</label>
        <div className="grid grid-cols-3 gap-2">
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <button
              key={level}
              onClick={() => updateData('skillLevel', level)}
              className={`p-3 rounded-lg border-2 transition ${
                surveyData.skillLevel === level
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="font-semibold capitalize text-center">{level}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Time */}
      <div>
        <label className="font-semibold text-gray-700 mb-3 block flex items-center gap-2">
          <Clock size={20} />
          When can you study?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['morning', 'afternoon', 'evening'].map(time => (
            <button
              key={time}
              onClick={() => updateData('availableTime', time)}
              className={`p-3 rounded-lg border-2 transition ${
                surveyData.availableTime === time
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="font-semibold capitalize text-center">{time}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Languages className="mx-auto text-green-600 mb-3" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Subjects & Languages</h2>
        <p className="text-gray-600">What interests you?</p>
      </div>

      {/* Preferred Subjects */}
      <div>
        <label className="font-semibold text-gray-700 mb-3 block">
          Subjects you want to learn (select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology', 
            'Computer Science', 'History', 'Art', 'Music', 'Business', 'Languages'].map(subject => (
            <button
              key={subject}
              onClick={() => toggleArrayItem('preferredSubjects', subject)}
              className={`p-3 rounded-lg border-2 transition text-sm ${
                surveyData.preferredSubjects.includes(subject)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {surveyData.preferredSubjects.includes(subject) && (
                <CheckCircle size={16} className="inline mr-1 text-blue-600" />
              )}
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Languages */}
      <div>
        <label className="font-semibold text-gray-700 mb-3 block">
          Languages you speak
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['English', 'Spanish', 'French', 'Mandarin', 'Hindi', 'Arabic', 
            'Portuguese', 'Russian'].map(lang => (
            <button
              key={lang}
              onClick={() => toggleArrayItem('preferredLanguages', lang)}
              className={`p-3 rounded-lg border-2 transition ${
                surveyData.preferredLanguages.includes(lang)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              {surveyData.preferredLanguages.includes(lang) && (
                <CheckCircle size={16} className="inline mr-1 text-green-600" />
              )}
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Star className="mx-auto text-yellow-600 mb-3" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Learning Goals</h2>
        <p className="text-gray-600">What do you want to achieve?</p>
      </div>

      <div>
        <label className="font-semibold text-gray-700 mb-2 block">
          Describe your learning goals
        </label>
        <textarea
          value={surveyData.learningGoals}
          onChange={(e) => updateData('learningGoals', e.target.value)}
          placeholder="Example: I want to improve my math skills to prepare for university entrance exams..."
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          rows="6"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Survey Summary</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <p>✓ Skill ratings completed</p>
          <p>✓ Learning style: <span className="font-semibold capitalize">{surveyData.learningStyle || 'Not set'}</span></p>
          <p>✓ Subjects: {surveyData.preferredSubjects.length} selected</p>
          <p>✓ Languages: {surveyData.preferredLanguages.length} selected</p>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return surveyData.learningStyle && surveyData.skillLevel && surveyData.availableTime;
    if (step === 3) return surveyData.preferredSubjects.length > 0 && surveyData.preferredLanguages.length > 0;
    if (step === 4) return surveyData.learningGoals.trim().length > 10;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">Student Learning Survey</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">Step {step} of {totalSteps}</p>
        </div>

        <div className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}
          
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Complete Survey
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSurvey;