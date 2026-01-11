// ---------------- Dashboard.js -----------------
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModel";
import { BOXES } from "../pages/boxes";

const ALERT_INTERVAL = 60000;             
const TEMP_CHANGE_THRESHOLD = 1.0;        

export default function Dashboard() {
  const navigate = useNavigate();
  const [latest, setLatest] = useState({});
  const [alertData, setAlertData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCount, setAlertCount] = useState(parseInt(localStorage.getItem("alertCount") || "0"));

  const lastAlertTime = useRef(parseInt(localStorage.getItem("lastAlertTime") || "0"));
  const lastRealTemp = useRef(null);
  const audioRef = useRef(new Audio("/alert.mp3"));

  useEffect(() => {
    localStorage.setItem("alertCount", alertCount.toString());
  }, [alertCount]);

  useEffect(() => {
    const REAL_ID = "BOX-LKO-01";

    async function fetchReal() {
      try {
        const res = await fetch("http://10.57.185.128:5000/api/sensor/latest", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data) return;

        setLatest(prev => ({ ...prev, [REAL_ID]: data }));

        if (lastRealTemp.current !== null) {
          const tempJump = Math.abs(data.temperature - lastRealTemp.current);
          if (
            tempJump >= TEMP_CHANGE_THRESHOLD &&
            Date.now() - lastAlertTime.current > ALERT_INTERVAL
          ) {
            lastAlertTime.current = Date.now();
            localStorage.setItem("lastAlertTime", Date.now().toString());

            setAlertData({
              ...data,
              alertMessage: `Temperature changed by ${tempJump.toFixed(1)}°C`
            });

            setShowAlert(true);
            setAlertCount(prev => prev + 1);
            audioRef.current.play().catch(() => {});
          }
        }

        lastRealTemp.current = data.temperature;

      } catch (err) {
        console.log("Real fetch error:", err);
      }
    }

    fetchReal();
    const iv = setInterval(fetchReal, 10000);
    return () => clearInterval(iv);
  }, []); 

  // ================================
  // DEMO BOXES (BOX 2 & 3 only)
  // ================================
  useEffect(() => {
    function generateDemoData() {
      const updates = {};

      BOXES.forEach(box => {
        if (!box.demo) return;
        const seed = parseInt(box.deviceId.split("-")[2]);
        const forceAlert = box.deviceId === "BOX-DEL-02" || box.deviceId === "BOX-MUM-03";

        const temp = 6 + (seed % 10) + (Math.random() * 2 - 1);
        const hum = 40 + (seed % 30) + (Math.random() * 3 - 1);

        const newData = {
          temperature: temp.toFixed(1),
          humidity: hum.toFixed(1),
          alert: forceAlert,
          createdAt: new Date().toISOString()
        };

        updates[box.deviceId] = newData;

        if (
          forceAlert &&
          Date.now() - lastAlertTime.current > ALERT_INTERVAL
        ) {
          lastAlertTime.current = Date.now();
          localStorage.setItem("lastAlertTime", Date.now().toString());

          setAlertData({
            deviceId: box.deviceId,
            temperature: newData.temperature,
            humidity: newData.humidity,
            createdAt: newData.createdAt
          });

          setShowAlert(true);
          setAlertCount(prev => prev + 1);
          audioRef.current.play().catch(() => {});
        }
      });

      setLatest(prev => ({ ...prev, ...updates }));
    }

    generateDemoData();
    const iv = setInterval(generateDemoData, 12000);
    return () => clearInterval(iv);
  }, []);

  // ================================
  // UI
  // ================================
  return (
    <div className="dashboard-page">
      {showAlert && (
        <AlertModal
          data={alertData}
          onClose={() => {
            setShowAlert(false);
            setAlertCount(prev => Math.max(prev - 1, 0));
            lastAlertTime.current = Date.now();
            localStorage.setItem("lastAlertTime", Date.now().toString());
          }}
        />
      )}

      <section className="summary-row">
        <div className="summary-card"><div className="label">Total Boxes</div><div className="big">{BOXES.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="big">{latest["BOX-LKO-01"] ? 1 : 0}</div></div>
        <div className="summary-card"><div className="label">Alerts</div><div className="big">{alertCount}</div></div>
        <div className="summary-card">
          <div className="label">Last Update</div>
          <div className="big">
            {latest["BOX-LKO-01"]
              ? new Date(latest["BOX-LKO-01"].createdAt).toLocaleTimeString()
              : "—"}
          </div>
        </div>
      </section>

      <section className="boxes-grid">
        {BOXES.map(box => {
          const data = latest[box.deviceId];
          return (
            <div key={box.deviceId} className="box-card" onClick={() => navigate(`/box/${box.deviceId}`)}>
              <div className="box-row">
                <div className="box-title">{box.name}</div>
                <div className={`status-pill ${data?.alert ? "alert" : "ok"}`}>
                  {data?.alert ? "ALERT" : "OK"}
                </div>
              </div>
              <div className="box-meta">
                <div><strong>ID:</strong> {box.deviceId}</div>
                <div><strong>Location:</strong> {box.demo ? "Demo Warehouse" : "Lucknow Depot"}</div>
              </div>
              <div className="box-stats">
                <div><div className="stat-label">Temp</div><div className="stat-value">{data?.temperature} °C</div></div>
                <div><div className="stat-label">Humidity</div><div className="stat-value">{data?.humidity} %</div></div>
              </div>
              <div className="muted">
                Last update: {data ? new Date(data.createdAt).toLocaleTimeString() : "—"}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
