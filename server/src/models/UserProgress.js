import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
<<<<<<< HEAD
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }], // IDs of finished lessons
  quizResults: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    score: Number,
    passed: Boolean
  }],
  currentLessonId: { type: mongoose.Schema.Types.ObjectId },
  timeSpentSeconds: { type: Number, default: 0 }
});
=======
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
  
  // NEW: Quiz Tracking
  quizResults: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    score: Number,
    passed: Boolean,
    attempts: { type: Number, default: 1 },
    lastAttempted: { type: Date, default: Date.now }
  }],
  
  // NEW: Notes Storage
  notes: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    content: String,
    lastUpdated: { type: Date, default: Date.now }
  }],
  
  timeSpentSeconds: { type: Number, default: 0 }
}, { timestamps: true });
>>>>>>> 453d276 (Initial clean commit)

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);