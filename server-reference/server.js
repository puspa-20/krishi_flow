const express = require('express');
const cors = require('cors');
const mqttClient = require('./mqtt');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Commenting out MQTT and Firebase for debugging startup issues
// const mqttClient = require('./mqtt');
// const firebase = require('./firebase');

const sensorRoutes = require('./routes/sensors');
const controlRoutes = require('./routes/control');
const systemRoutes = require('./routes/system');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/system', systemRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler:', err);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(status).json({
    error: 'Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Catch unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

// Start server
console.log('Starting server...');
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  logger.info(`🚀 EcoSmart Garden Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
