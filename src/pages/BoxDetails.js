// src/pages/BoxDetails.js
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
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

  const datasets = {
    "BOX-DEL-02": { temp: 6.2, hum: 44 },
    "BOX-MUM-03": { temp: 7.1, hum: 48 },
    "BOX-BLR-04": { temp: -18, hum: 52 },
    "BOX-HYD-05": { temp: 5.5, hum: 46 },
    "BOX-PUNE-06": { temp: 6.8, hum: 43 }
  };

  const base = datasets[seedId] || { temp: 6, hum: 45 };

  const arr = [];

  for (let i = points - 1; i >= 0; i--) {

    arr.push({
      temperature: parseFloat(
        (base.temp + Math.sin(i / 4) * 0.5).toFixed(1)
      ),
      humidity: parseFloat(
        (base.hum + Math.cos(i / 5) * 1.5).toFixed(1)
      ),
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
      alert: false
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
  const [boxInfo, setBoxInfo] = useState(null);
  const [predictions,setPredictions] = useState([]);
  const [realPrediction, setRealPrediction] = useState(null);
  const isReal = deviceId === "BOX-LKO-01";
  const [posIndex, setPosIndex] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);


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
        const res = await fetch(`http://localhost:5000/api/sensor/history/${deviceId}`,
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

  
useEffect(() => {
  const fetchBoxInfo = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/boxes/details");
      const data = await res.json();

      const box = data.find(b => b.deviceId === deviceId);
      if (box) setBoxInfo(box);

    } catch (err) {
      console.error("Error fetching box info:", err);
    }
  };

  fetchBoxInfo();
}, [deviceId]);

useEffect(()=>{

  const fetchPredictions = async () => {

    const res = await fetch("http://localhost:5000/api/predictions");
    const data = await res.json();

    setPredictions(data);
  };

  fetchPredictions();

},[]);

useEffect(()=>{

  if(!isReal) return;

  const fetchRealPrediction = async () => {

    try{

      const res = await fetch(`http://localhost:5000/api/predict/${deviceId}`);
      const data = await res.json();

      setRealPrediction(data.predictedTemp);

    }catch(err){
      console.error("Prediction error:",err);
    }

  };

  fetchRealPrediction();
   const interval = setInterval(fetchRealPrediction, 10000);
  // cleanup when component unmounts
  return () => clearInterval(interval);
},[deviceId,isReal]);

useEffect(() => {
  if (routePoints.length === 0) return;

  const interval = setInterval(() => {
    setPosIndex(prev => {
      if (prev >= routePoints.length - 1) return prev;
      return prev + 1;
    });
  }, 200); // 🔥 smooth movement (100ms)

  return () => clearInterval(interval);
}, [routePoints]);


function Routing({ checkpoints, setRoutePoints }) {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!checkpoints || checkpoints.length < 2) return;

    if (!routingRef.current) {
      routingRef.current = L.Routing.control({
        waypoints: checkpoints.map(c => L.latLng(c.pos[0], c.pos[1])),
        lineOptions: {
          styles: [{ color: "blue", weight: 5 }]
        },
        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        routeWhileDragging: false,
        show: false
      }).addTo(map);

      // 🔥 THIS IS THE IMPORTANT PART
     routingRef.current.on("routesfound", function (e) {
  const route = e.routes[0].coordinates;
  const points = route.map(p => [p.lat, p.lng]);

  setRoutePoints(points);
  setPosIndex(0);   // 🔥 RESET movement
});
    }
    }, [checkpoints, map, setRoutePoints]);
  return null;
}
  const tempCurrent = latest?.temperature ?? "—";
  // ================= GPS PATH =================
// 🔥 BOX-WISE ROUTE CONFIGURATION
const ROUTES = {
 "BOX-LKO-01": [
  { name: "Lucknow Depot", pos: [26.8467, 80.9462] },
  { name: "Raebareli Highway", pos: [26.2300, 81.2400] },
  { name: "Prayagraj Hub", pos: [25.4358, 81.8463] },
  { name: "Varanasi Checkpoint", pos: [25.3176, 82.9739] },
  { name: "Dhanbad Corridor", pos: [23.7957, 86.4304] },
  { name: "Kolkata Entry", pos: [22.5726, 88.3639] },
  { name: "Kolkata Medical Center", pos: [22.5726, 88.3639] }
],

  "BOX-DEL-02": [
    { name: "Delhi Cold Hub", pos: [28.7041, 77.1025] },
    { name: "Karol Bagh", pos: [28.6510, 77.1900] },
    { name: "Connaught Place", pos: [28.6315, 77.2167] },
    { name: "ITO Crossing", pos: [28.6280, 77.2410] },
    { name: "Lajpat Nagar", pos: [28.5670, 77.2430] },
    { name: "AIIMS Area", pos: [28.5672, 77.2100] },
    { name: "AIIMS Delhi Pharmacy", pos: [28.5672, 77.2100] }
  ],

  "BOX-MUM-03": [
    { name: "Mumbai Storage", pos: [19.0760, 72.8777] },
    { name: "Dadar", pos: [19.0176, 72.8562] },
    { name: "Chembur", pos: [19.0626, 72.9005] },
    { name: "Pune Highway", pos: [18.9400, 73.1200] },
    { name: "Pune Hospital", pos: [18.5204, 73.8567] }
  ]
};

// Moving truck icon
const truckIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png",
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

// Passed checkpoint
const passedIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

// 🔵 Current checkpoint
const currentIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

// ⚪ Upcoming checkpoint
const upcomingIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png",
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

const getCheckpointIcon = (index) => {
  if (index < currentCheckpointIndex) return passedIcon;
  if (index === currentCheckpointIndex) return currentIcon;
  return upcomingIcon;
};
const checkpoints = ROUTES[deviceId] || [];
const current = routePoints.length > 0 ? routePoints[posIndex] : null;

const getCurrentCheckpointIndex = () => {
  if (!current || checkpoints.length === 0) return 0;

  let minDist = Infinity;
  let closestIndex = 0;

  checkpoints.forEach((cp, index) => {
    const dx = cp.pos[0] - current[0];
    const dy = cp.pos[1] - current[1];
    const dist = dx * dx + dy * dy;

    if (dist < minDist) {
      minDist = dist;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const currentCheckpointIndex = getCurrentCheckpointIndex();

// ============================================
  const humCurrent = latest?.humidity ?? "—";
  const lastUpdate = latest ? new Date(latest.createdAt).toLocaleString() : "—";
  let alertStatus = latest?.alert || false;

if (!isReal) {
  alertStatus =
    deviceId === "BOX-DEL-02" || deviceId === "BOX-MUM-03";
} else {
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

      {/* AI Prediction */}
{predictions.length > 0 && (
<div className="shipment-card">
  <h3>Temperature Prediction</h3>

  {isReal ? (

    <div className="row">
      <strong>Predicted Temp (30 min):</strong>
      {realPrediction !== null ? `${realPrediction} °C` : "--"}
    </div>

  ) : (

    predictions
      .filter((p) => p.deviceId === deviceId)
      .map((p) => (
        <div key={p.deviceId} className="row">
          <strong>Predicted Temp (30 min):</strong> {p.predictedTemp} °C

          <span
            style={{
              marginLeft: "10px",
              fontWeight: "600",
              color: p.risk ? "#d93025" : "#16a34a"
            }}
          >
            {p.risk ? "⚠ Cold Chain Risk" : "SAFE"}
          </span>
        </div>
      ))

  )}

</div>
)}
      {boxInfo && (
  <div className="shipment-card">
    <h3>Stored Medicines</h3>

   {boxInfo.medicines.map((m) => {
  const safe =
    latest?.temperature >= m.minTemp &&
    latest?.temperature <= m.maxTemp;

  return (
    <div key={m._id} className="medicine-row">
      <strong>{m.name}</strong> — {m.minTemp}°C to {m.maxTemp}°C

      <span
        style={{
          marginLeft: "10px",
          fontWeight: "600",
          color: safe ? "#16a34a" : "#d93025"
        }}
      >
        {safe ? "SAFE" : "UNSAFE"}
      </span>
    </div>
  );
})}
  </div>
)}
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
          .map((r, i) => {
            return (
              <tr key={i} className={r.alert ? "row-alert" : ""}>
                <td>{fmtTime(r.createdAt)}</td>
                <td>{r.temperature}</td>
                <td>{r.humidity}</td>
                <td>{r.alert ? "YES" : "—"}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  </div>
</div>

{/* LIVE TRACKING MAP */}
<div className="shipment-card">
  <h3>Live Tracking</h3>

  <MapContainer
    center={[28.6139, 77.3910]}
    zoom={14}
    style={{ height: "300px", width: "100%" }}
  >
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

    <Routing checkpoints={checkpoints} setRoutePoints={setRoutePoints} />

    {checkpoints.map((cp, index) => (
      <Marker
        key={index}
        position={cp.pos}
        icon={getCheckpointIcon(index)}
      >
        <Popup>
          <strong>{cp.name}</strong><br />
          {index < currentCheckpointIndex && "✅ Passed"}
          {index === currentCheckpointIndex && "🚚 Current Location"}
          {index > currentCheckpointIndex && "⏳ Upcoming"}
        </Popup>
      </Marker>
    ))}

    {current && (
      <Marker position={current} icon={truckIcon}>
        <Popup>🚚 Moving...</Popup>
      </Marker>
    )}
  </MapContainer>
</div>
</div>
  );
}