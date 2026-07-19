import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }], // IDs of finished lessons
  quizResults: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    score: Number,
    passed: Boolean
  }],
  currentLessonId: { type: mongoose.Schema.Types.ObjectId },
  timeSpentSeconds: { type: Number, default: 0 }
});

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);