const express = require('express');
const { Volunteer, User, Assignment } = require('../models');
const { authenticateToken, isCoordinator, isVolunteerOrCoordinator } = require('../middleware/auth');

const router = express.Router();

// Get all volunteers (coordinators only)
router.get('/', authenticateToken, isCoordinator, async (req, res) => {
  try {
    const volunteers = await Volunteer.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json(volunteers);
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get volunteer profile (own profile or coordinator)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const volunteerId = parseInt(req.params.id);
    
    // Check if user is accessing their own profile or is a coordinator
    if (req.user.role !== 'coordinator' && req.user.id !== volunteerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const volunteer = await Volunteer.findOne({
      where: { user_id: volunteerId },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email', 'role']
        }
      ]
    });

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json(volunteer);
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update volunteer profile (own profile or coordinator)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const volunteerId = parseInt(req.params.id);
    
    // Check if user is updating their own profile or is a coordinator
    if (req.user.role !== 'coordinator' && req.user.id !== volunteerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { skills, availability, current_latitude, current_longitude, status } = req.body;

    const volunteer = await Volunteer.findOne({
      where: { user_id: volunteerId }
    });

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    await volunteer.update({
      skills,
      availability,
      current_latitude,
      current_longitude,
      status
    });

    res.json({
      message: 'Volunteer profile updated successfully',
      volunteer
    });
  } catch (error) {
    console.error('Update volunteer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
