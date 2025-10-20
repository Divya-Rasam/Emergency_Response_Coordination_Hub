module.exports = (sequelize, DataTypes) => {
  const Volunteer = sequelize.define('Volunteer', {
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    availability: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    current_latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    current_longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    status: {
      type: DataTypes.ENUM('available', 'assigned', 'unavailable'),
      defaultValue: 'available'
    }
  });

  return Volunteer;
};