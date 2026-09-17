const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'tiffinflow-super-secret-key-2026',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, 'tiffin.db'),
  NODE_ENV: process.env.NODE_ENV || 'development'
};
