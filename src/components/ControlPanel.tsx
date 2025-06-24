
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';

export const ControlPanel: React.FC = () => {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [irrigationThreshold, setIrrigationThreshold] = useState([35]);
  const [systemStatus, setSystemStatus] = useState({
    mqtt: 'connected',
    firebase: 'connected',
    irrigation: 'standby',
    smartCar: 'idle'
  });

  const handleManualCommand = (command: string, section: string) => {
    console.log(`Sending command: ${command} to ${section}`);
    
    // Simulate MQTT command sending
    const mqttMessage = {
      command,
      section,
      timestamp: Date.now(),
      source: 'dashboard'
    };
    
    console.log('MQTT Command:', JSON.stringify(mqttMessage));
    
    toast({
      title: "Command Sent",
      description: `${command} command sent to ${section}`,
    });

    // Update system status
    if (command.includes('irrigate')) {
      setSystemStatus(prev => ({ ...prev, irrigation: 'active' }));
      setTimeout(() => {
        setSystemStatus(prev => ({ ...prev, irrigation: 'standby' }));
      }, 3000);
    }

    if (command.includes('move') || command.includes('navigate')) {
      setSystemStatus(prev => ({ ...prev, smartCar: 'moving' }));
      setTimeout(() => {
        setSystemStatus(prev => ({ ...prev, smartCar: 'idle' }));
      }, 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'standby':
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'active':
      case 'moving':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sections = ['North Field', 'South Field', 'East Field', 'West Field'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Control Panel</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto Mode</span>
            <Switch
              checked={isAutoMode}
              onCheckedChange={setIsAutoMode}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Status */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">MQTT Broker</span>
                <Badge className={getStatusColor(systemStatus.mqtt)}>
                  {systemStatus.mqtt}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Firebase DB</span>
                <Badge className={getStatusColor(systemStatus.firebase)}>
                  {systemStatus.firebase}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Irrigation System</span>
                <Badge className={getStatusColor(systemStatus.irrigation)}>
                  {systemStatus.irrigation}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Smart Car</span>
                <Badge className={getStatusColor(systemStatus.smartCar)}>
                  {systemStatus.smartCar}
                </Badge>
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Automation Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Irrigation Threshold: {irrigationThreshold[0]}%
                </label>
                <Slider
                  value={irrigationThreshold}
                  onValueChange={setIrrigationThreshold}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                  disabled={!isAutoMode}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-irrigation when soil moisture drops below this level
                </p>
              </div>
              
              <Button
                onClick={() => {
                  toast({
                    title: "Settings Saved",
                    description: "Automation settings updated successfully",
                  });
                }}
                disabled={!isAutoMode}
                className="w-full"
              >
                Update Settings
              </Button>
            </div>
          </div>

          {/* Manual Controls */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Manual Controls</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {sections.map((section) => (
                  <Button
                    key={`irrigate-${section}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualCommand('irrigate_now', section)}
                    disabled={isAutoMode}
                    className="text-xs"
                  >
                    💧 {section.split(' ')[0]}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => handleManualCommand('move_to_section_1', 'Smart Car')}
                  disabled={isAutoMode}
                  className="w-full"
                  variant="outline"
                >
                  🚗 Move Car to North Field
                </Button>
                <Button
                  onClick={() => handleManualCommand('collect_samples', 'Smart Car')}
                  disabled={isAutoMode}
                  className="w-full"
                  variant="outline"
                >
                  📊 Collect Soil Samples
                </Button>
                <Button
                  onClick={() => handleManualCommand('return_home', 'Smart Car')}
                  disabled={isAutoMode}
                  className="w-full"
                  variant="outline"
                >
                  🏠 Return to Base
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
