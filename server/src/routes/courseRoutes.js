import express from 'express';
<<<<<<< HEAD
import { getPresignedUrl, processUploadedPDF, startLessonGeneration, getCourseById, getUserCourses } from '../controllers/courseController.js';
=======
import { 
  getPresignedUrl, 
  processUploadedPDF, 
  startLessonGeneration, 
  getCourseById, 
  getUserCourses, 
  getNote, 
  saveNote,
  markLessonComplete,
  getCourseProgress,
  submitQuiz
} from '../controllers/courseController.js';
>>>>>>> 453d276 (Initial clean commit)
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); 

<<<<<<< HEAD
router.post('/upload-url', getPresignedUrl);
router.post('/process-pdf', processUploadedPDF);
router.post('/:id/generate-lessons', startLessonGeneration);
router.get('/:id', getCourseById);
router.get('/my-courses', getUserCourses);
=======
// --- SPECIFIC ROUTES (Must go above /:id) ---
router.post('/upload-url', getPresignedUrl);
router.post('/process-pdf', processUploadedPDF);
router.get('/my-courses', getUserCourses);

router.post('/mark-complete', markLessonComplete); 
router.get('/notes/:courseId/:lessonId', getNote);
router.post('/notes', saveNote); 
router.get('/progress/:courseId', getCourseProgress); 

// --- DYNAMIC ROUTES (Must go at the bottom) ---
router.get('/:id', getCourseById);
router.post('/:id/generate-lessons', startLessonGeneration);
router.post('/:id/submit-quiz', submitQuiz);

>>>>>>> 453d276 (Initial clean commit)
export default router;