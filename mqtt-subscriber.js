// mqtt-subscriber.js
import mqtt from 'mqtt';
import mysql from 'mysql2';

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'krishi-flow'
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL connected");
});

// Connect to MQTT broker
const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log('📡 Connected to MQTT broker');
  client.subscribe('iot/sensor');
});

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  console.log("📥 Incoming:", data);

  const sql = 'INSERT INTO sensor_data (sensor_name, value) VALUES (?, ?)';
  db.query(sql, [data.sensor, data.value], (err, result) => {
    if (err) return console.error("❌ MySQL error:", err);
    console.log("✅ Data saved to DB");
  });
});
