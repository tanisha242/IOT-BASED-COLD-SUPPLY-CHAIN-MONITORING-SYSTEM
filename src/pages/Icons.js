// src/components/Icons.js
import React from "react";

export function TruckIcon({ style }) {
  return (
    <svg viewBox="0 0 64 32" width="160" height="48" style={style} xmlns="http://www.w3.org/2000/svg">
      <g fill="#e6e9ef"><rect x="1" y="8" width="38" height="14" rx="2"/></g>
      <g fill="#dfe6ef"><rect x="39" y="12" width="20" height="10" rx="2"/></g>
      <g fill="#c7cbd1"><circle cx="16" cy="24" r="3.6"/><circle cx="46" cy="24" r="3.6"/></g>
    </svg>
  );
}

export function BoxIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={style} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7.5L12 3l9 4.5v7L12 21 3 14.5v-7z" fill="#f8fafc" stroke="#e6e9ef"/>
      <path d="M12 3v9" stroke="#e6e9ef" strokeWidth="0.8" fill="none"/>
    </svg>
  );
}
