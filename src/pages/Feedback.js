import React, { useState } from "react";
import "../styles/adminDashboard.css";

export default function Feedback() {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    const oldFeedback =
      JSON.parse(localStorage.getItem("feedbackList")) || [];
    oldFeedback.push(text);
    localStorage.setItem("feedbackList", JSON.stringify(oldFeedback));

    setMessage("✅ Thank you! Your feedback was submitted.");
    setText("");
  };

  return (
    <div className="feedback-container">
      <h2 className="feedback-title">📝 Share Your Feedback</h2>

      <div className="feedback-card">
        <form onSubmit={handleSubmit}>
          <label className="feedback-label">
            Tell us how we can improve the ColdChain Monitor system
          </label>

          <textarea
            className="feedback-textarea"
            placeholder="Example: The temperature dashboard is useful but a map view would help..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button className="feedback-btn" type="submit">
            Submit Feedback
          </button>
        </form>

        {message && <p className="feedback-success">{message}</p>}
      </div>
    </div>
  );
}