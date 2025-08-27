import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { database } from '@/firebase';
import { ref, onValue } from 'firebase/database';

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
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Fetch real-time data from Firebase
  useEffect(() => {
    const sensorRef = ref(database, 'sensors'); // Your Firebase DB path

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.keys(data)
          .map(timestamp => ({
            time: new Date(Number(timestamp)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            ...data[timestamp] // assumes each timestamp has { "Field A": {...}, "Field B": {...} }
          }))
          // Optional: Only keep last 24 hours
          .filter(point => Number(point.time) >= Date.now() - 24 * 60 * 60 * 1000);

        setHistoricalData(formattedData);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const formatChartData = (parameter: keyof SensorData) => {
    return historicalData.map(point => ({
      time: point.time,
      'Field A': point['Field A']?.[parameter],
      'Field B': point['Field B']?.[parameter],
      'Field C': point['Field C']?.[parameter],
      'Field D': point['Field D']?.[parameter],
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
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value: number, name: string) => [`${value?.toFixed(2)}${unit}`, name]}
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
