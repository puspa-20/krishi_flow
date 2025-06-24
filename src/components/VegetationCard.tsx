
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SensorData {
  pH: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  gasConcentration: number;
  timestamp: number;
}

interface VegetationCardProps {
  sectionName: string;
  recommendations: string[];
  sensorData: SensorData;
}

export const VegetationCard: React.FC<VegetationCardProps> = ({
  sectionName,
  recommendations,
  sensorData
}) => {
  // Calculate overall health score based on sensor data
  const calculateHealthScore = () => {
    let score = 0;
    let factors = 0;

    // pH score (6.0-7.5 is optimal)
    if (sensorData.pH >= 6.0 && sensorData.pH <= 7.5) score += 20;
    else if (sensorData.pH >= 5.5 && sensorData.pH <= 8.0) score += 15;
    else score += 5;
    factors += 20;

    // Moisture score (40-70% is optimal)
    if (sensorData.soilMoisture >= 40 && sensorData.soilMoisture <= 70) score += 20;
    else if (sensorData.soilMoisture >= 30 && sensorData.soilMoisture <= 80) score += 15;
    else score += 5;
    factors += 20;

    // Temperature score (20-28°C is optimal)
    if (sensorData.temperature >= 20 && sensorData.temperature <= 28) score += 20;
    else if (sensorData.temperature >= 15 && sensorData.temperature <= 32) score += 15;
    else score += 5;
    factors += 20;

    // Humidity score (50-70% is optimal)
    if (sensorData.humidity >= 50 && sensorData.humidity <= 70) score += 20;
    else if (sensorData.humidity >= 40 && sensorData.humidity <= 80) score += 15;
    else score += 5;
    factors += 20;

    // Gas score (lower is better)
    if (sensorData.gasConcentration <= 0.3) score += 20;
    else if (sensorData.gasConcentration <= 0.5) score += 15;
    else score += 5;
    factors += 20;

    return Math.round((score / factors) * 100);
  };

  const healthScore = calculateHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const vegetationEmojis: { [key: string]: string } = {
    'Tomatoes': '🍅',
    'Peppers': '🌶️',
    'Cucumbers': '🥒',
    'Lettuce': '🥬',
    'Spinach': '🥬',
    'Herbs': '🌿',
    'Carrots': '🥕',
    'Radishes': '🥕',
    'Onions': '🧅',
    'Beans': '🫘',
    'Peas': '🟢',
    'Corn': '🌽'
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Recommendations</span>
          <Badge className={`${getHealthBadgeColor(healthScore)} font-semibold`}>
            {healthScore}% Health
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">{sectionName}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Optimal Plants:</h4>
            <div className="grid grid-cols-1 gap-2">
              {recommendations.map((plant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{vegetationEmojis[plant] || '🌱'}</span>
                    <span className="font-medium text-green-800">{plant}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Recommended
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Growing Conditions:</span>
              <span className={`font-semibold ${getHealthColor(healthScore)}`}>
                {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
