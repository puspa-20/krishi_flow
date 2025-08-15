require('dotenv').config();
const admin = require('firebase-admin');
const logger = require('./utils/logger');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token"
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    
    logger.info('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  logger.error('❌ Firebase initialization error:', error);
  process.exit(1);
}

// Database helper functions
const db = admin.database();

const FirebaseService = {
  // Sensor data operations
  async saveSensorReading(sectionId, data) {
    try {
      const readingRef = db.ref(`sections/${sectionId}/readings`).push();
      await readingRef.set({
        ...data,
        id: readingRef.key,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
      
      // Update latest reading
      await db.ref(`sections/${sectionId}/latest`).set({
        ...data,
        id: readingRef.key,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
      
      return readingRef.key;
    } catch (error) {
      logger.error('Error saving sensor reading:', error);
      throw error;
    }
  },

  async getSensorReadings(sectionId, limit = 100) {
    try {
      const snapshot = await db.ref(`sections/${sectionId}/readings`)
        .orderByChild('timestamp')
        .limitToLast(limit)
        .once('value');
      
      return snapshot.val() || {};
    } catch (error) {
      logger.error('Error getting sensor readings:', error);
      throw error;
    }
  },

  async getLatestReading(sectionId) {
    try {
      const snapshot = await db.ref(`sections/${sectionId}/latest`).once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting latest reading:', error);
      throw error;
    }
  },

  // Vegetation suggestions operations
  async saveVegetationSuggestion(sectionId, suggestion) {
    try {
      await db.ref(`sections/${sectionId}/suggestions`).set({
        ...suggestion,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      });
      
      logger.info(`Vegetation suggestion saved for section ${sectionId}`);
    } catch (error) {
      logger.error('Error saving vegetation suggestion:', error);
      throw error;
    }
  },

  async getVegetationSuggestion(sectionId) {
    try {
      const snapshot = await db.ref(`sections/${sectionId}/suggestions`).once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting vegetation suggestion:', error);
      throw error;
    }
  },

  // System status operations
  async updateSystemStatus(status) {
    try {
      await db.ref('system/status').set({
        ...status,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      logger.error('Error updating system status:', error);
      throw error;
    }
  },

  async getSystemStatus() {
    try {
      const snapshot = await db.ref('system/status').once('value');
      return snapshot.val();
    } catch (error) {
      logger.error('Error getting system status:', error);
      throw error;
    }
  },

  // Section management
  async createSection(sectionId, sectionData) {
    try {
      await db.ref(`sections/${sectionId}/info`).set({
        ...sectionData,
        createdAt: admin.database.ServerValue.TIMESTAMP
      });
      
      logger.info(`Section ${sectionId} created`);
    } catch (error) {
      logger.error('Error creating section:', error);
      throw error;
    }
  },

  async getAllSections() {
    try {
      const snapshot = await db.ref('sections').once('value');
      return snapshot.val() || {};
    } catch (error) {
      logger.error('Error getting all sections:', error);
      throw error;
    }
  },

  // Real-time listeners
  onSensorDataChange(sectionId, callback) {
    const ref = db.ref(`sections/${sectionId}/latest`);
    ref.on('value', callback);
    return () => ref.off('value', callback);
  },

  onSystemStatusChange(callback) {
    const ref = db.ref('system/status');
    ref.on('value', callback);
    return () => ref.off('value', callback);
  },

  // Database utility functions
  async cleanOldReadings(sectionId, daysToKeep = 30) {
    try {
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      const snapshot = await db.ref(`sections/${sectionId}/readings`)
        .orderByChild('timestamp')
        .endAt(cutoffTime)
        .once('value');
      
      const oldReadings = snapshot.val();
      if (oldReadings) {
        await db.ref(`sections/${sectionId}/readings`).update(
          Object.keys(oldReadings).reduce((acc, key) => {
            acc[key] = null;
            return acc;
          }, {})
        );
        
        logger.info(`Cleaned ${Object.keys(oldReadings).length} old readings for section ${sectionId}`);
      }
    } catch (error) {
      logger.error('Error cleaning old readings:', error);
      throw error;
    }
  },

  // Batch operations
  async batchWrite(operations) {
    try {
      const updates = {};
      
      operations.forEach(op => {
        updates[op.path] = op.value;
      });
      
      await db.ref().update(updates);
      logger.info(`Batch write completed with ${operations.length} operations`);
    } catch (error) {
      logger.error('Error in batch write:', error);
      throw error;
    }
  }
};

module.exports = {
  admin,
  database: () => db,
  ...FirebaseService
};
