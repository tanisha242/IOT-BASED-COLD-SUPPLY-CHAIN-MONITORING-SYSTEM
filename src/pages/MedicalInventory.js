import "../styles/adminDashboard.css";
import React from "react";
import { MEDICINES } from "./medicines";

export default function MedicalInventory() {
  return (
    <div className="inventory-container">
      <h2 className="inventory-title">💊 Medical Inventory</h2>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Temperature Range</th>
              <th>Humidity Limit</th>
              <th>Storage Type</th>
            </tr>
          </thead>

          <tbody>
            {MEDICINES.map((med) => (
              <tr key={med.medicineId}>
                <td>{med.medicineId}</td>
                <td>{med.name}</td>
                <td>{med.category}</td>
                <td>{med.minTemp}°C - {med.maxTemp}°C</td>
                <td>{med.humidityLimit}%</td>
                <td>{med.storageType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}