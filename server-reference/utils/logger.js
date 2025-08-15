
const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = ' ' + JSON.stringify(meta);
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'krishi-flow-server' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // MQTT specific log file
    new winston.transports.File({
      filename: path.join(logsDir, 'mqtt.log'),
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: 'MQTT' }),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 2
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 2
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create specialized loggers for different components
const mqttLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'MQTT' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'mqtt.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

const firebaseLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'Firebase' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'firebase.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Helper functions for structured logging
const loggerHelpers = {
  // Log MQTT events
  mqttEvent: (event, data = {}) => {
    mqttLogger.info('MQTT Event', { event, ...data });
  },
  
  // Log Firebase operations
  firebaseOperation: (operation, data = {}) => {
    firebaseLogger.info('Firebase Operation', { operation, ...data });
  },
  
  // Log sensor data processing
  sensorData: (sectionId, data = {}) => {
    logger.info('Sensor Data Processed', { sectionId, ...data });
  },
  
  // Log vegetation recommendations
  vegetationRecommendation: (sectionId, recommendations = []) => {
    logger.info('Vegetation Recommendation', { 
      sectionId, 
      recommendationCount: recommendations.length,
      topRecommendation: recommendations[0]?.name
    });
  },
  
  // Log system performance
  performance: (operation, duration, success = true) => {
    logger.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      success,
      timestamp: Date.now()
    });
  },
  
  // Log API requests
  apiRequest: (req, res, duration) => {
    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  },
  
  // Log security events
  security: (event, details = {}) => {
    logger.warn('Security Event', { event, ...details });
  }
};

// Extend logger with helper functions
Object.assign(logger, loggerHelpers);

// Export specialized loggers
logger.mqtt = mqttLogger;
logger.firebase = firebaseLogger;

module.exports = logger;
