import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, FileText, Video, Save, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const TutorCourseManager = ({ onClose }) => {
  const [courses, setCourses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Mathematics',
    level: 'Beginner',
    duration: '',
    price: 0,
    offline_available: false,
    published: false
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'document',
    file: null,
    order: 0,
    duration: 0
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://hult-ten.vercel.app/api/tutor/courses', {
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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://hult-ten.vercel.app/api/courses/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseForm)
      });
if (!response.ok) {
  const errorData = await response.json();
  console.error("Backend error:", errorData);
  throw new Error(errorData.error || "Failed to create course");
}

      const data = await response.json();
      alert('✓ Course created successfully!');
      
      setCourses([...courses, data.course]);
      setShowCreateForm(false);
      setCourseForm({
        title: '',
        description: '',
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

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.file || !selectedCourse) return;

    setUploadingMaterial(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', materialForm.file);
      formData.append('course_id', selectedCourse.id);
      formData.append('title', materialForm.title);
      formData.append('type', materialForm.type);
      formData.append('order', materialForm.order);
      formData.append('duration', materialForm.duration);

      const response = await fetch('https://hult-ten.vercel.app/api/upload/material', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      alert('✓ Material uploaded successfully!');
      setMaterialForm({ title: '', type: 'document', file: null, order: 0, duration: 0 });
      
      // Refresh course materials
      const updatedCourse = courses.find(c => c.id === selectedCourse.id);
      if (updatedCourse) {
        updatedCourse.material_count = (updatedCourse.material_count || 0) + 1;
        setCourses([...courses]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload: ' + error.message);
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? All materials will be removed.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`'https://hult-ten.vercel.app/api/courses/${courseId}`, {
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
      const response = await fetch(`'https://hult-ten.vercel.app/api/courses/${course.id}`, {
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
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg shadow-lg flex justify-between items-center">
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
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                    <label className="block text-sm font-medium mb-1">Description *</label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Describe what students will learn..."
                      required
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
                      <span className="text-sm">Available for offline download</span>
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
                          {course.material_count || 0} materials
                        </span>
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
                      <Upload size={16} />
                      Upload Materials
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

          {/* Upload Material Modal */}
          {selectedCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Upload Material</h2>
                  <button onClick={() => setSelectedCourse(null)}>
                    <X size={24} className="text-gray-500 hover:text-gray-700" />
                  </button>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-900">{selectedCourse.title}</p>
                  <p className="text-xs text-blue-700">Current materials: {selectedCourse.material_count || 0}</p>
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
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={materialForm.type}
                      onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="video">Video</option>
                      <option value="document">Document (PDF, DOC)</option>
                      <option value="presentation">Presentation</option>
                      <option value="image">Image</option>
                      <option value="audio">Audio</option>
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
                        materialForm.type === 'audio' ? 'audio/*' :
                        'image/*'
                      }
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 500MB
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
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition"
                    >
                      {uploadingMaterial ? 'Uploading...' : 'Upload Material'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
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