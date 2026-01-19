import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Send,
  Filter,
  Search,
  ChevronDown,
  User,
  ChartBar,
  X,
  Menu
} from 'lucide-react';

const AssignmentsScreen = ({ 
  isAuthenticated, 
  setShowLogin,
  setCurrentView,
  API_URL = 'https://hult.onrender.com'
}) => {
  const [assignments, setAssignments] = useState([
    {
      id: 1,
      title: 'Statistics Project: Data Analysis',
      course: 'Business Statistics',
      courseCode: 'BUS101',
      dueDate: '2024-02-15',
      submittedDate: '2024-02-14',
      status: 'graded',
      score: 95,
      maxScore: 100,
      classAverage: 82,
      grade: 'A',
      feedback: 'Excellent analysis! Great use of regression models. Consider adding more real-world examples.',
      files: ['project_report.pdf', 'data_analysis.xlsx'],
      lateSubmission: false,
      professor: 'Dr. Johnson',
      rubric: [
        { criterion: 'Data Analysis', score: 25, max: 25 },
        { criterion: 'Methodology', score: 30, max: 30 },
        { criterion: 'Conclusions', score: 25, max: 25 },
        { criterion: 'Presentation', score: 15, max: 20 },
      ],
    },
    {
      id: 2,
      title: 'Accounting Balance Sheet',
      course: 'Financial Accounting',
      courseCode: 'ACC201',
      dueDate: '2024-02-10',
      submittedDate: '2024-02-09',
      status: 'graded',
      score: 68,
      maxScore: 100,
      classAverage: 71,
      grade: 'D+',
      feedback: 'Please review double-entry principles. Some entries don\'t balance. Office hours available Tue/Thu.',
      files: ['balance_sheet.xlsx'],
      lateSubmission: false,
      professor: 'Prof. Chen',
      rubric: [
        { criterion: 'Accuracy', score: 40, max: 50 },
        { criterion: 'Formatting', score: 18, max: 20 },
        { criterion: 'Completeness', score: 10, max: 30 },
      ],
    },
    // ... other assignments from your original code
  ]);

  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeDistribution, setGradeDistribution] = useState([]);

  // Fetch assignments from API
  const fetchAssignments = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/student/assignments`
        
      );
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
    }
  }, [isAuthenticated]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'graded': return 'bg-emerald-100 text-emerald-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'graded': return <CheckCircle className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleSubmitAssignment = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Check if token exists
      if (!token) {
        alert('Session expired. Please login again.');
        setShowLogin(true);
        return;
      }

      const formData = new FormData();
      
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('assignment_id', selectedAssignment.id);
      formData.append('comments', comments);

      const response = await fetch(`${API_URL}/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // ✅ FIXED: Added auth header
          // Don't set Content-Type - browser sets it automatically with boundary for FormData
        },
        body: formData
      });

      if (response.ok) {
        alert('Assignment submitted successfully!');
        setIsSubmitModalOpen(false);
        setUploadedFiles([]);
        setComments('');
        fetchAssignments();
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        setShowLogin(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      alert('Failed to submit assignment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Assignments & Grades</h1>
            </div>
            <p className="text-gray-600">Submit assignments and track your grades</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLogin(true);
                  return;
                }
                setIsSubmitModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Submit Assignment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Courses</option>
              {[...new Set(assignments.map(a => a.courseCode))].map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="graded">Graded</option>
              <option value="submitted">Submitted</option>
              <option value="late">Late</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-8">
          <p>Loading assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>No assignments found</p>
          {!isAuthenticated && (
            <button
              onClick={() => setShowLogin(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Login to view assignments
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{assignment.title}</h3>
                  <p className="text-sm text-gray-600">{assignment.course} ({assignment.courseCode})</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                  {getStatusIcon(assignment.status)}
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{assignment.dueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Score</p>
                  {assignment.score !== null ? (
                    <p className={`text-lg font-bold ${getScoreColor(assignment.score / assignment.maxScore * 100)}`}>
                      {assignment.score}/{assignment.maxScore} ({((assignment.score / assignment.maxScore) * 100).toFixed(1)}%)
                    </p>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class Average</p>
                  <p className="font-medium">{assignment.classAverage || '-'}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Grade</p>
                  <p className="font-medium">{assignment.grade || '-'}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setIsDetailsModalOpen(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  View Details
                </button>
                {assignment.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsSubmitModalOpen(true);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Assignment</h2>
                <button onClick={() => setIsSubmitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedAssignment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{selectedAssignment.title}</h3>
                    <p className="text-sm text-gray-600">Due: {selectedAssignment.dueDate}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700">Click to browse or drag files here</p>
                      <p className="text-sm text-gray-500 mt-2">Max 10MB per file</p>
                    </label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                          <button
                            onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows="3"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any comments or notes..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={uploadedFiles.length === 0 || submitting}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Assignment Details</h2>
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-xl mb-2">{selectedAssignment.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Course:</span>
                      <span className="ml-2 font-medium">{selectedAssignment.course}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <span className="ml-2 font-medium">{selectedAssignment.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Professor:</span>
                      <span className="ml-2 font-medium">{selectedAssignment.professor}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 font-medium ${getStatusColor(selectedAssignment.status)} px-2 py-1 rounded-full text-xs`}>
                        {selectedAssignment.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedAssignment.score !== null && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">
                        {selectedAssignment.score}/{selectedAssignment.maxScore}
                      </div>
                      <div className="text-lg opacity-90">
                        {((selectedAssignment.score / selectedAssignment.maxScore) * 100).toFixed(1)}%
                      </div>
                      {selectedAssignment.grade && (
                        <div className="mt-2 text-sm bg-white text-blue-600 px-3 py-1 rounded-full inline-block font-bold">
                          {selectedAssignment.grade}
                        </div>
                      )}
                    </div>
                    {selectedAssignment.classAverage && (
                      <div className="mt-4 text-center text-sm opacity-90">
                        Class Average: {selectedAssignment.classAverage}%
                      </div>
                    )}
                  </div>
                )}
                
                {selectedAssignment.feedback && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Professor's Feedback</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedAssignment.feedback}</p>
                  </div>
                )}
                
                {selectedAssignment.rubric && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Grading Rubric</h4>
                    <div className="space-y-3">
                      {selectedAssignment.rubric.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{item.criterion}</span>
                            <span>{item.score}/{item.max}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(item.score / item.max) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAssignment.files && selectedAssignment.files.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Submitted Files</h4>
                    <div className="space-y-2">
                      {selectedAssignment.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span>{file}</span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsScreen;