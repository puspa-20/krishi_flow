
const Joi = require('joi');
const logger = require('./logger');

// Validation schema for sensor data
const sensorDataSchema = Joi.object({
  sectionId: Joi.string().required(),
 timestamp: Joi.number().integer().min(0).required(),

  sensors: Joi.object({
    pH: Joi.number().min(0).max(14).required(),
    soilMoisture: Joi.number().min(0).max(100).required(),
    temperature: Joi.number().min(-50).max(100).required(),
    humidity: Joi.number().min(0).max(100).required(),
    gasConcentration: Joi.number().min(0).max(10).required()
  }).required()
});

// Plant database with growing requirements
const PLANT_DATABASE = {
  'Tomatoes': {
    pH: { min: 6.0, max: 6.8, optimal: 6.4 },
    moisture: { min: 40, max: 70, optimal: 55 },
    temperature: { min: 18, max: 30, optimal: 24 },
    humidity: { min: 50, max: 80, optimal: 65 },
    gasConcentration: { max: 0.3 },
    growingSeason: ['spring', 'summer'],
    category: 'fruit'
  },
  'Peppers': {
    pH: { min: 6.0, max: 7.0, optimal: 6.5 },
    moisture: { min: 35, max: 65, optimal: 50 },
    temperature: { min: 20, max: 32, optimal: 26 },
    humidity: { min: 45, max: 75, optimal: 60 },
    gasConcentration: { max: 0.35 },
    growingSeason: ['spring', 'summer'],
    category: 'fruit'
  },
  'Cucumbers': {
    pH: { min: 6.0, max: 7.0, optimal: 6.5 },
    moisture: { min: 50, max: 80, optimal: 65 },
    temperature: { min: 18, max: 28, optimal: 23 },
    humidity: { min: 60, max: 90, optimal: 75 },
    gasConcentration: { max: 0.25 },
    growingSeason: ['spring', 'summer'],
    category: 'fruit'
  },
  'Lettuce': {
    pH: { min: 6.0, max: 7.5, optimal: 6.8 },
    moisture: { min: 45, max: 75, optimal: 60 },
    temperature: { min: 12, max: 24, optimal: 18 },
    humidity: { min: 50, max: 85, optimal: 70 },
    gasConcentration: { max: 0.2 },
    growingSeason: ['spring', 'fall', 'winter'],
    category: 'leafy'
  },
  'Spinach': {
    pH: { min: 6.0, max: 7.5, optimal: 6.8 },
    moisture: { min: 40, max: 70, optimal: 55 },
    temperature: { min: 10, max: 20, optimal: 15 },
    humidity: { min: 45, max: 80, optimal: 65 },
    gasConcentration: { max: 0.25 },
    growingSeason: ['spring', 'fall', 'winter'],
    category: 'leafy'
  },
  'Herbs': {
    pH: { min: 6.0, max: 7.5, optimal: 6.8 },
    moisture: { min: 30, max: 60, optimal: 45 },
    temperature: { min: 15, max: 28, optimal: 22 },
    humidity: { min: 40, max: 70, optimal: 55 },
    gasConcentration: { max: 0.3 },
    growingSeason: ['spring', 'summer', 'fall'],
    category: 'herbs'
  },
  'Carrots': {
    pH: { min: 6.0, max: 7.0, optimal: 6.5 },
    moisture: { min: 35, max: 65, optimal: 50 },
    temperature: { min: 12, max: 25, optimal: 18 },
    humidity: { min: 45, max: 75, optimal: 60 },
    gasConcentration: { max: 0.4 },
    growingSeason: ['spring', 'fall'],
    category: 'root'
  },
  'Radishes': {
    pH: { min: 6.0, max: 7.0, optimal: 6.5 },
    moisture: { min: 40, max: 70, optimal: 55 },
    temperature: { min: 10, max: 22, optimal: 16 },
    humidity: { min: 50, max: 80, optimal: 65 },
    gasConcentration: { max: 0.35 },
    growingSeason: ['spring', 'fall'],
    category: 'root'
  },
  'Onions': {
    pH: { min: 6.0, max: 7.5, optimal: 6.8 },
    moisture: { min: 25, max: 55, optimal: 40 },
    temperature: { min: 12, max: 28, optimal: 20 },
    humidity: { min: 40, max: 70, optimal: 55 },
    gasConcentration: { max: 0.45 },
    growingSeason: ['spring', 'summer', 'fall'],
    category: 'bulb'
  },
  'Beans': {
    pH: { min: 6.0, max: 7.5, optimal: 6.8 },
    moisture: { min: 35, max: 65, optimal: 50 },
    temperature: { min: 18, max: 30, optimal: 24 },
    humidity: { min: 50, max: 80, optimal: 65 },
    gasConcentration: { max: 0.3 },
    growingSeason: ['spring', 'summer'],
    category: 'legume'
  },
  'Peas': {
    pH: { min: 6.0, max: 7.5, optimal: 6.8 },
    moisture: { min: 40, max: 70, optimal: 55 },
    temperature: { min: 10, max: 22, optimal: 16 },
    humidity: { min: 50, max: 85, optimal: 70 },
    gasConcentration: { max: 0.25 },
    growingSeason: ['spring', 'fall'],
    category: 'legume'
  },
  'Corn': {
    pH: { min: 6.0, max: 7.0, optimal: 6.5 },
    moisture: { min: 45, max: 75, optimal: 60 },
    temperature: { min: 18, max: 35, optimal: 27 },
    humidity: { min: 55, max: 85, optimal: 70 },
    gasConcentration: { max: 0.4 },
    growingSeason: ['spring', 'summer'],
    category: 'grain'
  }
};

/**
 * Validate incoming sensor data
 */
function validateSensorData(data) {
  const { error, value } = sensorDataSchema.validate(data);
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      data: null
    };
  }
  
  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Calculate compatibility score between sensor data and plant requirements
 */
function calculatePlantCompatibility(sensorData, plantRequirements) {
  const sensors = sensorData.sensors;
  let totalScore = 0;
  let factorCount = 0;
  
  // pH score
  const pHScore = calculateParameterScore(
    sensors.pH,
    plantRequirements.pH.min,
    plantRequirements.pH.max,
    plantRequirements.pH.optimal
  );
  totalScore += pHScore * 0.25; // 25% weight
  factorCount += 0.25;
  
  // Moisture score
  const moistureScore = calculateParameterScore(
    sensors.soilMoisture,
    plantRequirements.moisture.min,
    plantRequirements.moisture.max,
    plantRequirements.moisture.optimal
  );
  totalScore += moistureScore * 0.25; // 25% weight
  factorCount += 0.25;
  
  // Temperature score
  const tempScore = calculateParameterScore(
    sensors.temperature,
    plantRequirements.temperature.min,
    plantRequirements.temperature.max,
    plantRequirements.temperature.optimal
  );
  totalScore += tempScore * 0.25; // 25% weight
  factorCount += 0.25;
  
  // Humidity score
  const humidityScore = calculateParameterScore(
    sensors.humidity,
    plantRequirements.humidity.min,
    plantRequirements.humidity.max,
    plantRequirements.humidity.optimal
  );
  totalScore += humidityScore * 0.15; // 15% weight
  factorCount += 0.15;
  
  // Gas concentration score (lower is better)
  const gasScore = sensors.gasConcentration <= plantRequirements.gasConcentration.max ? 100 : 0;
  totalScore += gasScore * 0.10; // 10% weight
  factorCount += 0.10;
  
  return Math.round(totalScore / factorCount);
}

/**
 * Calculate score for individual parameter
 */
function calculateParameterScore(value, min, max, optimal) {
  if (value < min || value > max) {
    // Outside acceptable range
    const distanceFromRange = Math.min(
      Math.abs(value - min),
      Math.abs(value - max)
    );
    // Gradual decrease in score based on distance
    return Math.max(0, 100 - (distanceFromRange * 10));
  }
  
  // Within acceptable range
  const distanceFromOptimal = Math.abs(value - optimal);
  const rangeSize = max - min;
  const normalizedDistance = distanceFromOptimal / (rangeSize / 2);
  
  return Math.max(60, 100 - (normalizedDistance * 40));
}

/**
 * Generate vegetation recommendations based on sensor data
 */
async function processVegetationRecommendation(sensorData) {
  try {
    logger.info(`Processing vegetation recommendation for section ${sensorData.sectionId}`);
    
    const plantScores = [];
    
    // Calculate compatibility score for each plant
    for (const [plantName, requirements] of Object.entries(PLANT_DATABASE)) {
      const score = calculatePlantCompatibility(sensorData, requirements);
      plantScores.push({
        name: plantName,
        score,
        category: requirements.category,
        requirements
      });
    }
    
    // Sort by score (highest first)
    plantScores.sort((a, b) => b.score - a.score);
    
    // Get top 3 recommendations
    const topRecommendations = plantScores.slice(0, 3);
    
    // Determine if immediate action is required
    const sensors = sensorData.sensors;
    const criticalIssues = [];
    const actions = [];
    
    // Check for critical conditions
    if (sensors.soilMoisture < 30) {
      criticalIssues.push('Low soil moisture detected');
      actions.push({
        command: 'irrigate_now',
        parameters: {
          sectionId: sensorData.sectionId,
          duration: 300, // 5 minutes
          priority: 'high'
        }
      });
    }
    
    if (sensors.pH < 5.5 || sensors.pH > 8.0) {
      criticalIssues.push('pH level outside acceptable range');
      actions.push({
        command: 'soil_treatment_required',
        parameters: {
          sectionId: sensorData.sectionId,
          currentPH: sensors.pH,
          priority: 'medium'
        }
      });
    }
    
    if (sensors.gasConcentration > 0.5) {
      criticalIssues.push('High gas concentration detected');
      actions.push({
        command: 'ventilation_required',
        parameters: {
          sectionId: sensorData.sectionId,
          gasLevel: sensors.gasConcentration,
          priority: 'high'
        }
      });
    }
    
    // Calculate overall health score
    const healthScore = Math.round(
      topRecommendations.length > 0 ? 
      topRecommendations.reduce((sum, plant) => sum + plant.score, 0) / topRecommendations.length : 
      0
    );
    const processingTimeRaw = Date.now() - (sensorData.timestamp || 0);
    const processingTime = Number.isNaN(processingTimeRaw) ? 0 : processingTimeRaw;
    
    const recommendation = {
      sectionId: sensorData.sectionId,
      timestamp: Date.now(),
      healthScore,
      recommendations: topRecommendations.map(plant => ({
        name: plant.name,
        score: plant.score,
        category: plant.category,
        suitability: plant.score >= 80 ? 'excellent' : 
                    plant.score >= 60 ? 'good' : 
                    plant.score >= 40 ? 'fair' : 'poor'
      })),
      sensorConditions: {
        pH: sensors.pH,
        soilMoisture: sensors.soilMoisture,
        temperature: sensors.temperature,
        humidity: sensors.humidity,
        gasConcentration: sensors.gasConcentration
      },
      issues: criticalIssues,
      requiresAction: actions.length > 0,
      actions,
      
      metadata: {
        algorithm: 'multi-factor-compatibility-v1.0',
        plantsEvaluated: Object.keys(PLANT_DATABASE).length,
        processingTime: Date.now() - sensorData.timestamp
      }
    };
    
    logger.info(`Vegetation recommendation generated for section ${sensorData.sectionId}: ${topRecommendations.length} plants evaluated`);
    
    return recommendation;
    
  } catch (error) {
    logger.error('Error processing vegetation recommendation:', error);
    throw error;
  }
}

/**
 * Get current growing season
 */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Filter plants by growing season
 */
function filterPlantsBySeason(plants, season = getCurrentSeason()) {
  return plants.filter(plant => {
    const requirements = PLANT_DATABASE[plant.name];
    return requirements && requirements.growingSeason.includes(season);
  });
}

/**
 * Get detailed plant information
 */
function getPlantDetails(plantName) {
  return PLANT_DATABASE[plantName] || null;
}

/**
 * Calculate irrigation recommendation
 */
function calculateIrrigationRecommendation(sensorData) {
  const moisture = sensorData.sensors.soilMoisture;
  const temperature = sensorData.sensors.temperature;
  const humidity = sensorData.sensors.humidity;
  
  let recommended = false;
  let duration = 0;
  let urgency = 'none';
  
  // Base irrigation logic
  if (moisture < 25) {
    recommended = true;
    duration = 600; // 10 minutes
    urgency = 'high';
  } else if (moisture < 35) {
    recommended = true;
    duration = 300; // 5 minutes
    urgency = 'medium';
  } else if (moisture < 45 && temperature > 28) {
    recommended = true;
    duration = 180; // 3 minutes
    urgency = 'low';
  }
  
  // Adjust for environmental conditions
  if (recommended) {
    // Increase duration in hot weather
    if (temperature > 30) {
      duration *= 1.2;
    }
    
    // Decrease duration in high humidity
    if (humidity > 80) {
      duration *= 0.8;
    }
    
    duration = Math.round(duration);
  }
  
  return {
    recommended,
    duration,
    urgency,
    reason: `Soil moisture: ${moisture}%, Temperature: ${temperature}°C, Humidity: ${humidity}%`
  };
}

module.exports = {
  validateSensorData,
  processVegetationRecommendation,
  calculatePlantCompatibility,
  filterPlantsBySeason,
  getPlantDetails,
  calculateIrrigationRecommendation,
  getCurrentSeason,
  PLANT_DATABASE
};
