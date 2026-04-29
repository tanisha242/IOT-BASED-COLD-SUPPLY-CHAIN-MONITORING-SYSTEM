import React from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole"); // Get user role
  const userId = localStorage.getItem("userId");     // Get user ID (like admin1)

  const close = () => setOpen(false);

  const goto = (path) => {
    navigate(path);
    close();
  };

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={`sidebar-panel ${open ? "open" : ""} ${
          userRole === "admin" ? "admin-sidebar" : ""
        }`}
      >
        {/* Hide 'Menu' for admin */}
        {userRole !== "admin" && <h3 className="sidebar-title">Menu</h3>}

        <ul className="sidebar-menu">
          {userRole === "admin" ? (
            <>
              {/* Open respective admin dashboard */}
              <li onClick={() => goto(`/admin-dashboard${userId.slice(-1)}`)}>
                📦 Admin Dashboard
              </li>
              <li onClick={() => goto("/inventory")}>
                💊 Medical Inventory
              </li>
              <li onClick={() => goto("/feedback")}>
                📝 Feedback
              </li>
              <li onClick={() => goto("/")}>🚪 Logout</li>
            </>
          ) : (
            <>
              <li onClick={() => goto("/dashboard")}>📊 Dashboard</li>
              <li onClick={() => goto("/temperature")}>🌡 Temperature</li>
              <li onClick={() => goto("/history")}>📜 History</li>
              <li onClick={() => goto("/qc-feedback")}>
                💬 User Feedback
              </li>
              <li onClick={() => goto("/")}>🚪 Logout</li>
            </>
          )}
        </ul>
      </aside>

      {/* Overlay */}
      {open && <div className="overlay" onClick={close}></div>}
    </>
  );
}
