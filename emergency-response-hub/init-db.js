const { sequelize } = require('./models');

async function initializeDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database & tables created successfully!');
  } catch (error) {
    console.error('Error creating database tables:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase();