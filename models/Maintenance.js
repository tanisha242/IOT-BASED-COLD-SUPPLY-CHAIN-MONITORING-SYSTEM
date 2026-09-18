const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true
    },

    manufacturingDate: {
      type: Date,
      required: true
    },

    activationDate: {
      type: Date,
      required: true
    },

    warrantyExpiry: {
      type: Date,
      required: true
    },

    totalServicesRequired: {
      type: Number,
      required: true,
      min: 0
    },

    nextServiceDate: {
      type: Date
    },

    services: [
      {
        serviceDate: {
          type: Date,
          required: true
        },

        serviceType: {
          type: String,
          default: "Preventive Maintenance"
        },

        technician: {
          type: String,
          default: ""
        },

        cost: {
          type: Number,
          default: 0
        },

        remarks: {
          type: String,
          default: ""
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Maintenance",
  MaintenanceSchema,
  "maintenance"
);