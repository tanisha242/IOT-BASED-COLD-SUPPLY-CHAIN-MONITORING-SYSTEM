import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

function GraphPage() {

  const [history, setHistory] = useState([]);

  useEffect(() => {

    const fetchHistory = async () => {

      try {

        const res = await fetch("http://localhost:5000/api/sensor/history");
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setHistory(data.slice(-30)); // keep last 30 points
        }

      } catch (err) {
        console.log("Error fetching history:", err);
      }

    };

    fetchHistory();

    const interval = setInterval(fetchHistory, 10000);

    return () => clearInterval(interval);

  }, []);

  const chartData = {
    labels: history.map((e) =>
      new Date(e.createdAt).toLocaleTimeString()
    ),
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
        {history.length > 0 ? (
          <Line data={chartData} />
        ) : (
          <p>Loading graph...</p>
        )}
      </div>

    </div>
  );
}

export default GraphPage;