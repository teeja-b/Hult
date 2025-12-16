import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://educonnect-backend.onrender.com' || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (data) => {
  const res = await api.post('/register', data);
  localStorage.setItem('token', res.data.token);
  localStorage.setItem('user', JSON.stringify(res.data.user));
  return res;
};

export const login = async (data) => {
  const res = await api.post('/login', data);
  localStorage.setItem('token', res.data.token);
  localStorage.setItem('user', JSON.stringify(res.data.user));
  return res;
};

// Student
export const submitSurvey = (data) => api.post('/student/survey', data);
export const getMatchedTutors = (survey) => api.post('/student/match', survey);

// Courses
export const getCourses = () => api.get('/courses');
export const enrollCourse = (id) => api.post(`/enroll/${id}`);

export default api;

