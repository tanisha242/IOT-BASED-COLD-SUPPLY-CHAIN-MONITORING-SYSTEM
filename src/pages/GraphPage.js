import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

function GraphPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch("http://localhost:5000/api/sensor/history");
      const data = await res.json();
      setHistory(data);
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: history.map((e) => new Date(e.createdAt).toLocaleTimeString()),
    datasets: [
      {
        label: "Temperature (°C)",
        data: history.map((e) => e.temperature),
        borderColor: "red",
        tension: 0.3,
      },
    ],
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>📊 Temperature Graph (Live)</h2>
      <div style={{ width: "80%", margin: "auto" }}>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default GraphPage;
