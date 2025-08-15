const mqtt = require("mqtt");
const firebase = require("./firebase");
const logger = require("./utils/logger");
const {
  validateSensorData,
  processVegetationRecommendation,
} = require("./utils/dataProcessor");

class MQTTClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;

    this.topics = {
      sensorData: process.env.MQTT_TOPIC_SENSOR_DATA || "agri/irrigation/data",
      carControl: process.env.MQTT_TOPIC_CAR_CONTROL || "agri/car/control",
      systemStatus:
        process.env.MQTT_TOPIC_SYSTEM_STATUS || "agri/system/status",
    };

    this.init();
  }

  init() {
    const options = {
      clientId: process.env.MQTT_CLIENT_ID || `Krishi_Flow_${Date.now()}`,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clean: true,
      reconnectPeriod: this.reconnectDelay,
      connectTimeout: 30000,
      will: {
        topic: this.topics.systemStatus,
        payload: JSON.stringify({
          status: "offline",
          timestamp: Date.now(),
          reason: "unexpected_disconnect",
        }),
        qos: 1,
        retain: true,
      },
    };

    logger.info(`Connecting to MQTT broker: ${process.env.MQTT_BROKER_URL}`);
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on("connect", () => {
      logger.info("✅ Connected to MQTT broker");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Subscribe to sensor data topic
      this.client.subscribe(this.topics.sensorData, { qos: 1 }, (err) => {
        if (err) {
          logger.error("Failed to subscribe to sensor data topic:", err);
        } else {
          logger.info(`📡 Subscribed to ${this.topics.sensorData}`);
        }
      });

      // Publish system online status
      this.publishSystemStatus("online", "connected_successfully");

      // === ADD YOUR CUSTOM PUBLISH HERE ===
      const message = JSON.stringify({
        sectionId: "section2",
        timestamp: Date.now(),
        sensors: {
          pH: 7,
          soilMoisture: 70,
          temperature: 26,
          humidity: 60,
          gasConcentration: 0.2,
        },
      });

      this.client.publish(
        this.topics.sensorData,
        message,
        { qos: 1 },
        (err) => {
          if (err) {
            logger.error("Failed to publish initial message:", err);
          } else {
            logger.info("✅ Initial message published to sensorData topic");
          }
        }
      );
    });

  
    this.client.on("message", async (topic, message) => {
      logger.info(`📨 Received message on topic: ${topic}`);

      let data;
      try {
        data = JSON.parse(message.toString());
      } catch (error) {
        logger.error("🚨 Failed to parse MQTT message JSON:", {
          error: error.message,
          raw: message.toString(),
          topic,
        });
        return; // Stop further processing if JSON is invalid
      }

      try {
        await this.handleMessage(topic, data);
      } catch (error) {
        logger.error("🔥 Unhandled error in message handler:", error);
      }
    });

    // Assuming 'this.client' is your MQTT client instance
    /*
this.client.on('message', async (topic, message) => {
  try {
    await handleMessage(topic, message);
  } catch (error) {
    logger.error('Error handling MQTT message:', error);
  }
});

async function handleMessage(topic, message) {
  logger.info(`📨 Received message on topic: ${topic}`);

  const rawMessage = message.toString();
  console.log('Raw MQTT message:', rawMessage);

  try {
    const data = JSON.parse(rawMessage);

    if (topic === 'agri/irrigation/data') {
      await handleSensorData(data);
    }
  } catch (error) {
    logger.error('Error parsing MQTT message:', error);
    logger.error('Raw message:', rawMessage);
  }
}

async function handleSensorData(data) {
  // Your logic here
}
*/

    // change part

    this.client.on("error", (error) => {
      logger.error("MQTT connection error:", error);
      this.isConnected = false;
    });

    this.client.on("reconnect", () => {
      this.reconnectAttempts++;
      logger.info(
        `🔄 Attempting to reconnect to MQTT broker (attempt ${this.reconnectAttempts})`
      );

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error(
          "Max reconnection attempts reached, stopping reconnection"
        );
        this.client.end();
      }
    });

    this.client.on("close", () => {
      logger.warn("📡 MQTT connection closed");
      this.isConnected = false;
    });

    this.client.on("offline", () => {
      logger.warn("📡 MQTT client offline");
      this.isConnected = false;
    });
  }

  async handleMessage(topic, message) {
    logger.info(`📨 Received message on topic: ${topic}`);

    try {
      // ❌ REMOVE THIS LINE (it's wrong now)
      // const data = JSON.parse(message.toString());

      const data = message; // ✅ use directly
      if (topic === this.topics.sensorData) {
        await this.handleSensorData(data);
      }
    } catch (error) {
      logger.error("Error parsing MQTT message:", error);
      logger.error("Raw message:", JSON.stringify(message)); // optional
    }
  }

  async handleSensorData(data) {
    try {
      // Validate sensor data
      const validationResult = validateSensorData(data);
      if (!validationResult.isValid) {
        logger.error("Invalid sensor data:", validationResult.errors);
        return;
      }

      logger.info(`🌱 Processing sensor data for section: ${data.sectionId}`);

      // Store raw sensor data in Firebase
      await this.storeSensorData(data);

      // Process vegetation recommendation
      const recommendation = await processVegetationRecommendation(data);

      // Store recommendation in Firebase
      await this.storeRecommendation(data.sectionId, recommendation);

      // Send control command to smart car if needed
      if (recommendation.requiresAction) {
        await this.publishCarControl(recommendation.action);
      }

      logger.info("✅ Sensor data processed successfully");
    } catch (error) {
      logger.error("Error handling sensor data:", error);
    }
  }

  async storeSensorData(data) {
    try {
      const sensorPath = `sections/${data.sectionId}/readings`;
      const readingId = `reading_${Date.now()}`;

      await firebase
        .database()
        .ref(`${sensorPath}/${readingId}`)
        .set({
          ...data,
          processedAt: Date.now(),
        });

      // Also update latest reading
      await firebase
        .database()
        .ref(`sections/${data.sectionId}/latest`)
        .set({
          ...data,
          processedAt: Date.now(),
        });

      logger.info(`💾 Sensor data stored for section ${data.sectionId}`);
    } catch (error) {
      logger.error("Error storing sensor data:", error);
      throw error;
    }
  }

  async storeRecommendation(sectionId, recommendation) {
    try {
      const recommendationPath = `sections/${sectionId}/suggestions`;

      await firebase
        .database()
        .ref(recommendationPath)
        .set({
          ...recommendation,
          generatedAt: Date.now(),
        });

      logger.info(`🎯 Recommendation stored for section ${sectionId}`);
    } catch (error) {
      logger.error("Error storing recommendation:", error);
      throw error;
    }
  }

  async publishCarControl(action) {
    if (!this.isConnected) {
      logger.warn("Cannot publish car control - MQTT not connected");
      return;
    }

    try {
      const controlMessage = {
        command: action.command,
        parameters: action.parameters,
        timestamp: Date.now(),
        source: "vegetation_algorithm",
      };

      await this.publish(
        this.topics.carControl,
        JSON.stringify(controlMessage)
      );
      logger.info(`🚗 Car control command sent: ${action.command}`);
    } catch (error) {
      logger.error("Error publishing car control:", error);
      throw error;
    }
  }

  async publishSystemStatus(status, reason = "") {
    if (!this.client) return;

    const statusMessage = {
      status,
      reason,
      timestamp: Date.now(),
      uptime: process.uptime(),
    };

    try {
      await this.publish(
        this.topics.systemStatus,
        JSON.stringify(statusMessage),
        { retain: true }
      );
      logger.info(`📊 System status published: ${status}`);
    } catch (error) {
      logger.error("Error publishing system status:", error);
    }
  }

  async publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("MQTT client not connected"));
        return;
      }

      const defaultOptions = { qos: 1, ...options };

      this.client.publish(topic, message, defaultOptions, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      topics: this.topics,
    };
  }

  disconnect() {
    if (this.client) {
      this.publishSystemStatus("offline", "graceful_shutdown");
      this.client.end();
      logger.info("🔌 MQTT client disconnected");
    }
  }
}

// Create singleton instance
const mqttClient = new MQTTClient();

module.exports = mqttClient;
