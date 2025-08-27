import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SensorCard } from '@/components/SensorCard';
import { VegetationCard } from '@/components/VegetationCard';
import { ChartSection } from '@/components/ChartSection';
import { ControlPanel } from '@/components/ControlPanel';
import { toast } from '@/hooks/use-toast';
import { ref, onValue } from "firebase/database";
import { db } from "@/firebaseConfig";  // adjust path

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

const Index = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const sectionsRef = ref(db, "sections");
    const unsubscribe = onValue(sectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedSections = Object.keys(data).map((key) => ({
          id: key,
          status: data[key].status ?? "online", // 
          ...data[key],
        }));
        setSections(formattedSections);
      } else {
        console.log("No data available");
      }
    });

    return () => unsubscribe();
  }, []);
// cleanup listener on unmount
}, []);


  // Simulate connection status
  useEffect(() => {
    const connectionInterval = setInterval(() => {
      const newConnectionStatus = Math.random() > 0.1; // 90% uptime
      if (newConnectionStatus !== isConnected) {
        setIsConnected(newConnectionStatus);
        // toast({
        //   title: newConnectionStatus ? "Connected" : "Connection Lost",
        //   description: newConnectionStatus 
        //     ? "Successfully reconnected to IoT network" 
        //     : "Lost connection to MQTT broker",
        //   variant: newConnectionStatus ? "default" : "destructive"
        // });
      }
    }, 10000);

    return () => clearInterval(connectionInterval);
  }, [isConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
<header className="bg-white-100 shadow-sm border-b border-yellow-300">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
    <img src="/assets/logo.png" alt="" className="w-full h-full object-cover" />
  </div>

              <div>
                <h1 className="text-2xl font-bold text-green-900">Krishi-Flow</h1>
<p className="text-gray-600 font-serif">Nourish With Knowledge</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Offline'}</span>
              </Badge>
              <div className="text-sm text-gray-500">
                Last sync: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Control Panel */}
        <div className="mb-8">
          <ControlPanel />
        </div>

        {/* Section Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {sections.map((section) => (
            <Card key={section.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  {section.name}
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(section.status)}`}></div>
                </CardTitle>
                <p className="text-sm text-gray-500">Updated {section.lastUpdated}</p>
              </CardHeader>
              <CardContent>
                <SensorCard sensorData={section.sensorData} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <ChartSection sections={sections} />
        </div>

        {/* Vegetation Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section) => (
            <VegetationCard 
              key={`veg-${section.id}`}
              sectionName={section.name}
              recommendations={section.recommendedVegetation}
              sensorData={section.sensorData}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
