import cors from 'cors';

// Update your existing CORS setup to this:
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));