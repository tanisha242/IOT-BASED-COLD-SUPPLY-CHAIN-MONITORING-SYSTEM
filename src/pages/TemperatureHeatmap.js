// src/pages/TemperatureHeatmap.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/temperature.css";
import { BOXES } from "./boxes"; // if file inside pages

// OR (if inside components folder):
// import { BOXES } from "../pages/boxes";


/*
  Warehouse Heatmap page
  - Real device: BOX-LKO-01 fetched from backend
  - Demo devices: generated with different bases
*/

// color scale: map temperature (°C) to color
function getTempColor(temp) {
  // clamp
  if (temp === null || temp === undefined || Number.isNaN(Number(temp))) return "#e6e6e6";
  const t = Number(temp);
  // set breakpoints: <=0, 0-5, 5-10, 10-15,15-20,20-25,25-30,>30
  if (t <= 0) return "#0b6ef6";         // deep blue
  if (t <= 5) return "#58a6ff";         // blue
  if (t <= 10) return "#7bd389";        // teal/green
  if (t <= 15) return "#ffd166";        // yellow
  if (t <= 20) return "#ffb27a";        // orange
  if (t <= 25) return "#ff8a65";        // warm orange
  if (t <= 30) return "#ff6b6b";        // red-orange
  return "#d62828";                     // deep red
}

// demo data generator (different base per box)
function genDemoReading(deviceId) {
  // derive a small seed from deviceId to make each demo box different
  const seed = parseInt(deviceId.replace(/\D/g, "").slice(-2) || "10");
  const base = 6 + (seed % 10); // differing base temp
  const temp = (base + (Math.random() * 4 - 2)).toFixed(1); // +/-2
  const humidity = (40 + (seed % 30) + (Math.random() * 6 - 3)).toFixed(1);
  const alert = Math.random() > 0.96; // rare alert
  return {
    deviceId,
    temperature: Number(temp),
    humidity: Number(humidity),
    alert,
    createdAt: new Date().toISOString(),
  };
}

export default function TemperatureHeatmap({ pollInterval = 10000 }) {
  const navigate = useNavigate();
  const [readings, setReadings] = useState({}); // deviceId -> reading
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function fetchReal() {
      try {
        // fetch only the real device history endpoint and extract latest
        const res = await fetch("http://localhost:5000/api/sensor/history/BOX-LKO-01");
        if (!res.ok) {
          console.warn("Heatmap: real device fetch returned", res.status);
          return;
        }
        const arr = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) return;
        const last = arr[arr.length - 1];
        if (!mountedRef.current) return;
       setReadings(prev => ({ ...prev, "BOX-LKO-01": last }));
      } catch (err) {
        console.error("Heatmap: fetch error for real device", err);
      }
    }

    // initial load: set demo boxes + real device
    function seedAll() {
      const init = {};
      BOXES.forEach(box => {
        if (box.demo) init[box.deviceId] = genDemoReading(box.deviceId);
      });
      setReadings(prev => ({ ...init, ...prev }));
    }

    seedAll();
    fetchReal();

    const ivReal = setInterval(fetchReal, pollInterval);

    // also update demo boxes periodically (so they look alive)
    function tickDemo() {
      setReadings(prev => {
        const copy = { ...prev };
        BOXES.forEach(box => {
          if (box.demo) {
            copy[box.deviceId] = genDemoReading(box.deviceId);
          }
        });
        return copy;
      });
    }
    const ivDemo = setInterval(tickDemo, pollInterval); // same interval

    return () => {
      mountedRef.current = false;
      clearInterval(ivReal);
      clearInterval(ivDemo);
    };
  }, [pollInterval]);

  // render card for each box
  return (
    <div className="heatmap-page">
      <div className="heatmap-header">
        <h2>Temperature Heatmap</h2>
        <p className="muted">Quick visual of every box temperature — click a tile for details</p>
      </div>

      <div className="heatmap-grid">
        {BOXES.map(box => {
          const r = readings[box.deviceId];
          const temp = r ? r.temperature : null;
          const hum = r ? r.humidity : null;
          const last = r ? new Date(r.createdAt).toLocaleTimeString() : "—";
          const status = r && r.alert ? "ALERT" : "OK";
          const color = getTempColor(temp);

          return (
            <div
              key={box.deviceId}
              className="heat-tile"
              role="button"
              onClick={() => navigate(`/box/${box.deviceId}`)}
              title={`${box.name}\nTemp: ${temp ?? "—"} °C\nHumidity: ${hum ?? "—"} %\nStatus: ${status}\nLast: ${last}`}
            >
              <div className="tile-top" style={{ background: color }}>
                <div className="tile-name">{box.name}</div>
                <div className={`tile-status ${status === "ALERT" ? "alert" : "ok"}`}>
                  {status}
                </div>
              </div>

              <div className="tile-body">
                <div className="temp-value">{temp !== null ? `${temp}°C` : "—"}</div>
                <div className="hum-value">{hum !== null ? `${hum}%` : "—"}</div>
                <div className="tile-meta">
                  <div className="meta-left">ID: {box.deviceId}</div>
                  <div className="meta-right">Last: {last}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="heatmap-legend">
        <div className="legend-item"><span className="legend-swatch" style={{background: "#0b6ef6"}}></span> ≤ 0°C</div>
        <div className="legend-item"><span className="legend-swatch" style={{background: "#58a6ff"}}></span> 0–5°C</div>
        <div className="legend-item"><span className="legend-swatch" style={{background: "#7bd389"}}></span> 5–10°C</div>
        <div className="legend-item"><span className="legend-swatch" style={{background: "#ffd166"}}></span> 10–15°C</div>
        <div className="legend-item"><span className="legend-swatch" style={{background: "#ffb27a"}}></span> 15–20°C</div>
        <div className="legend-item"><span className="legend-swatch" style={{background: "#d62828"}}></span> &gt; 30°C</div>
      </div>
    </div>
  );
}
