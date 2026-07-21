import express from 'express';
import { 
  getPresignedUrl, processUploadedPDF, startLessonGeneration, 
  getCourseById, getUserCourses, getNote, saveNote, markLessonComplete,
  getCourseProgress, submitQuiz, getAnalytics, updateProfile
} from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { chatWithZoiee } from '../controllers/courseController.js';

const router = express.Router();

router.use(protect); 

// ==========================================
//  SPECIFIC ROUTES (Must go FIRST)
// ==========================================
router.post('/upload-url', getPresignedUrl);
router.post('/process-pdf', processUploadedPDF);
router.put('/profile', updateProfile);

router.get('/my-courses', getUserCourses); 

router.post('/mark-complete', markLessonComplete); 
router.get('/notes/:courseId/:lessonId', getNote);
router.post('/notes', saveNote); 
router.get('/progress/:courseId', getCourseProgress);
router.post('/submit-quiz', submitQuiz);
router.post('/chat', chatWithZoiee);
// ==========================================
//  ANALYTICS ROUTES
// ==========================================
router.get('/analytics', getAnalytics); 

// ==========================================
//  DYNAMIC ROUTES (Must go LAST)
// ==========================================
router.get('/:id', getCourseById);
router.post('/:id/generate-lessons', startLessonGeneration);

export default router; 