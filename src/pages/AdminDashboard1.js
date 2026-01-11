// src/pages/AdminDashboard1.js
import React from "react";
import { BOXES } from "./boxes";
import "../styles/adminDashboard.css";
import { ADMIN_DATA } from "../pages/adminData";

export default function AdminDashboard1() {
  const userId = localStorage.getItem("userId");
  const adminInfo = ADMIN_DATA[userId];
  const assignedBox = BOXES.find(box => box.assignedTo === userId);

  return (
    <div className="admin-dashboard">
      <h2>Welcome, {userId.toUpperCase()}</h2>
      <h3>📦 Shipment Monitoring</h3>

      {assignedBox ? (
        <div className="admin-box-card">
          <p><b>Device ID:</b> {assignedBox.deviceId}</p>
          <p><b>Box Name:</b> {assignedBox.name}</p>
          <p><b>Receiver:</b> {adminInfo.receiver}</p>
          <p><b>Shipment Status:</b> {adminInfo.shipmentStatus}</p>
          <p><b>Expected Arrival:</b> {adminInfo.expectedArrival}</p>
          <p><b>Checkpoints Passed:</b> {adminInfo.checkpointsPassed}</p>
          <p><b>Temperature Alerts:</b> {adminInfo.alertHistory}</p>

          <h4>Medicines Included:</h4>
          <ul>
            {adminInfo.medicines.map((med, i) => (
              <li key={i}>{med}</li>
            ))}
          </ul>

          <button className="btn">Download Transport Certificate</button>
        </div>
      ) : (
        <p>No assigned cold storage found.</p>
      )}
    </div>
  );
}
