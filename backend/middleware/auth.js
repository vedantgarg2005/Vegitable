const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, async () => {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

module.exports = { auth, adminAuth };