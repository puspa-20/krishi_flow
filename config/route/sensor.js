// routes/sensors.js
const express = require('express');
const router = express.Router();
const db = require('../firebase'); // <- import the db

router.post('/data', (req, res) => {
  const { temperature, moisture, timestamp } = req.body;

  const ref = db.ref('sensorData');
  const newEntry = ref.push();

  newEntry.set({
    temperature,
    moisture,
    timestamp: timestamp || Date.now()
  }, (error) => {
    if (error) {
      console.error("❌ Firebase write failed", error);
      res.status(500).json({ message: 'Failed to write data to Firebase' });
    } else {
      res.status(200).json({ message: '✅ Data stored successfully' });
    }
  });
});

module.exports = router;
