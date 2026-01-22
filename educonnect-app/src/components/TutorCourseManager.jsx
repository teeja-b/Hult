import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, FileText, Video, Save, Edit, Trash2, CheckCircle, AlertCircle, FolderPlus, Download, Eye } from 'lucide-react';

const TutorCourseManager = ({ onClose }) => {
  const [courses, setCourses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [sections, setSections] = useState([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    overview: '',
    learning_outcomes: [],
    prerequisites: [],
    target_audience: '',
    category: 'Mathematics',
    level: 'Beginner',
    duration: '',
    price: 0,
    offline_available: false,
    published: false
  });

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    order: 0,
    
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'document',
    file: null,
    order: 0,
    duration: 0
  });

  const API_URL = 'https://hult.onrender.com';

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchSections(selectedCourse.id);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (courseId) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/sections`);
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/courses/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create course");
      }

      const data = await response.json();
      alert('✓ Course created successfully!');
      
      setCourses([...courses, data.course]);
      setShowCreateForm(false);
      setCourseForm({
        title: '',
        description: '',
        overview: '',
        learning_outcomes: [],
        prerequisites: [],
        target_audience: '',
        category: 'Mathematics',
        level: 'Beginner',
        duration: '',
        price: 0,
        offline_available: false,
        published: false
      });
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    
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

      if (!response.ok) throw new Error('Failed to create section');

      const data = await response.json();
      alert('✓ Section created successfully!');
      
      setSections([...sections, data.section]);
      setShowSectionForm(false);
      setSectionForm({ title: '', description: '', order: 0, offline_available: false });
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.file || !selectedCourse || !selectedSection) {
      alert('Please select a section to upload to');
      return;
    }

    setUploadingMaterial(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', materialForm.file);
      formData.append('course_id', selectedCourse.id);
      formData.append('section_id', selectedSection.id);
      formData.append('title', materialForm.title);
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
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      alert(`✓ Material uploaded successfully to Cloudinary!`);
      
      setMaterialForm({ 
        title: '', 
        description: '',
        type: 'document', 
        file: null, 
        order: 0, 
        duration: 0 
      });
      
      // Refresh sections to show new material
      await fetchSections(selectedCourse.id);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload: ' + error.message);
    } finally {
      setUploadingMaterial(false);
    }
  };

 

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section and all its materials?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Delete failed');

      alert('✓ Section deleted successfully!');
      await fetchSections(selectedCourse.id);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete section');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course? All materials will be removed.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Delete failed');

      alert('✓ Course deleted successfully!');
      setCourses(courses.filter(c => c.id !== courseId));
      setSelectedCourse(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete course');
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ published: !course.published })
      });

      if (!response.ok) throw new Error('Update failed');

      const updatedCourses = courses.map(c => 
        c.id === course.id ? { ...c, published: !c.published } : c
      );
      setCourses(updatedCourses);
      
      alert(course.published ? '✓ Course unpublished' : '✓ Course published!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update course');
    }
  };

  const getFileTypeIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={16} className="text-red-600" />;
      case 'image': return <FileText size={16} className="text-blue-600" />;
      case 'presentation': return <FileText size={16} className="text-orange-600" />;
      case 'document': return <FileText size={16} className="text-green-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg shadow-lg flex justify-between items-center z-10">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Courses</h1>
            <p className="text-blue-100">Create and manage your educational content</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Create Course Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 mb-6"
          >
            <Plus size={20} />
            Create New Course
          </button>

          {/* Create Course Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Create New Course</h2>
                  <button onClick={() => setShowCreateForm(false)}>
                    <X size={24} className="text-gray-500 hover:text-gray-700" />
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Course Title *</label>
                    <input
                      type="text"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Introduction to Python Programming"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Short Description *</label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Brief course description..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Course Overview</label>
                    <textarea
                      value={courseForm.overview}
                      onChange={(e) => setCourseForm({...courseForm, overview: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Detailed course overview..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={courseForm.target_audience}
                      onChange={(e) => setCourseForm({...courseForm, target_audience: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Who is this course for?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="Technology">Technology</option>
                        <option value="Language">Language</option>
                        <option value="Business">Business</option>
                        <option value="Arts">Arts</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Level *</label>
                      <select
                        value={courseForm.level}
                        onChange={(e) => setCourseForm({...courseForm, level: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration</label>
                      <input
                        type="text"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 8 weeks"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value)})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  
                  <div className="space-y-2">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={courseForm.offline_available}
      onChange={(e) => setCourseForm({...courseForm, offline_available: e.target.checked})}
      className="w-4 h-4"
    />
    <span className="text-sm">📥 Available for offline download</span>
  </label>
  
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={courseForm.published}
      onChange={(e) => setCourseForm({...courseForm, published: e.target.checked})}
      className="w-4 h-4"
    />
    <span className="text-sm">Publish immediately</span>
  </label>
</div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                      {loading ? 'Creating...' : 'Create Course'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Course List */}
          <div className="space-y-4">
            {courses.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{course.title}</h3>
                        {course.published ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            <CheckCircle size={12} className="inline mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            <AlertCircle size={12} className="inline mr-1" />
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="bg-blue-100 px-2 py-1 rounded">{course.category}</span>
                        <span className="bg-purple-100 px-2 py-1 rounded">{course.level}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {course.total_students || 0} students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1"
                    >
                      <FolderPlus size={16} />
                      Manage Sections
                    </button>
                    <button
                      onClick={() => handleTogglePublish(course)}
                      className={`flex-1 py-2 rounded transition text-sm ${
                        course.published 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {course.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sections Manager Modal */}
          {selectedCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                    <p className="text-sm text-blue-100">Manage sections and materials</p>
                  </div>
                  <button onClick={() => {
                    setSelectedCourse(null);
                    setSelectedSection(null);
                  }}>
                    <X size={24} className="hover:bg-white/20 rounded p-1" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Create Section Button */}
                  <button
                    onClick={() => setShowSectionForm(true)}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2 mb-4"
                  >
                    <Plus size={16} />
                    Add New Section
                  </button>

                  {/* Create Section Form */}
                  {showSectionForm && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
                      <h3 className="font-bold mb-3">New Section</h3>
                      <form onSubmit={handleCreateSection} className="space-y-3">
                        <input
                          type="text"
                          value={sectionForm.title}
                          onChange={(e) => setSectionForm({...sectionForm, title: e.target.value})}
                          className="w-full p-2 border rounded"
                          placeholder="Section title (e.g., Module 1: Introduction)"
                          required
                        />
                        <textarea
                          value={sectionForm.description}
                          onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                          className="w-full p-2 border rounded"
                          rows="2"
                          placeholder="Section description (optional)"
                        />
                        <div className="flex gap-4 items-center">
                          <input
                            type="number"
                            value={sectionForm.order}
                            onChange={(e) => setSectionForm({...sectionForm, order: parseInt(e.target.value)})}
                            className="w-24 p-2 border rounded"
                            placeholder="Order"
                            min="0"
                          />
                        
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                          >
                            Create Section
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSectionForm(false)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Sections List */}
                  {sections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FolderPlus size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>No sections yet. Create one to start adding materials.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map(section => (
                        <div key={section.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-800">{section.title}</h4>
                             
                              </div>
                              {section.description && (
                                <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                {section.material_count || 0} materials
                              </p>
                            </div>
                            <div className="flex gap-2">
                            
                              <button
                                onClick={() => handleDeleteSection(section.id)}
                                className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Materials in Section */}
                          {section.materials && section.materials.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {section.materials.map((material, idx) => (
                                <div key={material.id} className="bg-white rounded p-3 flex items-center gap-3 border">
                                  <div className="p-2 bg-gray-100 rounded">
                                    {getFileTypeIcon(material.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{idx + 1}. {material.title}</p>
                                    <p className="text-xs text-gray-500 capitalize">{material.type}</p>
                                  </div>
                                  {material.duration > 0 && (
                                    <span className="text-xs text-gray-500">{material.duration} min</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload Material Button */}
                          <button
                            onClick={() => setSelectedSection(section)}
                            className="mt-3 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2"
                          >
                            <Upload size={16} />
                            Upload Material to this Section
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upload Material Modal */}
          {selectedSection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Upload Material</h2>
                    <p className="text-sm text-gray-600">to {selectedSection.title}</p>
                  </div>
                  <button onClick={() => setSelectedSection(null)}>
                    <X size={24} className="text-gray-500 hover:text-gray-700" />
                  </button>
                </div>

                <form onSubmit={handleUploadMaterial} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Material Title *</label>
                    <input
                      type="text"
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Lesson 1: Introduction"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Brief description of this material..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={materialForm.type}
                      onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="video">Video</option>
                      <option value="document">Document (PDF, DOC, DOCX)</option>
                      <option value="presentation">Presentation (PPT, PPTX)</option>
                      <option value="image">Image (JPG, PNG, GIF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">File *</label>
                    <input
                      type="file"
                      onChange={(e) => setMaterialForm({...materialForm, file: e.target.files[0]})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      accept={
                        materialForm.type === 'video' ? 'video/*' :
                        materialForm.type === 'document' ? '.pdf,.doc,.docx,.txt' :
                        materialForm.type === 'presentation' ? '.ppt,.pptx' :
                        'image/*'
                      }
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 500MB | Accepted: {
                        materialForm.type === 'video' ? 'MP4, MOV, AVI, WebM' :
                        materialForm.type === 'document' ? 'PDF, DOC, DOCX, TXT' :
                        materialForm.type === 'presentation' ? 'PPT, PPTX' :
                        'JPG, PNG, GIF'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Order</label>
                      <input
                        type="number"
                        value={materialForm.order}
                        onChange={(e) => setMaterialForm({...materialForm, order: parseInt(e.target.value)})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={materialForm.duration}
                        onChange={(e) => setMaterialForm({...materialForm, duration: parseInt(e.target.value)})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="Optional"
                      />
                    </div>
                  </div>


                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={uploadingMaterial}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                    >
                      {uploadingMaterial ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload to Cloudinary
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSection(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
                      disabled={uploadingMaterial}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorCourseManager;