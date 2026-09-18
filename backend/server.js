const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const Maintenance = require("../models/Maintenance");

const app = express();

// ===================================
// 1️⃣ Middleware
// ===================================
app.use(express.json());
app.use(cors());

// ===================================
// 2️⃣ MongoDB Connection
// ===================================
mongoose.connect(process.env.MONGO_URI)
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
  latitude: Number,
  longitude: Number,
  createdAt: { type: Date, default: Date.now }
});

const SensorData = mongoose.model("SensorData", SensorDataSchema, "sensordatas");

const BoxSchema = new mongoose.Schema({
  deviceId: String,
  boxName: String,
  location: String,
  medicines: [String]
});

const Box = mongoose.model("Box", BoxSchema, "boxes");

const MedicineSchema = new mongoose.Schema({
  name: String,
  minTemp: Number,
  maxTemp: Number,
  humidityRange: String
});

const Medicine = mongoose.model("Medicine", MedicineSchema, "medicines");


// ===================================
// 4️⃣ Routes
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


// GET — latest sensor reading
app.get("/api/sensor/latest", async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: "No data found" });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ===================================
// Temperature Prediction Route
// ===================================
app.get("/api/predict/:deviceId", async (req, res) => {

  try {

    const deviceId = req.params.deviceId;

    const latest = await SensorData
      .findOne({ deviceId })
      .sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({ message: "No sensor data found" });
    }

    const python = spawn("python", [
      "../ml/temperature_prediction.py",
      latest.temperature,
      latest.humidity
    ]);

    let result = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python Error:", data.toString());
    });

    python.on("close", () => {

      console.log("Python raw output:", result);

      const predictedTemp = parseFloat(result.trim());

      res.json({
        deviceId,
        currentTemp: latest.temperature,
        humidity: latest.humidity,
        predictedTemp
      });

    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// GET — history for ALL devices
app.get("/api/sensor/history", async (req, res) => {
  try {
    const all = await SensorData.find().sort({ createdAt: 1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET — device-specific history
app.get("/api/sensor/history/:deviceId", async (req, res) => {
  try {

    const deviceId = req.params.deviceId;

    const history = await SensorData
      .find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(50);   // only latest 50 readings

    res.json(history.reverse());

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
    const alerts = await SensorData
      .find({ majorChange: true })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(alerts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET — predictions from ML JSON
app.get("/api/predictions", (req, res) => {
  try {

    const filePath = path.join(__dirname, "..", "ml_predictions.json");

    const data = fs.readFileSync(filePath, "utf8");

    res.json(JSON.parse(data));

  } catch (err) {

    console.log("Prediction file error:", err);

    res.status(500).json({ error: "Prediction file not found" });

  }
});


// GET — box details with latest sensor data
app.get("/api/boxes/details", async (req, res) => {

  try {

    const boxes = await Box.find();

    const result = [];

    for (let box of boxes) {

      const sensor = await SensorData
        .findOne({ deviceId: box.deviceId })
        .sort({ createdAt: -1 });

      const medicines = await Medicine.find({
        name: { $in: box.medicines }
      });

      result.push({
        deviceId: box.deviceId,
        boxName: box.boxName,
        location: box.location,
        temperature: sensor ? sensor.temperature : null,
        humidity: sensor ? sensor.humidity : null,
        medicines: medicines
      });

    }

    res.json(result);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});
// Get all maintenance records
app.get("/api/maintenance", async (req, res) => {
  try {
    const maintenance = await Maintenance.find().sort({ deviceId: 1 });

    res.json(maintenance);
  } catch (error) {
    console.error("❌ Error fetching maintenance data:", error);
    res.status(500).json({
      message: "Failed to fetch maintenance data"
    });
  }
});


// Create a new maintenance record
app.post("/api/maintenance", async (req, res) => {
  try {
    const {
      deviceId,
      manufacturingDate,
      activationDate,
      warrantyExpiry,
      totalServicesRequired,
      nextServiceDate,
      services
    } = req.body;

    // Check if maintenance record already exists for this box
    const existingMaintenance = await Maintenance.findOne({ deviceId });

    if (existingMaintenance) {
      return res.status(409).json({
        message: "Maintenance record already exists for this box"
      });
    }

    // Create new maintenance record
    const maintenance = new Maintenance({
      deviceId,
      manufacturingDate,
      activationDate,
      warrantyExpiry,
      totalServicesRequired,
      nextServiceDate,
      services: services || []
    });

    const savedMaintenance = await maintenance.save();

    res.status(201).json(savedMaintenance);

  } catch (error) {
    console.error("❌ Error creating maintenance record:", error);

    res.status(500).json({
      message: "Failed to create maintenance record",
      error: error.message
    });
  }
});

// Update an existing maintenance record
app.put("/api/maintenance/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const {
      manufacturingDate,
      activationDate,
      warrantyExpiry,
      totalServicesRequired,
      nextServiceDate,
      services
    } = req.body;

    const updatedMaintenance = await Maintenance.findOneAndUpdate(
      { deviceId },
      {
        manufacturingDate,
        activationDate,
        warrantyExpiry,
        totalServicesRequired,
        nextServiceDate,
        services
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Record doesn't exist
    if (!updatedMaintenance) {
      return res.status(404).json({
        message: "Maintenance record not found for this box"
      });
    }

    res.json(updatedMaintenance);

  } catch (error) {
    console.error("❌ Error updating maintenance record:", error);

    res.status(500).json({
      message: "Failed to update maintenance record",
      error: error.message
    });
  }
});

// Delete a maintenance record
app.delete("/api/maintenance/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const deletedMaintenance =
      await Maintenance.findOneAndDelete({ deviceId });

    if (!deletedMaintenance) {
      return res.status(404).json({
        message: "Maintenance record not found for this box"
      });
    }

    res.json({
      message: "Maintenance record deleted successfully",
      deviceId
    });

  } catch (error) {
    console.error(
      "❌ Error deleting maintenance record:",
      error
    );

    res.status(500).json({
      message: "Failed to delete maintenance record",
      error: error.message
    });
  }
});

// ===================================
// 5️⃣ Start Server
// ===================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});