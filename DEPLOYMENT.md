
# 🚀 EcoSmart Garden Hub - Deployment Guide

This guide covers deploying the EcoSmart Garden Hub to production environments.

## 📋 Pre-deployment Checklist

### Frontend Requirements
- [ ] Firebase web configuration updated
- [ ] Environment variables configured
- [ ] Build process successful
- [ ] Performance optimized
- [ ] Error boundaries implemented

### Backend Requirements
- [ ] Firebase Admin SDK configured
- [ ] MQTT broker accessible
- [ ] Environment variables set
- [ ] Database initialized
- [ ] Health checks working

### Infrastructure Requirements
- [ ] Domain name configured
- [ ] SSL certificates ready
- [ ] CDN configured (optional)
- [ ] Monitoring setup
- [ ] Backup strategy implemented

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login and Deploy**
```bash
vercel login
vercel --prod
```

3. **Configure Environment Variables**
```bash
# In Vercel dashboard, add:
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

### Option 2: Netlify

1. **Build Project**
```bash
npm run build
```

2. **Deploy to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod --dir=dist
```

### Option 3: Static Hosting (AWS S3, GitHub Pages)

1. **Build Project**
```bash
npm run build
```

2. **Upload dist/ folder** to your static hosting service

3. **Configure redirects** for SPA routing

## 🖥️ Backend Deployment

### Option 1: Railway (Recommended)

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Connect your repository
   - Select server directory

2. **Configure Environment Variables**
```env
NODE_ENV=production
PORT=3001
MQTT_BROKER_URL=your_mqtt_broker
FIREBASE_PROJECT_ID=your_project_id
# ... other variables
```

3. **Deploy**
   - Railway auto-deploys on git push

### Option 2: Heroku

1. **Install Heroku CLI**
```bash
# Install Heroku CLI
npm install -g heroku
```

2. **Create Heroku App**
```bash
heroku create ecosmart-garden-server
```

3. **Configure Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MQTT_BROKER_URL=your_mqtt_broker
heroku config:set FIREBASE_PROJECT_ID=your_project_id
# ... other variables
```

4. **Deploy**
```bash
git push heroku main
```

### Option 3: Docker Deployment

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["node", "server.js"]
```

2. **Build and Run**
```bash
docker build -t ecosmart-garden-server .
docker run -p 3001:3001 --env-file .env ecosmart-garden-server
```

3. **Docker Compose (with MQTT)**
```yaml
version: '3.8'

services:
  server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mqtt-broker

  mqtt-broker:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
```

## 🔧 Infrastructure Setup

### MQTT Broker

#### Option 1: HiveMQ Cloud (Managed)
1. Sign up at [HiveMQ Cloud](https://www.hivemq.com/cloud/)
2. Create cluster
3. Configure credentials
4. Update environment variables

#### Option 2: Self-hosted Mosquitto
```bash
# Install Mosquitto
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients

# Configure authentication
sudo mosquitto_passwd -c /etc/mosquitto/passwd username

# Start service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Enable Realtime Database

2. **Generate Service Account**
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Save JSON file securely

3. **Configure Database Rules**
```json
{
  "rules": {
    "sections": {
      "$sectionId": {
        ".read": true,
        ".write": "auth != null || root.child('system/allowAnonymousWrites').val() === true"
      }
    },
    "system": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### Load Balancing & Scaling

#### NGINX Configuration
```nginx
upstream ecosmart_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;  # Additional instances
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://ecosmart_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Logging

### Application Monitoring

#### Option 1: PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ecosmart-garden-server',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Option 2: Uptime Monitoring
```bash
# Install uptimerobot or similar service
# Configure health check endpoint: /health
```

### Log Management

#### Centralized Logging (ELK Stack)
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## 🔒 Security Configuration

### SSL/TLS Setup

#### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 1883    # MQTT
sudo ufw enable
```

### Environment Security
```bash
# Secure environment file
chmod 600 .env
chown root:root .env

# Use secrets management
# Option 1: Docker secrets
# Option 2: HashiCorp Vault
# Option 3: Cloud provider secrets (AWS Secrets Manager, etc.)
```

## 🧪 Testing in Production

### Health Checks
```bash
# Server health
curl https://your-api-domain.com/health

# MQTT connectivity
mosquitto_pub -h your-mqtt-broker -t test/topic -m "test message"

# Firebase connectivity
# Check Firebase console for real-time updates
```

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Create load test
# artillery.yml
config:
  target: 'https://your-api-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "API Health Check"
    requests:
      - get:
          url: "/health"

# Run test
artillery run artillery.yml
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## 📈 Performance Optimization

### Frontend Optimization
```bash
# Bundle analysis
npm run build -- --analyze

# Lighthouse audit
npx lighthouse https://your-domain.com --output=html
```

### Backend Optimization
```javascript
// server.js additions
const compression = require('compression');
const helmet = require('helmet');

app.use(compression());
app.use(helmet());

// Database connection pooling
// Redis caching
// MQTT connection pooling
```

### CDN Setup
```bash
# CloudFlare setup
# 1. Add domain to CloudFlare
# 2. Update DNS records
# 3. Enable caching rules
# 4. Configure SSL settings
```

## 🔧 Troubleshooting

### Common Issues

#### MQTT Connection Issues
```bash
# Check broker connectivity
telnet your-mqtt-broker.com 1883

# Check credentials
mosquitto_pub -h broker -u username -P password -t test -m "test"

# Debug with verbose logging
DEBUG=mqtt* node server.js
```

#### Firebase Issues
```bash
# Check service account permissions
# Verify database rules
# Check quota limits
# Monitor Firebase console logs
```

#### SSL Certificate Issues
```bash
# Check certificate status
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt
sudo certbot renew --dry-run
```

### Rollback Strategy
```bash
# Keep previous deployment artifacts
# Database backup before deployment
# Blue-green deployment setup
# Feature flags for gradual rollout
```

## 📞 Production Support

### Monitoring Dashboards
- Server metrics (CPU, Memory, Disk)
- Application metrics (Response time, Error rate)
- MQTT message throughput
- Firebase read/write operations

### Alerting Rules
- Server downtime
- High error rates
- MQTT disconnections
- Database quota warnings

### Log Analysis
- Error pattern detection
- Performance bottleneck identification
- Security event monitoring
- User behavior analytics

---

**Production deployment complete!** 🎉

For support: [Create an issue](https://github.com/your-org/ecosmart-garden-hub/issues)
