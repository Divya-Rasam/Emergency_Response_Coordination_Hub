const express = require('express');
const { Assignment, Incident, Volunteer, User } = require('../models');
const { authenticateToken, isCoordinator, isVolunteerOrCoordinator } = require('../middleware/auth');

const router = express.Router();

// Get all assignments (coordinators see all, volunteers see their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let assignments;
    
    if (req.user.role === 'coordinator') {
      // Coordinators can see all assignments
      assignments = await Assignment.findAll({
        include: [
          {
            model: Incident,
            include: [
              {
                model: User,
                as: 'reporter',
                attributes: ['id', 'username']
              }
            ]
          },
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
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Volunteers can only see their own assignments
      const volunteer = await Volunteer.findOne({
        where: { user_id: req.user.id }
      });

      if (!volunteer) {
        return res.status(404).json({ message: 'Volunteer profile not found' });
      }

      assignments = await Assignment.findAll({
        where: { volunteer_id: volunteer.id },
        include: [
          {
            model: Incident,
            include: [
              {
                model: User,
                as: 'reporter',
                attributes: ['id', 'username']
              }
            ]
          },
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
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get assignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        {
          model: Incident,
          include: [
            {
              model: User,
              as: 'reporter',
              attributes: ['id', 'username']
            }
          ]
        },
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
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is authorized to view this assignment
    if (req.user.role !== 'coordinator' && assignment.Volunteer.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Create a new assignment (coordinators only)
router.post('/', authenticateToken, isCoordinator, async (req, res) => {
  try {
    console.log('Creating assignment with data:', req.body);
    
    const { incident_id, volunteer_id } = req.body;

    // Validate required fields
    if (!incident_id || !volunteer_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if incident exists
    const incident = await Incident.findByPk(incident_id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check if volunteer exists
    const volunteer = await Volunteer.findByPk(volunteer_id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Check if volunteer is available
    if (!volunteer.availability || volunteer.status !== 'available') {
      return res.status(400).json({ message: 'Volunteer is not available' });
    }

    // Check if assignment already exists
    const existingAssignment = await Assignment.findOne({
      where: { incident_id, volunteer_id }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Assignment already exists' });
    }

    const assignment = await Assignment.create({
      incident_id,
      volunteer_id,
      assigned_by: req.user.id
    });

    console.log('Assignment created:', assignment.toJSON());

    // Update volunteer status
    await volunteer.update({ status: 'assigned' });

    // Update incident status
    await incident.update({ status: 'assigned' });

    // Fetch the created assignment with all details
    const createdAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        {
          model: Incident
        },
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
    });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: createdAssignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update assignment status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: Incident },
        { model: Volunteer }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is authorized to update this assignment
    if (req.user.role !== 'coordinator' && assignment.Volunteer.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update assignment status
    await assignment.update({ status });

    // Update volunteer status based on assignment status
    if (status === 'completed' || status === 'declined') {
      await assignment.Volunteer.update({ status: 'available' });
    } else if (status === 'accepted') {
      await assignment.Volunteer.update({ status: 'assigned' });
    }

    // Update incident status based on assignment status
    if (status === 'accepted') {
      await assignment.Incident.update({ status: 'in progress' });
    } else if (status === 'completed') {
      await assignment.Incident.update({ status: 'resolved' });
    }

    res.json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delete assignment (coordinators only)
router.delete('/:id', authenticateToken, isCoordinator, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: Incident },
        { model: Volunteer }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update volunteer status back to available
    await assignment.Volunteer.update({ status: 'available' });

    // Update incident status back to reported
    await assignment.Incident.update({ status: 'reported' });

    await assignment.destroy();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;