const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
let geminiClient = null;

async function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!geminiClient) {
    const { GoogleGenAI } = await import("@google/genai");

    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return geminiClient;
}
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
// AI Assistant - Data Context Builder
// ===================================

const LIVE_DEVICE_ID = process.env.LIVE_DEVICE_ID || "";

function getDataSource(deviceId) {
  if (
    LIVE_DEVICE_ID &&
    deviceId === LIVE_DEVICE_ID
  ) {
    return "LIVE HARDWARE DATA";
  }

  return "DEMONSTRATION DATA";
}


// -----------------------------------
// Get latest sensor data
// -----------------------------------

async function getAssistantSensorData(message) {
  const lowerMessage = message.toLowerCase();

  const deviceMatch = message.match(
    /BOX-[A-Z]+-\d+/i
  );

  const requestedDeviceId = deviceMatch
    ? deviceMatch[0].toUpperCase()
    : null;


  // ---------------------------------
  // If user asks about a specific box
  // ---------------------------------

  if (requestedDeviceId) {
    const sensor = await SensorData
      .findOne({
        deviceId: requestedDeviceId
      })
      .sort({
        createdAt: -1
      })
      .lean();

    if (!sensor) {
      return {
        type: "sensor",
        data: `No sensor data found for ${requestedDeviceId}.`
      };
    }

    return {
      type: "sensor",
      data: {
        deviceId: sensor.deviceId,
        boxName: sensor.boxName,
        location: sensor.location,
        temperature: sensor.temperature,
        humidity: sensor.humidity,
        alert: sensor.alert,
        majorChange: sensor.majorChange,
        latitude: sensor.latitude,
        longitude: sensor.longitude,
        createdAt: sensor.createdAt,
        dataSource: getDataSource(sensor.deviceId)
      }
    };
  }


  // ---------------------------------
  // Questions about temperature,
  // humidity, sensor, boxes, readings
  // ---------------------------------

  const sensorKeywords = [
    "temperature",
    "temp",
    "humidity",
    "sensor",
    "reading",
    "readings",
    "box",
    "boxes",
    "cold storage",
    "current status",
    "status"
  ];

  const asksAboutSensor = sensorKeywords.some(
    keyword => lowerMessage.includes(keyword)
  );

  if (!asksAboutSensor) {
    return null;
  }


  // ---------------------------------
  // Get latest reading for every device
  // ---------------------------------

  const devices = await SensorData.distinct(
    "deviceId"
  );

  const readings = [];

  for (const deviceId of devices) {
    const sensor = await SensorData
      .findOne({ deviceId })
      .sort({ createdAt: -1 })
      .lean();

    if (sensor) {
      readings.push({
        deviceId: sensor.deviceId,
        boxName: sensor.boxName,
        location: sensor.location,
        temperature: sensor.temperature,
        humidity: sensor.humidity,
        alert: sensor.alert,
        majorChange: sensor.majorChange,
        createdAt: sensor.createdAt,
        dataSource: getDataSource(sensor.deviceId)
      });
    }
  }

  return {
    type: "sensor",
    data: readings
  };
}


// -----------------------------------
// Get box information
// -----------------------------------

async function getAssistantBoxData() {
  const boxes = await Box
    .find()
    .lean();

  return boxes.map(box => ({
    deviceId: box.deviceId,
    boxName: box.boxName,
    location: box.location,
    medicines: box.medicines,
    dataSource: getDataSource(box.deviceId)
  }));
}


// -----------------------------------
// Get medicine information
// -----------------------------------

async function getAssistantMedicineData() {
  const medicines = await Medicine
    .find()
    .lean();

  return medicines.map(medicine => ({
    name: medicine.name,
    minTemp: medicine.minTemp,
    maxTemp: medicine.maxTemp,
    humidityRange: medicine.humidityRange
  }));
}


// -----------------------------------
// Get maintenance information
// -----------------------------------

async function getAssistantMaintenanceData() {
  const maintenance = await Maintenance
    .find()
    .sort({ deviceId: 1 })
    .lean();

  return maintenance.map(record => ({
    deviceId: record.deviceId,
    manufacturingDate: record.manufacturingDate,
    activationDate: record.activationDate,
    warrantyExpiry: record.warrantyExpiry,
    totalServicesRequired:
      record.totalServicesRequired,
    nextServiceDate:
      record.nextServiceDate,

    services: record.services || []
  }));
}


// -----------------------------------
// Get ML prediction information
// -----------------------------------

function getAssistantPredictionData() {
  try {
    const filePath = path.join(
      __dirname,
      "..",
      "ml_predictions.json"
    );

    const data = fs.readFileSync(
      filePath,
      "utf8"
    );

    return JSON.parse(data);

  } catch (error) {
    console.log(
      "AI prediction context error:",
      error.message
    );

    return null;
  }
}

// ===================================
// Build AI Context
// ===================================

async function buildAssistantContext(message) {
  const lowerMessage = message.toLowerCase();

  const context = {
    system: {
      project:
        "IoT-Based Cold Supply Chain Monitoring System",

      description:
        "A cold-chain monitoring platform for medicine storage and transportation.",

      temperatureRange:
        "The dashboard uses 2°C to 8°C as the cold-chain temperature range.",

      liveHardwareDevice:
        LIVE_DEVICE_ID || "Not configured",

      importantDataRule:
        "Only the configured LIVE_DEVICE_ID represents the physical hardware device. Other device data is demonstration data."
    }
  };


  // ---------------------------------
  // Sensor information
  // ---------------------------------

  const sensorData =
    await getAssistantSensorData(message);

  if (sensorData) {
    context.sensorData = sensorData;
  }


  // ---------------------------------
  // Box information
  // ---------------------------------

  const asksAboutBoxes = [
    "box",
    "boxes",
    "container",
    "storage"
  ].some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (asksAboutBoxes) {
    context.boxes =
      await getAssistantBoxData();
  }


  // ---------------------------------
  // Maintenance information
  // ---------------------------------

  const asksAboutMaintenance = [
    "maintenance",
    "maintain",
    "service",
    "serviced",
    "technician",
    "warranty",
    "repair"
  ].some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (asksAboutMaintenance) {
    context.maintenance =
      await getAssistantMaintenanceData();
  }


  // ---------------------------------
  // Medicine information
  // ---------------------------------

  const asksAboutMedicine = [
    "medicine",
    "medicines",
    "vaccine",
    "vaccines",
    "insulin",
    "plasma",
    "inventory",
    "drug"
  ].some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (asksAboutMedicine) {
    context.medicines =
      await getAssistantMedicineData();
  }


  // ---------------------------------
  // Prediction information
  // ---------------------------------

  const asksAboutPrediction = [
    "prediction",
    "predict",
    "forecast",
    "future temperature",
    "30 minute",
    "30 minutes",
    "overheat",
    "overheating"
  ].some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (asksAboutPrediction) {
    context.predictions =
      getAssistantPredictionData();
  }


  // ---------------------------------
  // Alert information
  // ---------------------------------

  const asksAboutAlerts = [
    "alert",
    "alerts",
    "warning",
    "warnings",
    "alarm",
    "alarms"
  ].some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (asksAboutAlerts) {
    const alerts = await SensorData
      .find({
        majorChange: true
      })
      .sort({
        createdAt: -1
      })
      .limit(20)
      .lean();

    context.alerts = alerts.map(alert => ({
      deviceId: alert.deviceId,
      boxName: alert.boxName,
      location: alert.location,
      temperature: alert.temperature,
      humidity: alert.humidity,
      alert: alert.alert,
      majorChange: alert.majorChange,
      createdAt: alert.createdAt,
      dataSource: getDataSource(
        alert.deviceId
      )
    }));
  }


  return context;
}

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

function cleanAssistantResponse(text) {
  if (!text) {
    return "";
  }

  let cleaned = text;

  // Remove Markdown headings
  cleaned = cleaned.replace(/^\s*#{1,6}\s*/gm, "");

  // Remove bold and italic markers
  cleaned = cleaned.replace(/\*\*/g, "");
  cleaned = cleaned.replace(/__/g, "");
  cleaned = cleaned.replace(/\*/g, "");
  cleaned = cleaned.replace(/_/g, "");

  // Remove inline code markers
  cleaned = cleaned.replace(/`/g, "");

  // Remove Markdown horizontal lines
  cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // Convert Markdown bullets to normal bullets
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, "• ");

  // Remove numbered Markdown formatting if desired
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "• ");

  // Remove excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Remove spaces before punctuation
  cleaned = cleaned.replace(/\s+([,.!?])/g, "$1");

  return cleaned.trim();
}

// ===================================
// Gemini AI Assistant
// ===================================

app.post(
  "/api/assistant/chat",
  async (req, res) => {

    try {

      const {
        message,
        role
      } = req.body;


      // ---------------------------------
      // Validate message
      // ---------------------------------

      if (
        !message ||
        typeof message !== "string"
      ) {
        return res.status(400).json({
          message:
            "A valid message is required."
        });
      }


      console.log(
        "🤖 AI Question:",
        message
      );


      // ---------------------------------
      // Build platform context
      // ---------------------------------

      const platformContext =
        await buildAssistantContext(
          message.trim()
        );


      console.log(
        "📊 AI Context prepared"
      );


      // ---------------------------------
      // Gemini
      // ---------------------------------

      const ai =
        await getGeminiClient();


      const systemInstruction = `
You are Cold Chain AI, the intelligent
operations assistant for an IoT-Based
Cold Supply Chain Monitoring System.

================================================
PLATFORM
================================================

The website monitors medicine storage and
transportation conditions.

Main website features include:

- Dashboard
- Temperature monitoring
- Humidity monitoring
- Cold-storage boxes
- Sensor readings
- Alerts
- Temperature history
- ML temperature prediction
- Maintenance management
- Medicine information
- Inventory
- Box locations
- Feedback

================================================
DATA SOURCES
================================================

The backend provides structured platform
data to you in the CONTEXT section.

MongoDB contains:

- Sensor readings
- Box information
- Medicine information
- Maintenance records

The system also has ML prediction information.

================================================
LIVE VS DEMONSTRATION DATA
================================================

There is currently only ONE physical IoT
hardware device.

LIVE HARDWARE DEVICE:
${LIVE_DEVICE_ID || "Not configured"}

Only readings belonging to that device should
be described as LIVE HARDWARE DATA.

All other box readings should be described as
DEMONSTRATION DATA.

NEVER describe demonstration data as live
hardware data.

================================================
DATA ACCURACY
================================================

This is extremely important.

When answering questions about the platform:

- Use the supplied CONTEXT.
- Do not invent sensor readings.
- Do not invent maintenance records.
- Do not invent inventory information.
- Do not invent prediction results.
- Do not claim that you accessed MongoDB directly.
- If the requested information is not present
  in CONTEXT, clearly say that the information
  is currently unavailable.
- Do not make up a device's status.

================================================
TEMPERATURE
================================================

The dashboard uses:

2°C - 8°C

as the cold-chain temperature range.

When discussing temperature, use the actual
reading supplied in CONTEXT.

================================================
LANGUAGE
================================================

Support:

English
Hindi
Hinglish

English question:
Respond in English.

Hindi question:
Respond in Hindi.

Hinglish question:
Respond naturally in Hinglish.

Do not unnecessarily translate technical
device IDs, medicine names, or numerical values.

================================================
USER ROLE
================================================

The user's role is:

${role || "Unknown"}

Consider the role when explaining operational
information, but do not hide relevant platform
information unless the application explicitly
requires it.

================================================
RESPONSE STYLE
================================================

Answer clearly, naturally, and concisely.

IMPORTANT:
- Return PLAIN TEXT ONLY.
- Do NOT use Markdown.
- Do NOT use # headings.
- Do NOT use ## headings.
- Do NOT use ### headings.
- Do NOT use **bold**.
- Do NOT use *italics*.
- Do NOT use --- separators.
- Do NOT use Markdown tables.
- Do NOT use backticks.
- Do NOT use Markdown links.

Use simple numbered lists or bullet points when useful.

For example, use:

Active alerts:

1. BOX-LKO-01 - Vaccine Freezer #1
   Temperature: 27.5°C
   Humidity: 61.3%
   Source: Live hardware data

Do NOT write:

### Active Alerts

**BOX-LKO-01**

**Temperature:** 27.5°C

Keep normal answers between 50 and 150 words unless the user specifically asks for more detail.

For operational questions:
1. Give the relevant data.
2. Explain what it means.
3. Give a practical next step when appropriate.

Do not unnecessarily mention that you are an AI.

${JSON.stringify(
  platformContext,
  null,
  2
)}
`;


      // ---------------------------------
      // Generate Gemini response
      // ---------------------------------

      const response =
        await ai.models.generateContent({

          model: "gemini-3.6-flash",

          contents:
            message.trim(),

          config: {

            systemInstruction,

            temperature: 0.2,

            maxOutputTokens: 400

          }

        });


     const answer =
  cleanAssistantResponse(response.text);


      if (!answer) {

        return res.status(502).json({
          message:
            "Gemini did not return a response."
        });

      }


      // ---------------------------------
      // Return answer
      // ---------------------------------

      res.json({
        answer
      });


    } catch (error) {

      console.error(
        "❌ Gemini Assistant Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate assistant response."
      });

    }

  }
);
// ===================================
// 5️⃣ Start Server
// ===================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});