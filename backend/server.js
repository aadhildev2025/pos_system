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

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/debts', debtsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
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
