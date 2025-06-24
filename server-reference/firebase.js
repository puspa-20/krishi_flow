require('dotenv').config(); // ensure env vars are loaded
const admin = require('firebase-admin');
const logger = require('./utils/logger');

// Prepare service account config from environment variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // replace escaped newlines
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
};

logger.info('Firebase service account config loaded:', {
  project_id: serviceAccount.project_id,
  private_key_id: serviceAccount.private_key_id,
  has_private_key: !!serviceAccount.private_key,
  client_email: serviceAccount.client_email,
  client_id: serviceAccount.client_id,
});

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    logger.info('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  logger.error('❌ Firebase initialization error:', error);
  process.exit(1);
}

const db = admin.database();

// Export your Firebase service functions here (as in your original code)...

module.exports = {
  admin,
  database: () => db,
  // Add your service functions here if needed
};
