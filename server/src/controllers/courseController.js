import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, generateUploadURL, streamToBuffer } from '../utils/s3.js';
import { Course } from '../models/Course.js';
import { UserProgress } from '../models/UserProgress.js';
import {UserStats} from '../models/UserStats.js';
import crypto from 'crypto';
import PDFParser from 'pdf2json';
import { chunkText, generateCourseSkeleton , processLessonsInParallel} from '../services/aiEngine.js';
import {User} from '../models/User.js';
// Helper to safely decode text that might contain stray '%' symbols
const safeDecodeURI = (encodedStr) => {
  try {
    return decodeURIComponent(encodedStr);
  } catch (e) {
    // If a raw '%' exists (e.g., "100%"), manually decode valid sequences and ignore the rest
    return encodedStr.replace(/(%[0-9A-F]{2})+/gi, decodeURIComponent);
  }
};

// Add this to your imports: import { User } from '../models/User.js'; (Make sure User model is imported)

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
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
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const course = await Course.findById(courseId);
    
    // 1. Find and validate lesson
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
      { userId, courseId },
      { 
        $push: { quizResults: { lessonId, score, passed } },
        $addToSet: { completedLessons: passed ? lessonId : [] }
      },
      { upsert: true }
    );

    // 4. IF PASSED: Update Streak & Activity Log (The Missing Link)
    if (passed) {
      let stats = await UserStats.findOne({ userId });
      if (!stats) {
        stats = new UserStats({ userId, currentStreak: 1, lastActiveDate: today });
        stats.activityLog.push({ date: today, lessonsCompleted: 1 });
      } else {
        const lastDate = new Date(stats.lastActiveDate);
        const currentDate = new Date(today);
        const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) stats.currentStreak += 1;
        else if (diffDays > 1) stats.currentStreak = 1;
        
        stats.lastActiveDate = today;
        if (stats.currentStreak > stats.highestStreak) stats.highestStreak = stats.currentStreak;

        const todayLog = stats.activityLog.find(log => log.date === today);
        if (todayLog) todayLog.lessonsCompleted += 1;
        else stats.activityLog.push({ date: today, lessonsCompleted: 1 });
      }
      await stats.save();
    }

    res.status(200).json({ 
      passed, 
      score, 
      correctAnswers: targetLesson.quizData.questions.map(q => q.correctAnswerIndex) 
    });
  } catch (error) {
    console.error("Quiz processing error:", error);
    res.status(500).json({ message: "Quiz processing failed" });
  }
};

// /**
//  * @desc    Get all courses for the logged-in user
//  * @route   GET /api/courses/my-courses
//  */
// export const getUserCourses = async (req, res) => {
//   try {
//     const courses = await Course.find({ userId: req.user._id }).sort({ createdAt: -1 });
//     res.status(200).json({ status: 'success', data: courses });
//   } catch (error) {
//     res.status(500).json({ status: 'error', message: 'Failed to fetch library.' });
//   }
// };

// server/src/controllers/courseController.js
/**
 * @desc    Get all courses for the logged-in user with progress attached
 * @route   GET /api/courses/my-courses
 */
export const getUserCourses = async (req, res) => {
  try {
    // 1. Fetch all courses generated by this user
    const courses = await Course.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // 2. Fetch all progress records for this user
    const progresses = await UserProgress.find({ userId: req.user._id });

    // 3. Map over courses to calculate and attach progress
    // 3. Map over courses to calculate and attach progress
    const coursesWithProgress = courses.map(course => {
      let totalLessons = 0;
      
      // Calculate total lessons in the course
      course.chapters?.forEach(ch => {
        ch.topics?.forEach(top => {
          totalLessons += top.lessons?.length || 0;
        });
      });

      // CRITICAL FIX: Added "p.courseId &&" to prevent null reference crashes
      const userProgress = progresses.find(p => p.courseId && p.courseId.toString() === course._id.toString());
      
      const completedCount = userProgress ? userProgress.completedLessons.length : 0;
      const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

      return {
        ...course.toObject(),
        progressPercentage,
        completedCount,
        totalLessons
      };
    });

    res.status(200).json({ status: 'success', data: coursesWithProgress });
  } catch (error) {
    console.error("Fetch Library Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch library.' });
  }
};

export const markLessonComplete = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0]; // Gets 'YYYY-MM-DD'

    // 1. Save Progress (Goal 1)
    await UserProgress.findOneAndUpdate(
      { userId, courseId },
      { $addToSet: { completedLessons: lessonId } },
      { upsert: true }
    );

    // 2. Calculate Streaks & Daily Stats (Goal 4)
    let stats = await UserStats.findOne({ userId });
    
    if (!stats) {
      // First time user
      stats = new UserStats({ userId, currentStreak: 1, lastActiveDate: today });
      stats.activityLog.push({ date: today, lessonsCompleted: 1 });
    } else {
      // Streak Logic
      const lastDate = new Date(stats.lastActiveDate);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        stats.currentStreak += 1; // Logged in yesterday, increment streak
      } else if (diffDays > 1) {
        stats.currentStreak = 1;  // Missed a day, reset streak
      }
      
      stats.lastActiveDate = today;
      if (stats.currentStreak > stats.highestStreak) stats.highestStreak = stats.currentStreak;

      // Log Daily Activity
      const todayLog = stats.activityLog.find(log => log.date === today);
      if (todayLog) {
        todayLog.lessonsCompleted += 1;
      } else {
        stats.activityLog.push({ date: today, lessonsCompleted: 1 });
      }
    }

    await stats.save();
    res.status(200).json({ status: 'success', currentStreak: stats.currentStreak });

  } catch (error) {
    res.status(500).json({ message: 'Error saving progress' });
  }
};

//Note Engine
// 1. Update saveNote (Add null checks)
export const saveNote = async (req, res) => {
  try {
    const { courseId, lessonId, content } = req.body;
    
    // GUARD: Stop the function immediately if no lesson is selected
    if (!lessonId) return res.status(400).json({ message: 'Lesson ID is required' });

    let progress = await UserProgress.findOne({ userId: req.user._id, courseId });
    
    if (!progress) {
      progress = new UserProgress({ userId: req.user._id, courseId, completedLessons: [], notes: [], quizResults: [] });
    }
    
    // CRITICAL FIX: Added "n.lessonId &&" before toString()
    const existingNoteIndex = progress.notes.findIndex(n => n.lessonId && n.lessonId.toString() === lessonId);
    
    if (existingNoteIndex > -1) {
      progress.notes[existingNoteIndex].content = content;
      progress.notes[existingNoteIndex].lastUpdated = Date.now();
    } else {
      progress.notes.push({ lessonId, content });
    }
    
    await progress.save();
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error("Save Note Error:", error);
    res.status(500).json({ message: 'Failed to save note' });
  }
};

// 2. Update getNote (Add null check)
export const getNote = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const progress = await UserProgress.findOne({ userId: req.user._id, courseId });
    if (!progress) return res.status(200).json({ note: "" });

    // SAFE FIND: Added n.lessonId check before toString()
    const noteObj = progress.notes.find(n => n.lessonId && n.lessonId.toString() === lessonId);
    res.status(200).json({ note: noteObj ? noteObj.content : "" });
  } catch (error) {
    console.error("Get Note Error:", error);
    res.status(500).json({ message: 'Failed to fetch note' });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const progress = await UserProgress.findOne({ userId: req.user._id, courseId });
    
    // If no progress exists yet, return an empty array
    if (!progress) {
      return res.status(200).json({ completedLessons: [] });
    }
    
    res.status(200).json({ completedLessons: progress.completedLessons });
  } catch (error) {
    console.error("Get Progress Error:", error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
};

// --- ANALYTICS ENGINE ---
export const getAnalytics = async (req, res) => {
  try {
    const stats = await UserStats.findOne({ userId: req.user._id });
    const progress = await UserProgress.find({ userId: req.user._id });
    
    // Calculate totals across all courses
    let totalTimeSeconds = 0;
    let totalLessons = 0;
    
    progress.forEach(p => {
       totalTimeSeconds += p.timeSpentSeconds || 0;
       totalLessons += p.completedLessons.length || 0;
    });

    // Calculate current month's specific data
    let monthlyLessons = 0;
    const currentMonth = new Date().toISOString().slice(0, 7); // Gets 'YYYY-MM'
    
    if (stats && stats.activityLog) {
       stats.activityLog.forEach(log => {
         if (log.date.startsWith(currentMonth)) {
           monthlyLessons += log.lessonsCompleted || 0;
         }
       });
    }

    res.status(200).json({
      currentStreak: stats?.currentStreak || 0,
      highestStreak: stats?.highestStreak || 0,
      monthlyLessons,
      totalLessons,
      totalTimeMinutes: Math.round(totalTimeSeconds / 60),
      activityLog: stats?.activityLog || []
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};