import React from "react";
import "../styles/adminDashboard.css";

export default function QCFeedback() {

  const feedbackList = JSON.parse(localStorage.getItem("feedbackList")) || [];

  return (
    <div className="feedback-container">

      <h2 className="feedback-title">📋 User Feedback</h2>

      <div className="feedback-card">

        {feedbackList.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          feedbackList.map((item, index) => (
            <div key={index} className="feedback-item">
              <p>{item}</p>
            </div>
          ))
        )}

      </div>

    </div>
  );
}