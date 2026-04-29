// src/pages/AdminDashboard1.js
import React, { useRef } from "react";
import { BOXES } from "./boxes";
import "../styles/adminDashboard.css";
import { ADMIN_DATA } from "../pages/adminData";

export default function AdminDashboard1() {
  const printRef = useRef();
  const userId = localStorage.getItem("userId");
  const adminInfo = ADMIN_DATA[userId];
  const assignedBoxes =
  userId === "admin1"
    ? BOXES
    : BOXES.filter(box => box.assignedTo === userId);

  return (
    <div className="admin-dashboard">
      <h2>Welcome, {userId.toUpperCase()}</h2>
      <h3>📦 Shipment Monitoring</h3>

      {assignedBoxes.length > 0 ? (
       assignedBoxes.map((box, index) => (
        <div className="admin-box-card" ref={printRef} key={index}>
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
          <button
            className="btn"
            onClick={() => {
            const printContents = printRef.current.innerHTML;
            const originalContents = document.body.innerHTML;

            document.body.innerHTML = printContents;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
          }}
       >
            Download Transport Certificate
       </button>
      
        </div>
       ))
      ) : (
        <p>No assigned cold storage found.</p>
      )}
    </div>
  );
}
