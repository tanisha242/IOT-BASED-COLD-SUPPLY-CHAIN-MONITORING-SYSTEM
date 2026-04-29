import React from "react";
import { BOXES } from "./boxes";
import { ADMIN_DATA } from "../pages/adminData";
import "../styles/adminDashboard.css";

export default function AdminDashboard2() {

  const userId = "admin2";
  const adminInfo = ADMIN_DATA[userId];

  // Admin2 can see all boxes
  const assignedBoxes = BOXES;

  return (
    <div className="admin-dashboard">
      <h2>Welcome, ADMIN2</h2>
      <h3>📦 Shipment Monitoring</h3>

      {assignedBoxes.map((box, index) => (
        <div className="admin-box-card" key={index}>

          <p><b>Device ID:</b> {box.deviceId}</p>
          <p><b>Box Name:</b> {box.name}</p>
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

          <button className="btn" onClick={() => window.print()}>
            Download Transport Certificate
          </button>

        </div>
      ))}
    </div>
  );
}