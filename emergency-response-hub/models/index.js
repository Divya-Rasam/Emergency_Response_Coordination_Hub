const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Incident = require('./Incident')(sequelize, Sequelize.DataTypes);
const Volunteer = require('./Volunteer')(sequelize, Sequelize.DataTypes);
const Assignment = require('./Assignment')(sequelize, Sequelize.DataTypes);

// Define relationships
User.hasOne(Volunteer, { foreignKey: 'user_id' });
Volunteer.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Incident, { foreignKey: 'reported_by' });
Incident.belongsTo(User, { foreignKey: 'reported_by' });

Incident.hasMany(Assignment, { foreignKey: 'incident_id' });
Assignment.belongsTo(Incident, { foreignKey: 'incident_id' });

Volunteer.hasMany(Assignment, { foreignKey: 'volunteer_id' });
Assignment.belongsTo(Volunteer, { foreignKey: 'volunteer_id' });

User.hasMany(Assignment, { foreignKey: 'assigned_by' });
Assignment.belongsTo(User, { foreignKey: 'assigned_by' });

module.exports = {
  sequelize,
  User,
  Incident,
  Volunteer,
  Assignment
};