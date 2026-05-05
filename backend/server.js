const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',')
]
  .map((origin) => origin && origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images (Keep for legacy or hybrid storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api', aiRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RetroFits API (Appwrite) is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (Using Appwrite)`);
});

module.exports = app;
