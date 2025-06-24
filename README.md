
# EcoSmart Garden Hub - IoT Agricultural Monitoring System

A comprehensive IoT solution for agricultural monitoring that bridges ESP32 devices through MQTT and provides real-time data visualization through a modern web dashboard.

## 🌟 Features

### Real-time Monitoring
- **Multi-sensor Data Collection**: pH, soil moisture, temperature, humidity, and gas concentration
- **Live Dashboard**: Real-time charts and analytics with automatic updates
- **Section Management**: Monitor up to 4 different agricultural sections simultaneously
- **Vegetation Recommendations**: AI-powered plant suggestions based on current soil conditions

### IoT Integration
- **MQTT Communication**: Seamless device-to-dashboard communication
- **Firebase Real-time Database**: Cloud-based data storage and synchronization
- **ESP32 Support**: Optimized for ESP32-based sensor nodes and control devices
- **Automated Controls**: Smart irrigation and robotic car coordination

### Modern Web Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Charts**: 24-hour trend analysis with multiple data views
- **Real-time Status**: Live connection monitoring and system health indicators
- **Manual Override**: Direct control panel for manual system operations

## 🏗️ System Architecture

```
┌─────────────────┐    MQTT     ┌─────────────────┐    HTTP/WS    ┌─────────────────┐
│   ESP32 Sensors │ ──────────→ │   Node.js       │ ────────────→ │   React         │
│   (Irrigation)  │             │   MQTT Bridge   │               │   Dashboard     │
└─────────────────┘             │   Server        │               └─────────────────┘
                                │                 │                        │
┌─────────────────┐    MQTT     │                 │               Firebase │
│   ESP32 Car     │ ←────────── │                 │               Real-time│
│   (Control)     │             │                 │               Database │
└─────────────────┘             └─────────────────┘                        │
                                         │                                  │
                                 Firebase Admin SDK                        │
                                         │                                  │
                                         ▼                                  │
                                ┌─────────────────┐                        │
                                │   Firebase      │ ←──────────────────────┘
                                │   Database      │
                                └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Realtime Database
- MQTT broker (Mosquitto, HiveMQ, or cloud service)
- ESP32 devices (optional for full system)

### Installation

1. **Clone and Install Dependencies**
```bash
git clone <your-repo-url>
cd eco-smart-garden-hub
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Firebase Configuration**
- Create a Firebase project at https://console.firebase.google.com/
- Enable Realtime Database
- Download service account key to `config/firebase-admin.json`
- Get Firebase web config for frontend

4. **Start Development Server**
```bash
npm run dev
```

The dashboard will be available at `http://localhost:8080`

## 📁 Project Structure

```
eco-smart-garden-hub/
├── src/
│   ├── components/           # React components
│   │   ├── SensorCard.tsx   # Individual sensor display
│   │   ├── VegetationCard.tsx # Plant recommendations
│   │   ├── ChartSection.tsx # Data visualization
│   │   └── ControlPanel.tsx # System controls
│   ├── pages/
│   │   └── Index.tsx        # Main dashboard page
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility functions
├── server/                  # Node.js backend (reference implementation)
│   ├── server.js           # Express server setup
│   ├── mqtt.js             # MQTT client handling
│   ├── firebase.js         # Firebase configuration
│   ├── routes/             # API routes
│   └── controllers/        # Business logic
├── config/                 # Configuration files
│   ├── firebase-admin.json # Firebase service account
│   └── mqtt-config.js      # MQTT settings
└── docs/                   # Additional documentation
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# MQTT Configuration
MQTT_BROKER_URL=mqtt://your-broker-url:1883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Firebase Setup
1. Create a new Firebase project
2. Enable Realtime Database
3. Set database rules (see `docs/firebase-rules.json`)
4. Download service account JSON
5. Configure web app settings

### MQTT Topics
- **Sensor Data**: `agri/irrigation/data`
- **Car Control**: `agri/car/control`
- **System Status**: `agri/system/status`

## 📊 Data Flow

### Sensor Data Structure
```json
{
  "sectionId": "section-1",
  "timestamp": 1645123456789,
  "sensors": {
    "pH": 6.8,
    "soilMoisture": 45,
    "temperature": 24.5,
    "humidity": 62,
    "gasConcentration": 0.3
  }
}
```

### Control Commands
```json
{
  "command": "irrigate_now",
  "section": "section-1",
  "duration": 300,
  "timestamp": 1645123456789
}
```

## 🤖 Vegetation Algorithm

The system uses a multi-factor algorithm to recommend optimal plants:

1. **pH Level Analysis**: Matches plant pH preferences
2. **Moisture Requirements**: Considers water needs
3. **Temperature Range**: Evaluates growing season compatibility
4. **Humidity Preferences**: Matches environmental needs
5. **Air Quality**: Factors in gas concentration levels

### Health Score Calculation
- pH: 20% weight (optimal: 6.0-7.5)
- Moisture: 20% weight (optimal: 40-70%)
- Temperature: 20% weight (optimal: 20-28°C)
- Humidity: 20% weight (optimal: 50-70%)
- Air Quality: 20% weight (optimal: <0.3 ppm)

## 🎛️ API Endpoints

### Sensor Data
- `POST /api/sensor` - Submit sensor readings
- `GET /api/sensors/:sectionId` - Get latest readings
- `GET /api/sensors/:sectionId/history` - Get historical data

### Recommendations
- `GET /api/suggestions/:sectionId` - Get vegetation suggestions
- `POST /api/suggestions/update` - Trigger recommendation update

### System Control
- `POST /api/control/irrigation` - Manual irrigation control
- `POST /api/control/car` - Smart car commands
- `GET /api/system/status` - System health check

## 🔄 Real-time Updates

The dashboard uses Firebase Realtime Database for live data synchronization:

1. **Sensor readings** are stored in `/sections/{sectionId}/readings`
2. **Vegetation suggestions** are stored in `/sections/{sectionId}/suggestions`
3. **System status** is tracked in `/system/status`

React components automatically re-render when data changes, providing a truly real-time experience.

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend (Railway/Heroku)
```bash
# Set environment variables in hosting platform
# Deploy server/ directory
```

### Firebase Database Rules
```json
{
  "rules": {
    "sections": {
      "$sectionId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "system": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### MQTT Testing
Use MQTT client tools to test message publishing:
```bash
# Install mosquitto-clients
sudo apt-get install mosquitto-clients

# Test sensor data publishing
mosquitto_pub -h your-broker -t agri/irrigation/data -m '{"sectionId":"section-1","sensors":{"pH":6.8}}'

# Test control commands
mosquitto_sub -h your-broker -t agri/car/control
```

## 🐛 Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   - Check broker URL and credentials
   - Verify network connectivity
   - Ensure proper firewall settings

2. **Firebase Permission Denied**
   - Verify service account permissions
   - Check database rules
   - Ensure proper authentication

3. **Sensor Data Not Updating**
   - Check MQTT topic names
   - Verify JSON message format
   - Monitor server logs for errors

4. **Charts Not Loading**
   - Check browser console for errors
   - Verify data format in Firebase
   - Ensure sufficient historical data

### Debug Mode
Enable debug logging:
```bash
DEBUG=mqtt,firebase npm run dev
```

### Log Files
- Server logs: `logs/server.log`
- MQTT logs: `logs/mqtt.log`
- Error logs: `logs/error.log`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ESP32 community for hardware inspiration
- Firebase team for real-time database capabilities
- MQTT.org for messaging protocol standards
- React community for UI framework excellence

## 📞 Support

For support and questions:
- 📧 Email: support@ecosmart-garden.com
- 💬 Discord: https://discord.gg/ecosmart
- 📚 Documentation: https://docs.ecosmart-garden.com
- 🐛 Issues: GitHub Issues page

---

**EcoSmart Garden Hub** - Revolutionizing agriculture through IoT innovation 🌱🚀
