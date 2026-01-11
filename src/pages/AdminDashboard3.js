// src/pages/AdminDashboard3.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { BOXES } from "./boxes";
import "../styles/adminDashboard.css";

export default function AdminDashboard3() {
  const navigate = useNavigate();

  // Admin 3 handles boxes 11 to 20
  const assignedBoxes = BOXES.slice(10, 20);

  return (
    <div className="admin-dashboard">
      <h2 className="admin-title">Admin 3 — Assigned Boxes</h2>

      <div className="admin-box-grid">
        {assignedBoxes.map((box) => (
          <div
            key={box.deviceId}
            className="admin-box-card"
            onClick={() => navigate(`/box/${box.deviceId}`)}
          >
            <div className="admin-box-title">{box.name}</div>
            <div className="admin-box-id">ID: {box.deviceId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
