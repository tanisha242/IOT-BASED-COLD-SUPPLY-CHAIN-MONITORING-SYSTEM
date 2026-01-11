// src/data/adminData.js
export const ADMIN_DATA = {
  admin1: {
    assignedDevice: "BOX-LKO-01",
    receiver: "AIIMS Pharmacy Control",
    medicines: ["Covaxin Vaccines", "Insulin Vials", "Rabies Serum"],
    expectedArrival: "Today, 5:30 PM",
    checkpointsPassed: "3 / 6",
    shipmentStatus: "In Transit - Stable",
    alertHistory: "No major temperature breach detected",
  },
  admin2: {
    assignedDevice: "BOX-DEL-02",
    receiver: "Apollo Clinic Jaipur",
    medicines: ["Chemotherapy Pack", "Emergency Trauma Medication"],
    expectedArrival: "Tomorrow, 11:00 AM",
    checkpointsPassed: "1 / 7",
    shipmentStatus: "Minor alert detected",
    alertHistory: "Temp rise at Neemrana checkpoint - Resolved",
  },
  admin3: {
    assignedDevice: "BOX-MUM-03",
    receiver: "Tata Oncology Center Pune",
    medicines: ["Frozen Plasma", "Bone Marrow Samples"],
    expectedArrival: "Today, 11:40 PM",
    checkpointsPassed: "2 / 5",
    shipmentStatus: "Stable",
    alertHistory: "No breach detected",
  },
};
