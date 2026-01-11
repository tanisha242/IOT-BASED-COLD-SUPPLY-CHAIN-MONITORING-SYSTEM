// src/pages/BoxDetails.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../styles/boxdetails.css";

/* DEMO trending data generator */
function generateDemoHistory(seedId, points = 30) {
  const seed = parseInt(String(seedId).replace(/\D/g, "")) || 1;
  const baseTemp = 5 + (seed % 10);
  const baseHum = 40 + (seed % 30);

  const arr = [];
  for (let i = points - 1; i >= 0; i--) {
    const t = baseTemp + Math.sin(i / 4) * 0.8 + (Math.random() * 1.2 - 0.6);
    const h = baseHum + Math.cos(i / 5) * 1.2 + (Math.random() * 2 - 1);

    arr.push({
      temperature: parseFloat(t.toFixed(1)),
      humidity: parseFloat(h.toFixed(1)),
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
      alert: Math.random() > 0.985,
    });
  }
  return arr;
}

/* UNIQUE shipment info for demo boxes */
const SHIPMENT_INFO = {
  "BOX-DEL-02": {
    start: "Delhi Cold Hub",
    destination: "AIIMS Delhi Pharmacy",
    category: "Insulin Vials (2–8°C)",
    passed: 3,
    total: 7,
    eta: "6 hrs",
  },
  "BOX-MUM-03": {
    start: "Mumbai Bio Storage",
    destination: "Pune Oncology Center",
    category: "Chemotherapy Drugs (2–8°C)",
    passed: 1,
    total: 5,
    eta: "4 hrs",
  },
  "BOX-BLR-04": {
    start: "Bangalore Warehouse 14",
    destination: "Mysore Medical Institute",
    category: "Blood Plasma (-20°C)",
    passed: 4,
    total: 9,
    eta: "12 hrs",
  },
  "BOX-HYD-05": {
    start: "Hyderabad Pharma Park",
    destination: "Vizag Coastal Hospital",
    category: "Rabies Vaccines (2–8°C)",
    passed: 2,
    total: 8,
    eta: "9 hrs",
  },
};

export default function BoxDetails() {
  const { deviceId } = useParams();
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const isReal = deviceId === "BOX-LKO-01";

  // Format time
  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    let mounted = true;
    let timer = null;

    const fetchHistory = async () => {
      if (!isReal) return; // ⬅️ DEMO boxes do NOT fetch real data

      try {
        // ✅ CORRECT: call history for this specific device, with your PC IP
        const res = await fetch(
          `http://10.57.185.128:5000/api/sensor/history/${deviceId}`,
          { cache: "no-store" }
        );

        if (!res.ok) return;
        const arr = await res.json();
        if (!mounted || !Array.isArray(arr) || arr.length === 0) return;

        const orderedArr = arr
          .slice()
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        setHistory(orderedArr);
        setLatest(orderedArr[orderedArr.length - 1] || null);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    if (isReal) {
      // REAL BOX → pull from backend periodically
      fetchHistory();
      timer = setInterval(fetchHistory, 10000);
    } else {
      // DEMO BOXES → use generated fake data
      const demoData = generateDemoHistory(deviceId, 30);
      setHistory(demoData);
      setLatest(demoData[demoData.length - 1]);
    }

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [deviceId, isReal]);

  const tempCurrent = latest?.temperature ?? "—";
  const humCurrent = latest?.humidity ?? "—";
  const lastUpdate = latest ? new Date(latest.createdAt).toLocaleString() : "—";

  // Use 'let' so we can override for demo
  let alertStatus = latest?.alert || false;

if (!isReal) {
  alertStatus =
    deviceId === "BOX-DEL-02" || deviceId === "BOX-MUM-03";
} else {
  // real device — only alert based on actual data
  alertStatus = latest?.alert || false;
}

  // SHIPMENT
  const shipment = isReal
    ? {
        start: "Lucknow Depot",
        destination: "Kolkata Medical Center",
        category: "Vaccine Transport (2–8°C)",
        total: 6,
        passed: latest ? (new Date(latest.createdAt).getMinutes() % 7) : 3,
        eta: "10 hrs",
      }
    : SHIPMENT_INFO[deviceId] || {
        start: "Unknown Warehouse",
        destination: "N/A",
        category: "Generic Medical Supplies",
        passed: 0,
        total: 5,
        eta: "Unknown",
      };

  return (
    <div className="box-details-page">
      <h2>{deviceId} — Details</h2>

      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Temp</div>
          <div className="value">{tempCurrent} °C</div>
        </div>
        <div className="stat-card">
          <div className="label">Humidity</div>
          <div className="value">{humCurrent} %</div>
        </div>
        <div className="stat-card">
          <div className="label">Last Update</div>
          <div className="value">{lastUpdate}</div>
        </div>
        <div className={`stat-card ${alertStatus ? "alert-card" : ""}`}>
          <div className="label">Status</div>
          <div className="value">{alertStatus ? "ALERT" : "OK"}</div>
        </div>
      </div>

      {/* ----- Acknowledge Alert Button ----- */}
      {alertStatus && (
        <button
          className="btn"
          style={{ marginTop: "15px" }}
          onClick={() => {
            alert("🚨 Alert acknowledged!");
            const count = parseInt(localStorage.getItem("alertCount") || "0");
            localStorage.setItem(
              "alertCount",
              Math.max(count - 1, 0).toString()
            );
          }}
        >
          Acknowledge Alert
        </button>
      )}

      {/* SHIPMENT */}
      <div className="shipment-card">
        <h3>Shipment Summary</h3>
        <div className="row">
          <strong>Start:</strong> {shipment.start}
        </div>
        <div className="row">
          <strong>Destination:</strong> {shipment.destination}
        </div>
        <div className="row">
          <strong>Category:</strong> {shipment.category}
        </div>
        <div className="row">
          <strong>Checkpoints:</strong> {shipment.passed} / {shipment.total}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(shipment.passed / shipment.total) * 100}%`,
            }}
          ></div>
        </div>
        <div className="row">
          <strong>ETA:</strong> {shipment.eta}
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="createdAt" tickFormatter={fmtTime} />
              <YAxis />
              <Tooltip labelFormatter={fmtTime} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#d9534f"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Humidity Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="createdAt" tickFormatter={fmtTime} />
              <YAxis />
              <Tooltip labelFormatter={fmtTime} />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#2b9af3"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT HISTORY */}
      <div className="history-table card">
        <h3>Recent Samples</h3>
        <div className="table-scroll">
          <table className="samples-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {history
                .slice()
                .reverse()
                .slice(0, 20)
                .map((r, i) => (
                  <tr key={i} className={r.alert ? "row-alert" : ""}>
                    <td>{fmtTime(r.createdAt)}</td>
                    <td>{r.temperature}</td>
                    <td>{r.humidity}</td>
                    <td>{r.alert ? "YES" : "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
