const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Emergency Response Hub API is running!');
});

// Start server
const PORT = process.env.PORT || 8080; // Changed to 8080
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});