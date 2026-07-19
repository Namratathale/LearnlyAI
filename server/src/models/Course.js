import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sourceChunkRange: [{ type: Number }], // Updated to accept [startIndex, endIndex]
  generationStatus: { 
    type: String, 
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending' 
  },
  explanation: { type: String }, 
  keyTakeaways: [{ type: String }],
  importantNotes: [{ type: String }],
  realWorldExamples: [{ type: String }],
  summary: { type: String },
  type: { type: String, enum: ['content', 'quiz'], default: 'content' },
  quizData: {
    questions: [{
      question: String,
      options: [String],
      correctAnswerIndex: Number,
      explanation: String
    }],
    passingScore: { type: Number, default: 70 }
  }
});

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [lessonSchema],
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  topics: [topicSchema],
});

const courseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    estimatedTime: { type: String },
    learningObjectives: [{ type: String }],
    prerequisites: [{ type: String }],
    difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    documentType: { type: String }, // Added to match your new schema
    pdfMetadata: { fileName: { type: String }, s3Key: { type: String }, fileSize: { type: Number } },
    textChunks: [{ type: String }], 
    chapters: [chapterSchema],
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);