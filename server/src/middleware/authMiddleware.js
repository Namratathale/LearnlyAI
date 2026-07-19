import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for formal Authorization header matching 'Bearer <token>'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Isolate the token hash from the header string
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the corresponding user from the database, omitting the password hash for safety
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ status: 'fail', message: 'The user owning this token no longer exists.' });
      }

      return next(); // Pass control seamlessly to the next controller function
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({ status: 'fail', message: 'Not authorized, token validation failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided.' });
  }
};