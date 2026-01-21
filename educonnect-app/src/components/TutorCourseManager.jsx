import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Edit, Trash2, ChevronDown, ChevronUp, BookOpen, Video, FileText, Save, AlertCircle } from 'lucide-react';

const TutorCourseManager = ({ onClose }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  
  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    overview: '',
    learning_outcomes: [''],
    prerequisites: [''],
    target_audience: '',
    category: 'Technology',
    level: 'Beginner',
    duration: '',
    price: 0,
    offline_available: false,
    published: false
  });
  
  // Section form state
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    order: 0
  });
  
  // Material upload state
  const [uploadingMaterial, setUploadingMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'video',
    file: null,
    order: 0,
    duration: 0
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseSections(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tutor/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchCourseSections = async (courseId) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/sections`);
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Filter out empty learning outcomes and prerequisites
      const cleanedForm = {
        ...courseForm,
        learning_outcomes: courseForm.learning_outcomes.filter(o => o.trim()),
        prerequisites: courseForm.prerequisites.filter(p => p.trim())
      };
      
      const response = await fetch(`${API_URL}/api/courses/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }
      
      alert('✅ Course created successfully!');
      setShowCourseForm(false);
      setCourseForm({
        title: '',
        description: '',
        overview: '',
        learning_outcomes: [''],
        prerequisites: [''],
        target_audience: '',
        category: 'Technology',
        level: 'Beginner',
        duration: '',
        price: 0,
        offline_available: false,
        published: false
      });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert(`Failed to create course: ${error.message}`);
    }
  };

  const handleCreateSection = async () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/courses/${selectedCourse.id}/sections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectionForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create section');
      }
      
      alert('✅ Section created successfully!');
      setShowSectionForm(false);
      setSectionForm({ title: '', description: '', order: 0 });
      fetchCourseSections(selectedCourse.id);
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    }
  };

  const handleMaterialUpload = async (sectionId) => {
    if (!materialForm.file) {
      alert('Please select a file');
      return;
    }
    
    setUploadingMaterial(sectionId);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('file', materialForm.file);
      formData.append('course_id', selectedCourse.id);
      formData.append('section_id', sectionId);
      formData.append('title', materialForm.title || materialForm.file.name);
      formData.append('description', materialForm.description);
      formData.append('type', materialForm.type);
      formData.append('order', materialForm.order);
      formData.append('duration', materialForm.duration);
      
      const response = await fetch(`${API_URL}/api/upload/material`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      alert('✅ Material uploaded successfully!');
      setMaterialForm({
        title: '',
        description: '',
        type: 'video',
        file: null,
        order: 0,
        duration: 0
      });
      fetchCourseSections(selectedCourse.id);
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Failed to upload material');
    } finally {
      setUploadingMaterial(null);
    }
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const addLearningOutcome = () => {
    setCourseForm({
      ...courseForm,
      learning_outcomes: [...courseForm.learning_outcomes, '']
    });
  };

  const removeLearningOutcome = (index) => {
    setCourseForm({
      ...courseForm,
      learning_outcomes: courseForm.learning_outcomes.filter((_, i) => i !== index)
    });
  };

  const updateLearningOutcome = (index, value) => {
    const updated = [...courseForm.learning_outcomes];
    updated[index] = value;
    setCourseForm({ ...courseForm, learning_outcomes: updated });
  };

  const addPrerequisite = () => {
    setCourseForm({
      ...courseForm,
      prerequisites: [...courseForm.prerequisites, '']
    });
  };

  const removePrerequisite = (index) => {
    setCourseForm({
      ...courseForm,
      prerequisites: courseForm.prerequisites.filter((_, i) => i !== index)
    });
  };

  const updatePrerequisite = (index, value) => {
    const updated = [...courseForm.prerequisites];
    updated[index] = value;
    setCourseForm({ ...courseForm, prerequisites: updated });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">📚 Enhanced Course Manager</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Course List */}
          {!selectedCourse && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Your Courses</h3>
                <button
                  onClick={() => setShowCourseForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Create New Course
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No courses yet. Create your first course!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition"
                    >
                      <h4 className="font-bold text-lg">{course.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                      <div className="flex gap-2 mt-3 text-xs">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{course.level}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{course.category}</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {course.material_count || 0} materials
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Course Details with Sections */}
          {selectedCourse && (
            <div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-blue-600 mb-4 flex items-center gap-2 hover:underline"
              >
                ← Back to Courses
              </button>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <h3 className="text-2xl font-bold mb-2">{selectedCourse.title}</h3>
                <p className="text-gray-700">{selectedCourse.description}</p>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold">Course Sections</h4>
                <button
                  onClick={() => setShowSectionForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                >
                  <Plus size={20} />
                  Add Section
                </button>
              </div>

              {/* Sections List */}
              {sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>No sections yet. Add your first section!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map(section => (
                    <div key={section.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      {/* Section Header */}
                      <div
                        onClick={() => toggleSection(section.id)}
                        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <h5 className="font-bold text-lg">{section.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {section.material_count || 0} materials
                          </p>
                        </div>
                        {expandedSections.has(section.id) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>

                      {/* Section Materials */}
                      {expandedSections.has(section.id) && (
                        <div className="p-4 bg-white">
                          {/* Upload Material */}
                          <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                            <h6 className="font-semibold mb-3">Upload Material to this Section</h6>
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Material Title"
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                              />
                              <textarea
                                placeholder="Material Description"
                                value={materialForm.description}
                                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                rows={2}
                              />
                              <input
                                type="file"
                                onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files[0] })}
                                className="w-full"
                              />
                              <button
                                onClick={() => handleMaterialUpload(section.id)}
                                disabled={uploadingMaterial === section.id}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                              >
                                <Upload size={16} />
                                {uploadingMaterial === section.id ? 'Uploading...' : 'Upload Material'}
                              </button>
                            </div>
                          </div>

                          {/* Materials List */}
                          {section.materials && section.materials.length > 0 ? (
                            <div className="space-y-2">
                              {section.materials.map(material => (
                                <div key={material.id} className="border rounded-lg p-3 flex items-start gap-3">
                                  <div className="bg-purple-100 p-2 rounded">
                                    {material.type === 'video' ? (
                                      <Video size={20} className="text-purple-600" />
                                    ) : (
                                      <FileText size={20} className="text-purple-600" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h6 className="font-semibold">{material.title}</h6>
                                    {material.description && (
                                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-2 text-xs text-gray-500">
                                      <span>{material.type}</span>
                                      <span>•</span>
                                      <span>{(material.file_size / 1024 / 1024).toFixed(1)} MB</span>
                                      {material.duration && (
                                        <>
                                          <span>•</span>
                                          <span>{material.duration} min</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-4">No materials in this section yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Course Form Modal */}
          {showCourseForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Create New Course</h3>
                  <button onClick={() => setShowCourseForm(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Short Description *</label>
                    <textarea
                      required
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Course Overview</label>
                    <textarea
                      value={courseForm.overview}
                      onChange={(e) => setCourseForm({ ...courseForm, overview: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={4}
                      placeholder="Detailed overview of what this course covers..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">What You'll Learn</label>
                    {courseForm.learning_outcomes.map((outcome, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => updateLearningOutcome(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded"
                          placeholder="Learning outcome..."
                        />
                        <button
                          onClick={() => removeLearningOutcome(index)}
                          className="text-red-600 hover:bg-red-50 px-3 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addLearningOutcome}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + Add Learning Outcome
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Prerequisites</label>
                    {courseForm.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={prereq}
                          onChange={(e) => updatePrerequisite(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded"
                          placeholder="Prerequisite..."
                        />
                        <button
                          onClick={() => removePrerequisite(index)}
                          className="text-red-600 hover:bg-red-50 px-3 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addPrerequisite}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + Add Prerequisite
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={courseForm.target_audience}
                      onChange={(e) => setCourseForm({ ...courseForm, target_audience: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Who is this course for?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Category *</label>
                      <select
                        required
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option>Technology</option>
                        <option>Science</option>
                        <option>Mathematics</option>
                        <option>Languages</option>
                        <option>Business</option>
                        <option>Arts</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Level *</label>
                      <select
                        required
                        value={courseForm.level}
                        onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={courseForm.offline_available}
                        onChange={(e) => setCourseForm({ ...courseForm, offline_available: e.target.checked })}
                      />
                      <span>Available Offline</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={courseForm.published}
                        onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })}
                      />
                      <span>Publish Immediately</span>
                    </label>
                  </div>

                  <button
                    onClick={handleCreateCourse}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Create Course
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Form Modal */}
          {showSectionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Add New Section</h3>
                  <button onClick={() => setShowSectionForm(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1">Section Title *</label>
                    <input
                      type="text"
                      required
                      value={sectionForm.title}
                      onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="e.g., Introduction to React"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Description</label>
                    <textarea
                      value={sectionForm.description}
                      onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                      placeholder="What will students learn in this section?"
                    />
                  </div>

                  <button
                    onClick={handleCreateSection}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Add Section
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorCourseManager;