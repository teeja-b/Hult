import axios from 'axios';

// FIXED: Use REACT_APP_API_URL and fallback to production URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

console.log('🔥 API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
   // IMPORTANT: Include credentials for CORS
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Authentication endpoints - FIXED: Added /api prefix
export const register = async (data) => {
  try {
    const res = await api.post('/api/register', data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

export const login = async (data) => {
  try {
    const res = await api.post('/api/login', data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

// Student endpoints - FIXED: Added /api prefix
export const submitSurvey = (data) => api.post('/api/student/survey', data);
export const getMatchedTutors = (survey) => api.post('/api/student/match', survey);
export const getStudentProfile = () => api.get('/api/student/profile');
export const updateStudentProfile = (data) => api.put('/api/student/profile', data);
export const getStudentEnrollments = () => api.get('/api/student/enrollments');

// Course endpoints - FIXED: Added /api prefix
export const getCourses = () => api.get('/api/courses');
export const getCourse = (id) => api.get(`/api/courses/${id}`);
export const enrollCourse = (id) => api.post(`/api/courses/${id}/enroll`);
export const getCourseMaterials = (courseId) => api.get(`/api/courses/${courseId}/materials`);

// Tutor endpoints - FIXED: Added /api prefix
export const getTutors = () => api.get('/api/tutors');
export const getTutorProfile = () => api.get('/api/tutor/profile');
export const updateTutorProfile = (data) => api.put('/api/tutor/profile', data);
export const getTutorCourses = () => api.get('/api/tutor/courses');
export const createCourse = (data) => api.post('/api/courses/create', data);
export const updateCourse = (id, data) => api.put(`/api/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/api/courses/${id}`);
export const getTutorStats = () => api.get('/api/tutor/stats');

// Material endpoints - FIXED: Added /api prefix
export const uploadMaterial = (courseId, formData) => {
  return api.post('/api/upload/material', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteMaterial = (materialId) => api.delete(`/api/materials/${materialId}`);

// Messaging endpoints - FIXED: Added /api prefix
export const getTutorConversations = (tutorId) => api.get(`/api/tutors/${tutorId}/conversations`);
export const getStudentConversations = (studentId) => api.get(`/api/students/${studentId}/conversations`);
export const getConversationMessages = (conversationId) => api.get(`/api/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, data) => api.post(`/api/conversations/${conversationId}/messages`, data);

// Offline download endpoints - FIXED: Added /api prefix
export const downloadCourseForOffline = (courseId) => api.post(`/api/courses/${courseId}/download`);
export const getUserDownloads = () => api.get('/api/student/downloads');
export const removeOfflineDownload = (courseId) => api.delete(`/api/courses/${courseId}/download`);

// Certificate endpoints - FIXED: Added /api prefix
export const generateCertificates = (courseId) => api.post(`/api/courses/${courseId}/generate-certificates`);
export const downloadCertificate = (certificateId) => {
  return api.get(`/api/certificates/${certificateId}/download`, {
    responseType: 'blob'
  });
};

// Progress tracking - FIXED: Added /api prefix
export const updateEnrollmentProgress = (enrollmentId, progress) => {
  return api.put(`/api/enrollments/${enrollmentId}/progress`, { progress });
};

// Utility function to check API health
export const checkApiHealth = async () => {
  try {
    const res = await api.get('/api/test');
    console.log('✅ API is healthy:', res.data);
    return true;
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    return false;
  }
};
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/api/user/delete-account');
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
export default api;
