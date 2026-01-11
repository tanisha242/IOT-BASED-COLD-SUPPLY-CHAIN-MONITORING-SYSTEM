import React from "react";
import "./Navbar.css";

export default function Navbar({ onMenuClick }) {
  return (
    <nav className="navbar">
      <button className="menu-btn" onClick={onMenuClick}>
        ☰
      </button>

      <div className="navbar-title">ColdChain Monitor</div>
    </nav>
  );
}
