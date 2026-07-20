import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  highestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String }, // Stored as 'YYYY-MM-DD' for easy comparison
  activityLog: [{
    date: { type: String }, // 'YYYY-MM-DD'
    timeSpentSeconds: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 }
  }]
});

export const UserStats = mongoose.model('UserStats', userStatsSchema);