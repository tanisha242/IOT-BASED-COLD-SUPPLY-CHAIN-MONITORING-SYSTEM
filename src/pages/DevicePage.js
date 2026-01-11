import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DevicePage() {
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const res = await fetch("http://10.57.185.128:5000/api/sensor/devices", {
  cache: "no-store",
});
      const data = await res.json();
      setDevices(data);
    };
    load();
  }, []);

  return (
    <div className="content">
      <h2 style={{ textAlign: "center" }}>📦 All Devices</h2>

      <div style={{ display: "grid", gap: "18px", marginTop: "20px" }}>
        {devices.map((id) => (
          <div
            key={id}
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/graph/${id}`)}
          >
            <h3>Device: {id}</h3>
            <p className="small-muted">Click to view graph</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DevicePage;
