const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===================================
// 1️⃣ Middleware
// ===================================
app.use(express.json());
app.use(cors());

// ===================================
// 2️⃣ MongoDB Connection
// ===================================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ===================================
// 3️⃣ Schema & Model
// ===================================
const SensorDataSchema = new mongoose.Schema({
  deviceId: String,
  boxName: String,
  location: String,
  temperature: Number,
  humidity: Number,
  alert: Boolean,
  majorChange: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const SensorData = mongoose.model("SensorData", SensorDataSchema, "sensordatas");

// ===================================
// 4️⃣ Routes (all moved ABOVE listen)
// ===================================

// Test API
app.get("/", (req, res) => {
  res.send("ColdChain Backend API is running...");
});

// POST — receive data from ESP32
app.post("/api/sensor", async (req, res) => {
  try {
    console.log("📡 Data received:", req.body);
    const newData = new SensorData(req.body);
    await newData.save();
    res.status(200).json({ message: "✅ Data saved to MongoDB" });
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.status(500).json({ message: "Error saving data" });
  }
});

// GET — latest
app.get("/api/sensor/latest", async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: "No data found" });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — list history for ALL devices
app.get("/api/sensor/history", async (req, res) => {
  try {
    const all = await SensorData.find().sort({ createdAt: 1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET — device-specific history ❗IMPORTANT
app.get("/api/sensor/history/:deviceId", async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const history = await SensorData.find({ deviceId }).sort({ createdAt: 1 });
    if (!history.length) return res.status(404).json({ message: "No data found for this device" });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — device list
app.get("/api/sensor/devices", async (req, res) => {
  try {
    const devices = await SensorData.distinct("deviceId");
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET — alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await SensorData.find({ majorChange: true }).sort({ createdAt: -1 }).limit(10);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================
// 5️⃣ Start Server  ✔ after routes!
// ===================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
