module.exports = (sequelize, DataTypes) => {
  const Volunteer = sequelize.define('Volunteer', {
    skills: {
      type: DataTypes.TEXT,
      defaultValue: '[]', // Store as JSON string
      get() {
        const rawValue = this.getDataValue('skills');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('skills', JSON.stringify(value));
      }
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