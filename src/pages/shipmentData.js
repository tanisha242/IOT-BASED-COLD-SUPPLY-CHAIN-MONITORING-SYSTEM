// src/pages/shipmentData.js

export const SHIPMENT_DETAILS = {
  "BOX-LKO-01": {
    shipmentId: "SHP-98231",
    batchNumber: "BT-5521-A",
    medicine: "Pfizer mRNA Vaccine",
    category: "Ultra-Cold Chain",
    sensitivity: "Very High",
    company: "Pfizer Pharma Inc.",
    expiry: "2026-08-14",

    start: "Lucknow Depot",
    destination: "AIIMS Delhi",
    route: ["Lucknow", "Kanpur", "Agra", "Noida", "Delhi"],

    totalCheckpoints: 5,
    checkpointsCrossed: 3,

    etaHours: 6,
    status: "In Transit",
    transportMode: "Freezer Truck (-20°C)",

    tempRange: "-20°C to -60°C",
    humidityRange: "10% - 40%",

    timeline: [
      "Shipment created at Lucknow Depot",
      "Loaded into Freezer Truck",
      "Departed from Lucknow",
      "Reached Kanpur Checkpoint",
      "En-route to Agra"
    ],
  },

  // DEMO BOXES
  "BOX-DEL-02": {
    shipmentId: "SHP-77912",
    batchNumber: "BT-8891-D",
    medicine: "Insulin Vials",
    category: "Cold Chain",
    sensitivity: "High",
    company: "Novo Nordisk",
    expiry: "2025-11-05",

    start: "Delhi Warehouse",
    destination: "Amritsar Hospital",
    route: ["Delhi", "Panipat", "Ambala", "Ludhiana", "Amritsar"],

    totalCheckpoints: 5,
    checkpointsCrossed: 2,

    etaHours: 12,
    status: "In Transit",
    transportMode: "Refrigerated Truck (2°C to 8°C)",

    tempRange: "2°C to 8°C",
    humidityRange: "30% - 60%",
    timeline: [
      "Batch packed in Delhi warehouse",
      "Temperature stabilized",
      "Loaded in refrigerated transport"
    ],
  },

  "BOX-MUM-03": {
    shipmentId: "SHP-55812",
    batchNumber: "BT-1201-X",
    medicine: "Chemotherapy Vials",
    category: "Clinic Supply",
    sensitivity: "Very High",
    company: "Cipla Ltd.",
    expiry: "2026-04-10",

    start: "Mumbai Facility",
    destination: "Pune Cancer Institute",
    route: ["Mumbai", "Lonavala", "Pune"],

    totalCheckpoints: 3,
    checkpointsCrossed: 1,

    etaHours: 3,
    status: "Delayed (Traffic)",
    transportMode: "Cold Box Transport",

    tempRange: "4°C to 8°C",
    humidityRange: "30% - 50%",
    timeline: [
      "Packed at Mumbai facility",
      "Loaded in insulated cold box"
    ],
  },
};
