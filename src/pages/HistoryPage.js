import "../styles/history.css";
export default function HistoryPage() {
  // ---------------- SAMPLE DATA ----------------
  const timeline = [
    {
      time: "2025-11-18 09:20",
      deviceId: "BOX-LKO-01",
      location: "Kanpur Checkpoint",
      passed: 2,
      total: 6,
      alert: true,
    },
    {
      time: "2025-11-18 09:15",
      deviceId: "BOX-MUM-03",
      location: "Mumbai Hub",
      passed: 1,
      total: 5,
      alert: false,
    },
    {
      time: "2025-11-18 09:10",
      deviceId: "BOX-DEL-02",
      location: "Gurgaon Checkpoint",
      passed: 2,
      total: 7,
      alert: true,
    },
  ];

  const alertHistory = [
    {
      time: "2025-11-18 09:20",
      box: "BOX-LKO-01",
      location: "Kanpur Checkpoint",
      temp: "11.5",
      action: "Ice pack replaced",
      resolved: true,
    },
    {
      time: "2025-11-18 09:15",
      box: "BOX-MUM-03",
      location: "Mumbai Hub",
      temp: "8.2",
      action: "N/A",
      resolved: true,
    },
    {
      time: "2025-11-18 09:10",
      box: "BOX-DEL-02",
      location: "Gurgaon Checkpoint",
      temp: "13",
      action: "Pending",
      resolved: false,
    },
  ];

  const detailedLogs = timeline.map((item) => ({
    ...item,
    humidity: Math.floor(Math.random() * 10 + 45),
    eta: item.total - item.passed === 0 ? "Arrived" : `${item.total - item.passed} hrs`,
  }));

  return (
    <div className="history-page">
      <h1 className="page-title">📦 Cold Chain Transport History</h1>

      {/* ------------ Transport Route Timeline ------------ */}
      <div className="section-block">
        <h3 className="section-title"><span>🚚</span> Transport Route Timeline</h3>
        {timeline.map((entry, idx) => (
          <div
            key={idx}
            className={`timeline-entry ${entry.alert ? "timeline-alert" : "timeline-ok"}`}
          >
            <div className="timeline-row">
              <strong className="time">{entry.time}</strong>
              <span className="box">{entry.deviceId}</span> reached
              <b className="location"> {entry.location} </b>
            </div>
            <div className="timeline-row">
              <span className="checkpoints">{entry.passed} / {entry.total} checkpoints</span>
              <span className={entry.alert ? "status-alert" : "status-ok"}>
                {entry.alert ? "⚠ Alert" : "✔ OK"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ------------ Alert History ------------ */}
      <div className="section-block">
        <h3 className="section-title"><span>📢</span> Alert History</h3>
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Box</th>
                <th>Location</th>
                <th>Temp (°C)</th>
                <th>Action Taken</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {alertHistory.map((row, i) => (
                <tr key={i} className={row.resolved ? "" : "unresolved"}>
                  <td>{row.time}</td>
                  <td>{row.box}</td>
                  <td>{row.location}</td>
                  <td>{row.temp}</td>
                  <td>{row.action}</td>
                  <td>{row.resolved ? "✔ Yes" : "❌ No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------ Detailed Checkpoint Logs ------------ */}
      <div className="section-block">
        <h3 className="section-title"><span>📍</span> Detailed Checkpoint Logs</h3>
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Box</th>
                <th>Location</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Checkpoint</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {detailedLogs.map((row, i) => (
                <tr key={i}>
                  <td>{row.time}</td>
                  <td>{row.deviceId}</td>
                  <td>{row.location}</td>
                  <td>{Math.floor(Math.random() * 5 + 10)}</td>
                  <td>{row.humidity}</td>
                  <td>{row.passed} / {row.total}</td>
                  <td>{row.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
