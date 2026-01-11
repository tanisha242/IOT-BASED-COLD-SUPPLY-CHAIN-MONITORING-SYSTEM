const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },   // e.g. BOX-LKO-01
    boxName: { type: String },                    // Human name (optional)
    location: { type: String },                   // e.g. Lucknow
    temperature: Number,
    humidity: Number,
    alert: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

// helpful indexes
sensorSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model("SensorData", sensorSchema);
