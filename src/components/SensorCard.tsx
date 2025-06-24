
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Gauge, Cloud } from 'lucide-react';

interface SensorData {
  pH: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  gasConcentration: number;
  timestamp: number;
}

interface SensorCardProps {
  sensorData: SensorData;
}

export const SensorCard: React.FC<SensorCardProps> = ({ sensorData }) => {
  const getSensorStatus = (value: number, type: string) => {
    switch (type) {
      case 'pH':
        if (value >= 6.0 && value <= 7.5) return 'good';
        if (value >= 5.5 && value <= 8.0) return 'warning';
        return 'critical';
      case 'moisture':
        if (value >= 40 && value <= 70) return 'good';
        if (value >= 30 && value <= 80) return 'warning';
        return 'critical';
      case 'temperature':
        if (value >= 20 && value <= 28) return 'good';
        if (value >= 15 && value <= 32) return 'warning';
        return 'critical';
      case 'humidity':
        if (value >= 50 && value <= 70) return 'good';
        if (value >= 40 && value <= 80) return 'warning';
        return 'critical';
      case 'gas':
        if (value <= 0.3) return 'good';
        if (value <= 0.5) return 'warning';
        return 'critical';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sensors = [
    {
      label: 'pH Level',
      value: sensorData.pH.toFixed(1),
      unit: '',
      status: getSensorStatus(sensorData.pH, 'pH'),
      icon: <Gauge className="w-4 h-4" />
    },
    {
      label: 'Soil Moisture',
      value: sensorData.soilMoisture.toFixed(0),
      unit: '%',
      status: getSensorStatus(sensorData.soilMoisture, 'moisture'),
      icon: <Cloud className="w-4 h-4" />
    },
    {
      label: 'Temperature',
      value: sensorData.temperature.toFixed(1),
      unit: '°C',
      status: getSensorStatus(sensorData.temperature, 'temperature'),
      icon: <Thermometer className="w-4 h-4" />
    },
    {
      label: 'Humidity',
      value: sensorData.humidity.toFixed(0),
      unit: '%',
      status: getSensorStatus(sensorData.humidity, 'humidity'),
      icon: <Cloud className="w-4 h-4" />
    },
    {
      label: 'Gas Level',
      value: (sensorData.gasConcentration * 100).toFixed(1),
      unit: 'ppm',
      status: getSensorStatus(sensorData.gasConcentration, 'gas'),
      icon: <Gauge className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-3">
      {sensors.map((sensor, index) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-2">
            {sensor.icon}
            <span className="text-sm font-medium text-gray-700">{sensor.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">
              {sensor.value}{sensor.unit}
            </span>
            <Badge className={`text-xs px-2 py-1 ${getStatusColor(sensor.status)}`}>
              {sensor.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
