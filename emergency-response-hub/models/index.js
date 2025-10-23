const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Incident = require('./Incident')(sequelize, Sequelize.DataTypes);
const Volunteer = require('./Volunteer')(sequelize, Sequelize.DataTypes);
const Assignment = require('./Assignment')(sequelize, Sequelize.DataTypes);

// Define relationships with aliases
User.hasOne(Volunteer, { foreignKey: 'user_id' });
Volunteer.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Incident, { 
  foreignKey: 'reported_by',
  as: 'reportedIncidents'  // Alias for User -> Incident relationship
});
Incident.belongsTo(User, { 
  foreignKey: 'reported_by',
  as: 'reporter'  // Alias for Incident -> User relationship
});

Incident.hasMany(Assignment, { foreignKey: 'incident_id' });
Assignment.belongsTo(Incident, { foreignKey: 'incident_id' });

Volunteer.hasMany(Assignment, { foreignKey: 'volunteer_id' });
Assignment.belongsTo(Volunteer, { foreignKey: 'volunteer_id' });

User.hasMany(Assignment, { 
  foreignKey: 'assigned_by',
  as: 'assignedAssignments'  // Alias for User -> Assignment relationship
});
Assignment.belongsTo(User, { 
  foreignKey: 'assigned_by',
  as: 'assigner'  // Alias for Assignment -> User relationship
});

module.exports = {
  sequelize,
  User,
  Incident,
  Volunteer,
  Assignment
};