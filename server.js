const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes -- 1
const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/game');
const { initDatabase } = require('./src/database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'https://emoji-buster.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`� API endpoints at: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at: http://localhost:${PORT}/health`);
});
