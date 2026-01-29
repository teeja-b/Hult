import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  BookOpen,
  Globe,
  Clock,
  DollarSign,
  Award,
  GraduationCap,
  CheckCircle,
  Calendar,
  Users,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const TutorProfileViewer = ({ tutorId, onClose, API_URL = 'https://hult.onrender.com' }) => {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    about: true,
    expertise: true,
    education: false,
    availability: false,
    reviews: false
  });

  useEffect(() => {
    fetchTutorProfile();
  }, [tutorId]);

  const fetchTutorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tutor profile from backend
      const response = await fetch(`${API_URL}/api/tutors/${tutorId}/profile`);

      if (!response.ok) {
        throw new Error('Failed to fetch tutor profile');
      }

      const data = await response.json();
      setTutor(data.tutor);
    } catch (err) {
      console.error('Error fetching tutor profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-5 h-5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-5 h-5 text-gray-300" />
        );
      }
    }

    return stars;
  };

  const formatAvailability = (availability) => {
    if (!availability || Object.keys(availability).length === 0) {
      return 'No availability set';
    }

    const days = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };

    return Object.entries(availability)
      .filter(([_, isAvailable]) => isAvailable)
      .map(([day]) => days[day] || day)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading tutor profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Error</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl flex-shrink-0">
                {tutor.name.charAt(0).toUpperCase()}
              </div>

              {/* Name and Title */}
              <div>
                <h2 className="text-2xl font-bold mb-1">{tutor.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                  {tutor.verified && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle size={14} />
                      Verified Tutor
                    </span>
                  )}
                  {tutor.teaching_style && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {tutor.teaching_style.charAt(0).toUpperCase() + tutor.teaching_style.slice(1)} Style
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {renderStars(tutor.rating || 0)}
                  </div>
                  <span className="text-sm">
                    {tutor.rating ? tutor.rating.toFixed(1) : 'New'}
                  </span>
                  <span className="text-sm opacity-80">
                    ({tutor.total_sessions || 0} sessions)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">
                ${tutor.hourly_rate || 0}
              </p>
              <p className="text-xs text-gray-600">per hour</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg text-center">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">
                {tutor.total_sessions || 0}
              </p>
              <p className="text-xs text-gray-600">sessions</p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">
                {tutor.expertise?.length || 0}
              </p>
              <p className="text-xs text-gray-600">subjects</p>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <Globe className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-600">
                {tutor.languages?.length || 0}
              </p>
              <p className="text-xs text-gray-600">languages</p>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white border rounded-lg">
            <button
              onClick={() => toggleSection('about')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-lg">About Me</h3>
              </div>
              {expandedSections.about ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.about && (
              <div className="p-4 pt-0 border-t">
                {tutor.bio ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {tutor.bio}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No bio provided</p>
                )}

                {tutor.teaching_philosophy && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Teaching Philosophy:
                    </p>
                    <p className="text-sm text-gray-700">
                      {tutor.teaching_philosophy}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expertise Section */}
          <div className="bg-white border rounded-lg">
            <button
              onClick={() => toggleSection('expertise')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-lg">Expertise & Languages</h3>
              </div>
              {expandedSections.expertise ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.expertise && (
              <div className="p-4 pt-0 border-t space-y-4">
                {/* Expertise */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Subjects I Teach:
                  </p>
                  {tutor.expertise && tutor.expertise.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tutor.expertise.map((subject, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-sm">No subjects listed</p>
                  )}
                </div>

                {/* Specializations */}
                {tutor.specializations && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Specializations:
                    </p>
                    <p className="text-gray-700 text-sm">{tutor.specializations}</p>
                  </div>
                )}

                {/* Languages */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Languages:
                  </p>
                  {tutor.languages && tutor.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tutor.languages.map((language, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        >
                          <Globe size={14} />
                          {language}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-sm">No languages listed</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Education Section */}
          <div className="bg-white border rounded-lg">
            <button
              onClick={() => toggleSection('education')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-lg">Education & Experience</h3>
              </div>
              {expandedSections.education ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.education && (
              <div className="p-4 pt-0 border-t space-y-3">
                {/* Years of Experience */}
                {tutor.years_experience && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Experience</p>
                      <p className="text-gray-600">{tutor.years_experience}</p>
                    </div>
                  </div>
                )}

                {/* Education */}
                {tutor.education && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Education</p>
                      <p className="text-gray-600 whitespace-pre-line">{tutor.education}</p>
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {tutor.certifications && (
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Certifications</p>
                      <p className="text-gray-600 whitespace-pre-line">{tutor.certifications}</p>
                    </div>
                  </div>
                )}

                {!tutor.years_experience && !tutor.education && !tutor.certifications && (
                  <p className="text-gray-400 italic text-sm">No education details provided</p>
                )}
              </div>
            )}
          </div>

          {/* Availability Section */}
          <div className="bg-white border rounded-lg">
            <button
              onClick={() => toggleSection('availability')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-lg">Availability & Preferences</h3>
              </div>
              {expandedSections.availability ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.availability && (
              <div className="p-4 pt-0 border-t space-y-3">
                {/* Available Days */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Available Days:
                  </p>
                  <p className="text-gray-600">
                    {formatAvailability(tutor.availability)}
                  </p>
                </div>

                {/* Session Length */}
                {tutor.min_session_length && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Minimum Session Length:
                    </p>
                    <p className="text-gray-600">{tutor.min_session_length} minutes</p>
                  </div>
                )}

                {/* Max Students */}
                {tutor.max_students && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Maximum Students per Session:
                    </p>
                    <p className="text-gray-600">{tutor.max_students}</p>
                  </div>
                )}

                {/* Preferred Age Groups */}
                {tutor.preferred_age_groups && tutor.preferred_age_groups.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Preferred Age Groups:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tutor.preferred_age_groups.map((age, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                        >
                          {age}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t space-y-3">
            <button
              onClick={() => {
                // Navigate to chat with tutor
                onClose();
                // You can add navigation logic here
                console.log('Starting chat with tutor:', tutor.user_id);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Message Tutor
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileViewer;