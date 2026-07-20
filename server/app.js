import cors from 'cors';
<<<<<<< HEAD

=======
import progressRoutes from './routes/progressRoutes.js';

// Down where your other app.use statements are:
>>>>>>> 453d276 (Initial clean commit)
// Update your existing CORS setup to this:
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
<<<<<<< HEAD
}));
=======
}));

app.use('/api/progress', progressRoutes);
>>>>>>> 453d276 (Initial clean commit)
