import axios from 'axios';

const API = axios.create({
  // This will use the Render URL in production, and localhost in development
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', 
});


API.interceptors.request.use((req) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
  }
  return req;
});

// Authentication
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const getMe = () => API.get('/auth/me');

// Courses & PDF Processing
export const getUploadUrl = (data) => API.post('/courses/upload-url', data);
export const processPdf = (data) => API.post('/courses/process-pdf', data);

// --- NEW GENERATION ENDPOINTS ---
export const startGeneration = (courseId) => API.post(`/courses/${courseId}/generate-lessons`);
export const getCourse = (courseId) => API.get(`/courses/${courseId}`);

export default API;