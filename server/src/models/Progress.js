import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    completedLessons: [
      {
        type: String, // String representation of the lesson ID or a composite key
      },
    ],
    completedChapters: [
      {
        type: mongoose.Schema.Types.ObjectId, // Array of completed chapter subdocument IDs
      },
    ],
    overallCompletionPercentage: {
      type: Number,
      default: 0,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0, // Incremental counter for enterprise time tracking
    },
    lastAccessedLessonId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee unique tracing metrics per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);