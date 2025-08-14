// mqtt-publisher.js
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  const data = {
    sensor: "temperature",
    value: 26.5
  };

  client.publish("iot/sensor", JSON.stringify(data), () => {
    console.log("📡 Published:", JSON.stringify(data));
    client.end();
  });
});
