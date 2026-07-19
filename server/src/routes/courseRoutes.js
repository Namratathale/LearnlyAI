import express from 'express';
import { getPresignedUrl, processUploadedPDF, startLessonGeneration, getCourseById, getUserCourses } from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); 

router.post('/upload-url', getPresignedUrl);
router.post('/process-pdf', processUploadedPDF);
router.post('/:id/generate-lessons', startLessonGeneration);
router.get('/:id', getCourseById);
router.get('/my-courses', getUserCourses);
export default router;