import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, closeDB } from './config/db.js';
import modelRoutes from './routes/model.js';
import predictionRoutes from './routes/predictions.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For development flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api/model', modelRoutes);
app.use('/api/predictions', predictionRoutes);

// Base route for API documentation / health check
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'House Price Prediction API is running.',
    endpoints: {
      model_info: '/api/model/info',
      retrain: '/api/model/retrain [POST]',
      predict: '/api/predictions [POST]',
      history: '/api/predictions [GET]',
      feedback: '/api/predictions/:id/feedback [POST]',
      delete_prediction: '/api/predictions/:id [DELETE]'
    }
  });
});

// Start DB and Express Server
const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle graceful shutdowns
  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('Express server closed.');
      await closeDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
