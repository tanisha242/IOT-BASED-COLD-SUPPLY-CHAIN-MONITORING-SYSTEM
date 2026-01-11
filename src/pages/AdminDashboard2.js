import React from "react";
import { useNavigate } from "react-router-dom";
import { BOXES } from "./boxes";
import "../styles/adminDashboard.css";

export default function AdminDashboard2() {
  const navigate = useNavigate();

  // Admin 2 handles boxes 6 to 10
  const assignedBoxes = BOXES.slice(5, 10);

  return (
    <div className="admin-dashboard">
      <h2 className="admin-title">Admin 2 — Assigned Boxes</h2>

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
