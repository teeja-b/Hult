import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, Brain, Users, Calendar, Globe, BookOpen, Award, Zap } from 'lucide-react';

const API_URL = "https://hult.onrender.com";

const AITutorMatcher = ({ studentProfile, onSelectTutor }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useRL, setUseRL] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    if (studentProfile) {
      findMatches();
    }
  }, [studentProfile, useRL]);

  const findMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/match/tutors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_profile: studentProfile,
          use_rl: useRL
        })
      });

      if (!response.ok) {
        throw new Error('Failed to find matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
      
    } catch (err) {
      console.error('Match error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const recordFeedback = async (tutorId, rating, completed = false) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_URL}/api/match/quick-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tutor_id: tutorId,
          outcome: {
            satisfaction_rating: rating,
            completed: completed,
            would_recommend: rating >= 4
          }
        })
      });
      
      // Refresh matches after feedback
      findMatches();
      
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Possible Match';
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <h1 className="text-2xl font-bold">AI-Powered Tutor Matching</h1>
        </div>
        <p className="text-purple-100">
          Our machine learning system finds tutors perfectly matched to your learning style, 
          schedule, and goals. The more you use it, the smarter it gets!
        </p>
        
        {/* RL Toggle */}
        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useRL}
              onChange={(e) => setUseRL(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">
              Use AI Learning (Recommended - improves with feedback)
            </span>
          </label>
          {useRL && (
            <div className="flex items-center gap-1 text-xs text-purple-200">
              <Zap className="w-4 h-4" />
              <span>Smart matching enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Analyzing thousands of data points...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={findMatches}
            className="mt-2 text-red-700 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Found {matches.length} Matches
            </h2>
            <button
              onClick={findMatches}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Search className="w-4 h-4" />
              Refresh Matches
            </button>
          </div>

          {matches.map((match, index) => (
            <div
              key={match.tutor_id}
              className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                selectedMatch?.tutor_id === match.tutor_id ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* Match Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    #{index + 1}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {match.tutor_name}
                    </h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getMatchColor(match.match_score)}`}>
                      <TrendingUp className="w-4 h-4" />
                      {match.match_score}% {getScoreLabel(match.match_score)}
                    </div>
                  </div>
                </div>

                {/* Experience Badge */}
                {match.total_matches > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">AI Verified</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-purple-600">
                      <Award className="w-4 h-4" />
                      {match.total_matches} matches
                    </div>
                    {match.success_rate && (
                      <div className="text-xs text-green-600">
                        {Math.round(match.success_rate * 100)}% success rate
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Match Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <MatchDetail
                  icon={BookOpen}
                  label="Subject Match"
                  score={match.breakdown.subject_match}
                />
                <MatchDetail
                  icon={TrendingUp}
                  label="Skill Level"
                  score={match.breakdown.skill_compatibility}
                />
                <MatchDetail
                  icon={Calendar}
                  label="Schedule"
                  score={match.breakdown.schedule_match}
                />
                <MatchDetail
                  icon={Globe}
                  label="Language"
                  score={match.breakdown.language_match}
                />
                <MatchDetail
                  icon={Brain}
                  label="Learning Style"
                  score={match.breakdown.learning_style_match}
                />
                <MatchDetail
                  icon={Star}
                  label="Rating"
                  score={match.breakdown.rating}
                />
              </div>

              {/* Performance Score (if using RL) */}
              {useRL && match.breakdown.performance_score && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-900">
                      AI Performance Score: {match.breakdown.performance_score}%
                    </span>
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    Based on past student satisfaction, completion rates, and reliability
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedMatch(match);
                    if (onSelectTutor) onSelectTutor(match);
                  }}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Select This Tutor
                </button>
                
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  View Details
                </button>

                {/* Quick Feedback */}
                {match.total_matches > 0 && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => recordFeedback(match.tutor_id, rating)}
                        className="p-1 hover:bg-yellow-50 rounded transition"
                        title={`Rate ${rating} stars`}
                      >
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && matches.length === 0 && !error && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No matches found
          </h3>
          <p className="text-gray-500">
            Try adjusting your profile or check back later
          </p>
        </div>
      )}
    </div>
  );
};

// Helper component for match details
const MatchDetail = ({ icon: Icon, label, score }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${getScoreColor(score)}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-600 truncate">{label}</div>
        <div className={`text-sm font-semibold ${getScoreColor(score)}`}>
          {score}%
        </div>
      </div>
    </div>
  );
};

export default AITutorMatcher;