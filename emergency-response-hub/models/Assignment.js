module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    status: {
      type: DataTypes.ENUM('assigned', 'accepted', 'completed', 'declined'),
      defaultValue: 'assigned'
    }
  });

  return Assignment;
};