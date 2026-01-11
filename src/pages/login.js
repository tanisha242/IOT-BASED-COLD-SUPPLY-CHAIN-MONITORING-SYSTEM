import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/login.css";

export default function Login() {
  const [department, setDepartment] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Corrected credentials setup
 const credentials = {
  qc: { userId: "qc1", password: "1234" },

  warehouse: { userId: "warehouse_mgr", password: "12345" },

  admin: {
    admin1: { password: "admin123" },
    admin2: { password: "admin1234" },
    admin3: { password: "admin12345" },
  }
};

const handleLogin = () => {
  if (!department) {
    setError("Please select a role.");
    return;
  }

  if (department === "admin") {
    // Admin logic
    if (
      credentials.admin[userId] &&
      credentials.admin[userId].password === password
    ) {
      alert(`Login successful as ${userId.toUpperCase()}`);
      setError("");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userId", userId);

      // Redirect based on admin ID
      navigate(`/admin-dashboard${userId.slice(-1)}`);
    } else {
      setError("Invalid admin credentials.");
    }
  } else {
    // QC and warehouse logic
    if (
      credentials[department].userId === userId &&
      credentials[department].password === password
    ) {
      alert(`Login successful as ${department.toUpperCase()}`);
      setError("");

      localStorage.setItem("userRole", department);
      localStorage.setItem("userId", userId);

      navigate("/dashboard"); // landing for QC and warehouse
    } else {
      setError("Invalid credentials.");
    }
  }
};


  return (
    <div className="login-container">
      {/* LEFT SECTION (FORM) */}
      <div className="login-form-section">
        <div className="logo">COLDCHAIN MONITOR</div>
        <div className="login-title">Login & Select Role</div>

        <div className="input-group">
          <label>Select User Type</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">-- Choose Role --</option>
            <option value="qc">Quality Control</option>
            <option value="warehouse">Warehouse</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="login-btn" onClick={handleLogin}>Login</button>

        {error && <p className="error-text">{error}</p>}
      </div>

      {/* RIGHT SECTION (BANNER) */}
      <div className="login-banner">
        <div className="banner-text">
          <h2>
            Smart <span className="highlight">Cold Chain</span> Monitoring
          </h2>
          <p>
            Real-time monitoring of temperature-sensitive medicines for safe storage,
            seamless transportation, and regulatory compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
