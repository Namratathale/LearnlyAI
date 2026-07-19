import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, generateUploadURL, streamToBuffer } from '../utils/s3.js';
import { Course } from '../models/Course.js';
import crypto from 'crypto';
import PDFParser from 'pdf2json';
import { chunkText, generateCourseSkeleton , processLessonsInParallel} from '../services/aiEngine.js';

// Helper to safely decode text that might contain stray '%' symbols
const safeDecodeURI = (encodedStr) => {
  try {
    return decodeURIComponent(encodedStr);
  } catch (e) {
    // If a raw '%' exists (e.g., "100%"), manually decode valid sequences and ignore the rest
    return encodedStr.replace(/(%[0-9A-F]{2})+/gi, decodeURIComponent);
  }
};

export const getPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ status: 'fail', message: 'File name and type are required.' });
    }

    const uniqueFileKey = `${req.user._id}/${crypto.randomBytes(8).toString('hex')}-${fileName.replace(/\s+/g, '-')}`;
    
    const uploadUrl = await generateUploadURL(uniqueFileKey, fileType);

    return res.status(200).json({
      status: 'success',
      data: { uploadUrl, fileKey: uniqueFileKey }
    });
  } catch (error) {
    console.error('S3 Presigned URL Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to generate upload link.' });
  }
};

export const processUploadedPDF = async (req, res) => {
  try {
    const { fileKey, originalFileName, fileSize } = req.body;

    if (!fileKey) {
      return res.status(400).json({ status: 'fail', message: 'S3 file key is required.' });
    }

    const s3Client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });
    
    const s3Response = await s3Client.send(command);
    const pdfBuffer = await streamToBuffer(s3Response.Body);
    
    let extractedText = "";
    const originalWarn = console.warn;
    try {
      console.warn = () => {}; 
      extractedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); 
        pdfParser.on("pdfParser_dataError", (errData) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
        pdfParser.parseBuffer(pdfBuffer);
      });
    } finally {
      console.warn = originalWarn;
    }
  
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Could not extract text. The PDF might be scanned or image-based.' });
    }

    const cleanText = safeDecodeURI(extractedText).replace(/\r\n/g, ' ');

    // --- NEW: AI PIPELINE INTEGRATION ---
    
    // 1. Chunk the document
    const chunks = chunkText(cleanText);
    
    // 2. Generate the Course Skeleton via LLM
    const { skeleton } = await generateCourseSkeleton(chunks, originalFileName);

    // 3. Save everything to MongoDB
    const newCourse = await Course.create({
      userId: req.user._id,
      title: skeleton.title,
      description: skeleton.description,
      estimatedTime: skeleton.estimatedTime,
      difficultyLevel: skeleton.difficultyLevel,
      learningObjectives: skeleton.learningObjectives,
      prerequisites: skeleton.prerequisites,
      documentType: skeleton.documentType,
      pdfMetadata: { fileName: originalFileName, s3Key: fileKey, fileSize: fileSize },
      textChunks: chunks, // Store the raw chunks for the Parallel Generation phase
      chapters: skeleton.chapters,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Course Skeleton generated successfully.',
      data: {
        courseId: newCourse._id,
        skeleton: newCourse // Send the full skeleton back to the frontend immediately
      }
    });
  } catch (error) {
    console.error('PDF Processing & AI Generation Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to process document and generate course structure.' });
  }
};

/**
 * @desc    Triggers the parallel generation engine for a specific course
 * @route   POST /api/courses/:id/generate-lessons
 */
export const startLessonGeneration = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const course = await Course.findOne({ _id: courseId, userId: req.user._id });
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found.' });
    }

    // Acknowledge the request immediately so the frontend doesn't timeout
    res.status(202).json({ 
      status: 'processing', 
      message: 'Parallel generation engines engaged. The course is building.' 
    });

    // Execute the heavy lifting asynchronously in the background
    processLessonsInParallel(course, 1).catch(err => {
      console.error(`Background generation failed for course ${courseId}:`, err);
    });

  } catch (error) {
    console.error('Generation Trigger Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to initiate generation.' });
  }
};

/**
 * @desc    Get a course by ID to check its generation status
 * @route   GET /api/courses/:id
 */
export const getCourseById = async (req, res) => {
  try {
    // Ensure users can only fetch their own courses
    const course = await Course.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found.' });
    }

    return res.status(200).json({ status: 'success', data: course });
  } catch (error) {
    console.error('Fetch Course Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve course data.' });
  }
};

/**
 * @desc    Updates the time spent on a specific lesson
 * @route   POST /api/progress/update-time
 */
export const updateStudyTime = async (req, res) => {
  try {
    const { courseId, lessonId, timeToAdd } = req.body;
    
    // Atomically increment the time
    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, courseId },
      { 
        $inc: { timeSpentSeconds: timeToAdd },
        $set: { currentLessonId: lessonId }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update progress.' });
  }
};

const findLessonById = (course, lessonId) => {
  for (const chapter of course.chapters) {
    for (const topic of chapter.topics) {
      const lesson = topic.lessons.find(l => l._id.toString() === lessonId.toString());
      if (lesson) return lesson;
    }
  }
  return null;
};

export const submitQuiz = async (req, res) => {
  try {
    const { courseId, lessonId, answers } = req.body;
    const course = await Course.findById(courseId);
    
    // Use the helper
    const targetLesson = findLessonById(course, lessonId);
    
    if (!targetLesson) return res.status(404).json({ message: "Lesson not found" });
    // 2. Calculate score
    let correctCount = 0;
    targetLesson.quizData.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswerIndex) correctCount++;
    });

    const score = (correctCount / targetLesson.quizData.questions.length) * 100;
    const passed = score >= targetLesson.quizData.passingScore;

    // 3. Update Progress DB
    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, courseId: req.body.courseId },
      { 
        $push: { quizResults: { lessonId, score, passed } },
        $addToSet: { completedLessons: passed ? lessonId : [] }
      },
      { upsert: true }
    );

    res.status(200).json({ passed, score, correctAnswers: targetLesson.quizData.questions.map(q => q.correctAnswerIndex) });
  } catch (error) {
    res.status(500).json({ message: "Quiz processing failed" });
  }
};

/**
 * @desc    Get all courses for the logged-in user
 * @route   GET /api/courses/my-courses
 */
export const getUserCourses = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: courses });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch library.' });
  }
};