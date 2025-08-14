
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SensorData {
  pH: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  gasConcentration: number;
  timestamp: number;
}

interface Section {
  id: string;
  name: string;
  sensorData: SensorData;
  recommendedVegetation: string[];
  lastUpdated: string;
  status: 'online' | 'offline' | 'warning';
}

interface ChartSectionProps {
  sections: Section[];
}

export const ChartSection: React.FC<ChartSectionProps> = ({ sections }) => {
  // Generate historical data for demonstration
  const generateHistoricalData = () => {
    const data = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000); // Last 24 hours
      const hour = new Date(timestamp).getHours();
      
      data.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        timestamp,
        'Field A': {
          pH: 6.8 + Math.sin(hour * Math.PI / 12) * 0.3 + (Math.random() - 0.5) * 0.2,
          soilMoisture: 45 + Math.cos(hour * Math.PI / 12) * 10 + (Math.random() - 0.5) * 5,
          temperature: 24.5 + Math.sin((hour - 6) * Math.PI / 12) * 5 + (Math.random() - 0.5) * 2,
          humidity: 62 - Math.sin((hour - 6) * Math.PI / 12) * 15 + (Math.random() - 0.5) * 3,
          gasConcentration: 0.3 + (Math.random() - 0.5) * 0.1
        },
        'Field B': {
          pH: 7.2 + Math.sin(hour * Math.PI / 12) * 0.2 + (Math.random() - 0.5) * 0.15,
          soilMoisture: 38 + Math.cos(hour * Math.PI / 12) * 8 + (Math.random() - 0.5) * 4,
          temperature: 26.1 + Math.sin((hour - 6) * Math.PI / 12) * 4 + (Math.random() - 0.5) * 1.5,
          humidity: 58 - Math.sin((hour - 6) * Math.PI / 12) * 12 + (Math.random() - 0.5) * 2.5,
          gasConcentration: 0.25 + (Math.random() - 0.5) * 0.08
        },
        'Field C': {
          pH: 6.5 + Math.sin(hour * Math.PI / 12) * 0.25 + (Math.random() - 0.5) * 0.18,
          soilMoisture: 52 + Math.cos(hour * Math.PI / 12) * 12 + (Math.random() - 0.5) * 6,
          temperature: 23.8 + Math.sin((hour - 6) * Math.PI / 12) * 4.5 + (Math.random() - 0.5) * 1.8,
          humidity: 65 - Math.sin((hour - 6) * Math.PI / 12) * 18 + (Math.random() - 0.5) * 3.2,
          gasConcentration: 0.4 + (Math.random() - 0.5) * 0.12
        },
        'Field D': {
          pH: 7.0 + Math.sin(hour * Math.PI / 12) * 0.28 + (Math.random() - 0.5) * 0.22,
          soilMoisture: 28 + Math.cos(hour * Math.PI / 12) * 15 + (Math.random() - 0.5) * 7,
          temperature: 25.3 + Math.sin((hour - 6) * Math.PI / 12) * 5.5 + (Math.random() - 0.5) * 2.2,
          humidity: 55 - Math.sin((hour - 6) * Math.PI / 12) * 20 + (Math.random() - 0.5) * 4,
          gasConcentration: 0.2 + (Math.random() - 0.5) * 0.06
        }
      });
    }
    
    return data;
  };

  const historicalData = generateHistoricalData();

  const formatChartData = (parameter: keyof SensorData) => {
    return historicalData.map(point => ({
      time: point.time,
      'Field A': point['Field A'][parameter],
      'Field B': point['Field B'][parameter],
      'Field C': point['Field C'][parameter],
      'Field D': point['Field D'][parameter]
    }));
  };

  const chartColors = {
    'Field A': '#10b981',
    'Field B': '#3b82f6',
    'Field C': '#f59e0b',
    'Field D': '#ef4444'
  };

  const renderChart = (parameter: keyof SensorData, title: string, unit: string) => {
    const data = formatChartData(parameter);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title} Trends (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}${unit}`, 
                  name
                ]}
              />
              <Legend />
              {sections.map((section) => (
                <Area
                  key={section.id}
                  type="monotone"
                  dataKey={section.name}
                  stackId="1"
                  stroke={chartColors[section.name as keyof typeof chartColors]}
                  fill={chartColors[section.name as keyof typeof chartColors]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Real-time Analytics</h2>
        <p className="text-gray-600">24-hour sensor data trends across all sections</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="soil">Soil</TabsTrigger>
          <TabsTrigger value="air">Air Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart('temperature', 'Temperature', '°C')}
            {renderChart('humidity', 'Humidity', '%')}
          </div>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart('temperature', 'Temperature', '°C')}
            {renderChart('humidity', 'Humidity', '%')}
          </div>
        </TabsContent>

        <TabsContent value="soil" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart('pH', 'pH Level', '')}
            {renderChart('soilMoisture', 'Soil Moisture', '%')}
          </div>
        </TabsContent>

        <TabsContent value="air" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {renderChart('gasConcentration', 'Gas Concentration', ' ppm')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
