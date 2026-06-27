require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to the database when the lambda initializes
connectDB();

module.exports = app;
