import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js'; 
import courseRoutes from './routes/courseRoutes.js';
// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running optimally.' });
});

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
// Bootstrap Server
const PORT = process.env.PORT || 5000;
console.log("Registered routes checking...");
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
 