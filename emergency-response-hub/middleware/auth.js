const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token is not valid' });
  }
};

// Check if user is a coordinator
const isCoordinator = (req, res, next) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Coordinator access required' });
  }
  next();
};

// Check if user is a volunteer or coordinator
const isVolunteerOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'volunteer' && req.user.role !== 'coordinator') {
    return res.status(403).json({ message: 'Volunteer or coordinator access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isCoordinator,
  isVolunteerOrCoordinator
};