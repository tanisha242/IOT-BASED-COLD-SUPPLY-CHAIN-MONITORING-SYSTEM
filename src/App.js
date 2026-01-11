import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/SideBar";

import Dashboard from "./pages/dashboard";
import BoxDetails from "./pages/BoxDetails";
import Login from "./pages/login";
import Signup from "./pages/signup";

import "./styles/style.css";
import "./components/Sidebar.css";
import "./App.css";
import TemperatureHeatmap from "./pages/TemperatureHeatmap";
import  HistoryPage from "./pages/HistoryPage";
import AdminDashboard1 from "./pages/AdminDashboard1";
import AdminDashboard2 from "./pages/AdminDashboard2";
import AdminDashboard3 from "./pages/AdminDashboard3";


function Layout() {
  const location = useLocation();

  // Hide UI on login and signup pages
  const hideUI = location.pathname === "/" || location.pathname === "/signup";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <>
      {/* Hide Navbar on login/signup */}
      {!hideUI && <Navbar onMenuClick={toggleSidebar} />}

      {/* Hide Sidebar on login/signup */}
      {!hideUI && (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

      <div className="page-content">
        <Routes>
          <Route path="/temperature" element={<TemperatureHeatmap />} />  
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/box/:deviceId" element={<BoxDetails />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin-dashboard1" element={<AdminDashboard1 />} />
          <Route path="/admin-dashboard2" element={<AdminDashboard2 />} />
          <Route path="/admin-dashboard3" element={<AdminDashboard3 />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
