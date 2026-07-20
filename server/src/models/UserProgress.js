import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
  quizResults: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    score: Number,
    passed: Boolean,
    attempts: { type: Number, default: 1 },
    lastAttempted: { type: Date, default: Date.now }
  }],
  currentLessonId: { type: mongoose.Schema.Types.ObjectId },
  notes: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    content: String,
    lastUpdated: { type: Date, default: Date.now }
  }],
  timeSpentSeconds: { type: Number, default: 0 }
}, { timestamps: true });

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);