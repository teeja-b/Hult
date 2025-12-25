import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const TutorFeedbackModal = ({ tutor, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [completed, setCompleted] = useState(true);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [responseTime, setResponseTime] = useState('fast');
  const [punctuality, setPunctuality] = useState('excellent');
  const [submitting, setSubmitting] = useState(false);

  const responseTimeMap = {
    'instant': 0.5,
    'fast': 2,
    'moderate': 6,
    'slow': 12,
    'very-slow': 24
  };

  const punctualityMap = {
    'excellent': 1.0,
    'good': 0.9,
    'okay': 0.7,
    'poor': 0.4
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const outcome = {
        satisfaction_rating: rating,
        completed: completed,
        would_recommend: wouldRecommend,
        response_time: responseTimeMap[responseTime],
        punctuality_score: punctualityMap[punctuality]
      };

      const response = await fetch(`${API_URL}/api/match/quick-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tutor_id: tutor.id,
          outcome:outcome
        })
      });

      if (response.ok) {
        alert('✅ Thank you! Your feedback helps improve recommendations.');
        if (onSubmit) onSubmit();
        onClose();
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      
<div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6
 shadow-2xl">

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Rate Your Experience
        </h2>
        <p className="text-gray-600 mb-6">
          with <span className="font-semibold text-blue-600">{tutor.name}</span>
        </p>

        {/* Star Rating */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Overall Satisfaction
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  
                className="w-8 h-8 sm:w-10 sm:h-10"
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-sm text-gray-600">
              {rating === 5 && '🌟 Excellent!'}
              {rating === 4 && '👍 Very Good!'}
              {rating === 3 && '👌 Good'}
              {rating === 2 && '😐 Could be better'}
              {rating === 1 && '😞 Not satisfied'}
            </p>
          )}
        </div>

        {/* Completion Status */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Did you complete your learning goal?
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setCompleted(true)}
              className={`flex-1 py-3 rounded-lg border-2 transition ${
                completed
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <CheckCircle className="inline mr-2" size={20} />
              Yes, completed
            </button>
            <button
              onClick={() => setCompleted(false)}
              className={`flex-1 py-3 rounded-lg border-2 transition ${
                !completed
                  ? 'bg-orange-50 border-orange-500 text-orange-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <AlertCircle className="inline mr-2" size={20} />
              Still ongoing
            </button>
          </div>
        </div>

        {/* Would Recommend */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Would you recommend this tutor?
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setWouldRecommend(true)}
              className={`flex-1 py-3 rounded-lg border-2 transition ${
                wouldRecommend
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <ThumbsUp className="inline mr-2" size={20} />
              Yes
            </button>
            <button
              onClick={() => setWouldRecommend(false)}
              className={`flex-1 py-3 rounded-lg border-2 transition ${
                !wouldRecommend
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <ThumbsDown className="inline mr-2" size={20} />
              No
            </button>
          </div>
        </div>

        {/* Response Time */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Clock className="inline mr-1" size={16} />
            Response Time
          </label>
          <select
            value={responseTime}
            onChange={(e) => setResponseTime(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="instant">⚡ Instant (under 1 hour)</option>
            <option value="fast">🚀 Fast (1-3 hours)</option>
            <option value="moderate">👍 Moderate (3-12 hours)</option>
            <option value="slow">⏰ Slow (12-24 hours)</option>
            <option value="very-slow">🐌 Very Slow (1+ days)</option>
          </select>
        </div>

        {/* Punctuality */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <CheckCircle className="inline mr-1" size={16} />
            Punctuality
          </label>
          <select
            value={punctuality}
            onChange={(e) => setPunctuality(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="excellent">⭐ Excellent - Always on time</option>
            <option value="good">✅ Good - Usually on time</option>
            <option value="okay">👌 Okay - Sometimes late</option>
            <option value="poor">❌ Poor - Often late</option>
          </select>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-800">
            <MessageCircle className="inline mr-1" size={14} />
            Your feedback is anonymous and helps us improve tutor recommendations
            for you and other students. It also helps tutors improve their service.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {submitting ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const TutorMatchCard = ({ match, onFeedback, showPerformance = true }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{match.tutor_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(match.breakdown.rating / 20)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            {showPerformance && match.total_matches > 0 && (
              <span className="text-xs text-gray-500">
                ({match.total_matches} past matches)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{match.match_score}%</div>
          <div className="text-xs text-gray-500">Match Score</div>
        </div>
      </div>

      {/* Performance Badge */}
      {showPerformance && match.breakdown.performance_score && (
        <div className="mb-4 inline-block">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            🏆 Performance Score: {match.breakdown.performance_score}%
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 p-2 rounded text-center">
          <div className="text-sm font-bold text-blue-600">
            {match.breakdown.subject_match}%
          </div>
          <div className="text-xs text-gray-600">Subject</div>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <div className="text-sm font-bold text-green-600">
            {match.breakdown.skill_compatibility}%
          </div>
          <div className="text-xs text-gray-600">Skills</div>
        </div>
        <div className="bg-purple-50 p-2 rounded text-center">
          <div className="text-sm font-bold text-purple-600">
            {match.breakdown.schedule_match}%
          </div>
          <div className="text-xs text-gray-600">Schedule</div>
        </div>
      </div>

      {/* Success Rate */}
      {showPerformance && match.success_rate !== null && match.total_matches > 5 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-yellow-800">
              📊 Historical Success Rate
            </span>
            <span className="text-sm font-bold text-yellow-800">
              {(match.success_rate * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all"
              style={{ width: `${match.success_rate * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 border-2 border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-semibold"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        {onFeedback && (
          <button
            onClick={() => onFeedback(match)}
            className="px-4 border-2 border-blue-500 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition text-sm font-semibold"
          >
            Rate
          </button>
        )}
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-2">
          {Object.entries(match.breakdown).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                  {value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { TutorFeedbackModal, TutorMatchCard };