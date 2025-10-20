module.exports = (sequelize, DataTypes) => {
  const Incident = sequelize.define('Incident', {
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('reported', 'assigned', 'in progress', 'resolved'),
      allowNull: false,
      defaultValue: 'reported'
    }
  });

  return Incident;
};