const express = require('express');
const { Incident, User, Assignment, Volunteer } = require('../models');
const { authenticateToken, isCoordinator, isVolunteerOrCoordinator } = require('../middleware/auth');

const router = express.Router();

// Get all incidents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const incidents = await Incident.findAll({
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get incident by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username']
        },
        {
          model: Assignment,
          include: [
            {
              model: Volunteer,
              include: [
                {
                  model: User,
                  attributes: ['id', 'username']
                }
              ]
            },
            {
              model: User,
              as: 'assigner',
              attributes: ['id', 'username']
            }
          ]
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new incident
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, latitude, longitude, description, severity } = req.body;

    const incident = await Incident.create({
      type,
      latitude,
      longitude,
      description,
      severity,
      reported_by: req.user.id
    });

    // Fetch the created incident with reporter details
    const createdIncident = await Incident.findByPk(incident.id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json({
      message: 'Incident reported successfully',
      incident: createdIncident
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update incident status
router.put('/:id', authenticateToken, isCoordinator, async (req, res) => {
  try {
    const { status } = req.body;
    
    const incident = await Incident.findByPk(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await incident.update({ status });

    res.json({
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete incident (coordinators only)
router.delete('/:id', authenticateToken, isCoordinator, async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await incident.destroy();

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;