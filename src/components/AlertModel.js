import React from "react";
import "../styles/AlertModel.css";
export default function AlertModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal-box">
        <h2>⚠ Temperature Alert!</h2>
        <p><strong>Box:</strong> {data.deviceId || "Unknown"}</p>
        <p><strong>Temperature:</strong> {data.temperature} °C</p>
        <p><strong>Humidity:</strong> {data.humidity} %</p>

        <button className="alert-modal-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
