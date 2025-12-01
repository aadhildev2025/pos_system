const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authMiddleware = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const transactionsRoutes = require('./routes/transactions');
const debtsRoutes = require('./routes/debts');

const app = express();

// CORS configuration for separate frontend deployment
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection for Serverless
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  try {
    await connectDB();
    isConnected = true;

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'Server is running', db: isConnected ? 'connected' : 'disconnected' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    });

    const PORT = process.env.PORT || 5000;

    // For local development
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log('Backend server restarted at ' + new Date().toISOString() + ' - Master Key Active');
      });
    }

    // Export for Vercel serverless functions
    module.exports = app;
