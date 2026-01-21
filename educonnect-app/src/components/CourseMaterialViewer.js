import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Users, Award, BookOpen, PlayCircle } from 'lucide-react';

const CourseMaterialsViewer = ({ course, onBack, onEnroll, API_URL }) => {
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set([0])); // First section expanded by default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (course?.id) {
      fetchCourseSections();
    }
  }, [course]);

  const fetchCourseSections = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${course.id}/sections`);
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const totalMaterials = sections.reduce((sum, section) => sum + (section.material_count || 0), 0);
  const totalDuration = sections.reduce((sum, section) => {
    return sum + (section.materials || []).reduce((matSum, mat) => matSum + (mat.duration || 0), 0);
  }, 0);

  // Parse learning outcomes and prerequisites
  const learningOutcomes = course.learning_outcomes ? JSON.parse(course.learning_outcomes) : [];
  const prerequisites = course.prerequisites ? JSON.parse(course.prerequisites) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button 
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Courses
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
          <div className="flex gap-2 mb-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.level}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.category}</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
          <p className="text-blue-100 text-lg mb-4">{course.description}</p>
          
          {/* Course Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{course.total_students || 0} students</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span>{totalMaterials} materials</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{totalDuration > 60 ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : `${totalDuration}m`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} />
              <span>⭐ {course.rating || 'New'}</span>
            </div>
          </div>
        </div>

        {/* Course Overview */}
        {course.overview && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">Course Overview</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{course.overview}</p>
          </div>
        )}

        {/* What You'll Learn */}
        {learningOutcomes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Content - Sections */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Course Content</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading course content...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Course content coming soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className="w-full bg-gray-50 hover:bg-gray-100 transition p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {sectionIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {section.material_count || 0} materials
                        </p>
                      </div>
                    </div>
                    {expandedSections.has(sectionIndex) ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </button>

                  {/* Section Materials */}
                  {expandedSections.has(sectionIndex) && (
                    <div className="bg-white p-4 border-t border-gray-200">
                      {section.materials && section.materials.length > 0 ? (
                        <div className="space-y-2">
                          {section.materials.map((material, matIndex) => (
                            <div
                              key={material.id}
                              className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                            >
                              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full flex-shrink-0">
                                {material.type === 'video' ? (
                                  <PlayCircle size={16} className="text-purple-600" />
                                ) : (
                                  <BookOpen size={16} className="text-purple-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{material.title}</h4>
                                    {material.description && (
                                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                    )}
                                  </div>
                                  {material.duration && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                                      <Clock size={12} />
                                      {material.duration}m
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                                    {material.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4 text-sm">
                          No materials in this section yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
            <ul className="space-y-2">
              {prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Target Audience */}
        {course.target_audience && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">Who This Course Is For</h2>
            <p className="text-gray-700 leading-relaxed">{course.target_audience}</p>
          </div>
        )}

        {/* Instructor Info */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">About the Instructor</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {course.tutor_name?.charAt(0) || 'T'}
            </div>
            <div>
              <h3 className="font-bold text-lg">{course.tutor_name || 'Instructor'}</h3>
              <p className="text-gray-600 text-sm">Course Instructor</p>
            </div>
          </div>
        </div>

        {/* Enroll Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg rounded-t-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {course.price > 0 ? `$${course.price}` : 'Free'}
              </p>
              {course.offline_available && (
                <p className="text-sm text-green-600">✓ Available offline</p>
              )}
            </div>
            <button
              onClick={onEnroll}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:shadow-xl transition flex-shrink-0"
            >
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseMaterialsViewer;