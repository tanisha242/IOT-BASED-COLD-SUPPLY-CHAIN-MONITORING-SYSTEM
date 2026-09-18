import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./AIAssistant.css";

// =====================================================
// SVG ICONS
// =====================================================

const NivraOrb = ({ small = false }) => (
  <span className={`nivra-orb ${small ? "nivra-orb-small" : ""}`}>
    <span className="nivra-orb-core"></span>
    <span className="nivra-orb-shine"></span>
  </span>
);

const MicIcon = () => (
  <svg
    className="nivra-mic-svg"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="17"
      y="5"
      width="14"
      height="25"
      rx="7"
      stroke="currentColor"
      strokeWidth="2.8"
    />

    <path
      d="M11 23C11 31.2843 17.7157 38 26 38C34.2843 38 41 31.2843 41 23"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />

    <path
      d="M26 38V44"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />

    <path
      d="M20 44H32"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
);

const ThermometerIcon = () => (
  <svg viewBox="0 0 24 24" className="nivra-action-icon">
    <path
      d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M12 17v-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="nivra-action-icon">
    <path
      d="M10.3 4.6 2.8 17.2A1.8 1.8 0 0 0 4.35 20h15.3a1.8 1.8 0 0 0 1.55-2.8L13.7 4.6a2 2 0 0 0-3.4 0Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 9v4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
  </svg>
);

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" className="nivra-action-icon">
    <path
      d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="m4.5 7.5 7.5 4 7.5-4M12 11.5V21"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const MaintenanceIcon = () => (
  <svg viewBox="0 0 24 24" className="nivra-action-icon">
    <path
      d="M14.7 6.1a4.1 4.1 0 0 0-5.2 5.2L4.1 16.7a2.1 2.1 0 1 0 3 3l5.4-5.4a4.1 4.1 0 0 0 5.2-5.2l-2.8 2.8-2.8-2.8 2.6-3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" className="nivra-send-icon">
    <path
      d="M21 3 10 14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="m21 3-7 18-4-7-7-4 18-7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" className="nivra-globe-icon">
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21M12 3c-2.5 2.5-3.5 5.5-3.5 9S9.5 18.5 12 21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AIAssistant() {
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  const userRole = localStorage.getItem("userRole");

  // Don't show assistant on authentication pages
  if (
    !userRole ||
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup"
  ) {
    return null;
  }

  // =====================================================
  // SPEECH RECOGNITION
  // =====================================================

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (listening) {
      return;
    }

    const recognition = new SpeechRecognition();

    if (language === "hi-IN") {
      recognition.lang = "hi-IN";
    } else {
      recognition.lang = "en-IN";
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let text = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        text += event.results[i][0].transcript;
      }

      setTranscript(text.trim());
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);

      if (event.error === "not-allowed") {
        alert(
          "Microphone permission was denied. Please allow microphone access and try again."
        );
      }

      if (event.error === "audio-capture") {
        alert(
          "No microphone was detected. Please check your microphone."
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start speech recognition:",
        error
      );

      setListening(false);
      recognitionRef.current = null;
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setListening(false);
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // =====================================================
  // PANEL CONTROLS
  // =====================================================

  const handleClose = () => {
    if (listening) {
      stopListening();
    }

    setOpen(false);
  };

  const handleQuickAction = (text) => {
    setTranscript(text);
    setAnswer("");
  };

  const clearTranscript = () => {
    setTranscript("");
    setAnswer("");
  };

  const handleLanguageChange = (event) => {
    if (listening) {
      stopListening();
    }

    setLanguage(event.target.value);
    setTranscript("");
    setAnswer("");
  };

  // =====================================================
  // SEND TO GEMINI
  // =====================================================

  const sendMessage = async () => {
    if (!transcript.trim() || loading) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");

      const response = await fetch(
        "http://localhost:5000/api/assistant/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: transcript.trim(),
            role: userRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get AI response"
        );
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error("Assistant error:", error);

      setAnswer(
        "Sorry, I could not connect to Nivra right now."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* =================================================
          FLOATING Nivra BUTTON
      ================================================= */}

      {!open && (
        <button
          className="ai-copilot-floating-button"
          onClick={() => setOpen(true)}
          type="button"
          aria-label="Open Nivra"
        >
          <span className="ai-copilot-floating-orb">
            <NivraOrb small />
          </span>

          <span className="ai-copilot-floating-content">
            <span className="ai-copilot-floating-name">
              Nivra
            </span>

            <span className="ai-copilot-floating-status">
              AI Copilot
            </span>
          </span>
        </button>
      )}

      {/* =================================================
          OVERLAY
      ================================================= */}

      {open && (
        <div
          className="ai-copilot-overlay"
          onClick={handleClose}
        />
      )}

      {/* =================================================
          MAIN PANEL
      ================================================= */}

      {open && (
        <section className="ai-copilot-panel">

          {/* Ambient glow */}
          <div className="ai-copilot-panel-glow"></div>
          <div className="ai-copilot-wave"></div>

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="ai-copilot-header">

            <div className="ai-copilot-header-left">

              <div className="ai-copilot-logo">
                <NivraOrb />
              </div>

              <div className="ai-copilot-header-info">

                <div className="ai-copilot-title">
                  Nivra
                </div>

                <div className="ai-copilot-subtitle">
                  Cold Chain Intelligence
                </div>

                <div className="ai-copilot-status">
                  <span className="ai-copilot-status-dot"></span>
                  <span>
                    Online
                  </span>
                  <span className="ai-copilot-status-divider">
                    |
                  </span>
                  <span>
                    Ready to assist
                  </span>
                </div>

              </div>

            </div>

            <button
              className="ai-copilot-close"
              onClick={handleClose}
              type="button"
              aria-label="Close Nivra"
            >
              <span></span>
              <span></span>
            </button>

          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="ai-copilot-content">

            {/* =================================================
                WELCOME
            ================================================= */}

            <div className="ai-copilot-welcome">

              <div className="ai-copilot-welcome-orb">
                <NivraOrb small />
              </div>

              <div className="ai-copilot-welcome-text">

                <h3>
                  Hi, I'm Nivra
                </h3>

                <p>
                  Your AI assistant for cold-chain
                  operations. Ask about sensors,
                  boxes, alerts, inventory or
                  maintenance.
                </p>

              </div>

            </div>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <div className="ai-copilot-section">

              <div className="ai-copilot-section-title">
                Quick actions
              </div>

              <div className="ai-copilot-quick-actions">

                <button
                  className="ai-copilot-chip"
                  onClick={() =>
                    handleQuickAction(
                      "What is the current temperature?"
                    )
                  }
                  type="button"
                >
                  <ThermometerIcon />
                  <span>Current temperature</span>
                </button>

                <button
                  className="ai-copilot-chip"
                  onClick={() =>
                    handleQuickAction(
                      "Are there any active alerts?"
                    )
                  }
                  type="button"
                >
                  <AlertIcon />
                  <span>Active alerts</span>
                </button>

                <button
                  className="ai-copilot-chip"
                  onClick={() =>
                    handleQuickAction(
                      "Check the status of a box"
                    )
                  }
                  type="button"
                >
                  <BoxIcon />
                  <span>Check a box</span>
                </button>

                <button
                  className="ai-copilot-chip"
                  onClick={() =>
                    handleQuickAction(
                      "Show me the maintenance information"
                    )
                  }
                  type="button"
                >
                  <MaintenanceIcon />
                  <span>Maintenance</span>
                </button>

              </div>

            </div>

            {/* =================================================
                VOICE AREA
            ================================================= */}

            <div
              className={`ai-copilot-voice-section ${
                listening
                  ? "ai-copilot-voice-listening"
                  : ""
              }`}
            >

              <div className="ai-copilot-voice-orbit">

                <span className="ai-copilot-orbit orbit-one"></span>
                <span className="ai-copilot-orbit orbit-two"></span>
                <span className="ai-copilot-orbit orbit-three"></span>

                <button
                  className={`ai-copilot-mic-button ${
                    listening
                      ? "ai-copilot-mic-listening"
                      : ""
                  }`}
                  onClick={handleMicClick}
                  type="button"
                  aria-label={
                    listening
                      ? "Stop listening"
                      : "Start voice input"
                  }
                >

                  <span className="ai-copilot-mic-glow"></span>

                  <span className="ai-copilot-mic-icon-wrapper">
                    <MicIcon />
                  </span>

                  {listening && (
                    <span className="ai-copilot-listening-wave">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                  )}

                </button>

              </div>

              <div className="ai-copilot-voice-title">
                {listening
                  ? "Listening..."
                  : "Tap to speak"}
              </div>

              <div className="ai-copilot-voice-subtitle">
                {listening
                  ? "Speak naturally"
                  : "English · हिन्दी · Hinglish"}
              </div>

            </div>

            {/* =================================================
                TRANSCRIPT
            ================================================= */}

            <div className="ai-copilot-transcript-box">

              <div className="ai-copilot-transcript-header">

                <div className="ai-copilot-transcript-label">
                  <span className="ai-copilot-transcript-live-dot"></span>
                  Voice input
                </div>

                {transcript && (
                  <button
                    className="ai-copilot-clear"
                    onClick={clearTranscript}
                    type="button"
                  >
                    Clear
                  </button>
                )}

              </div>

              <div
                className={`ai-copilot-transcript ${
                  transcript
                    ? "ai-copilot-transcript-active"
                    : ""
                }`}
              >

                <span className="ai-copilot-transcript-orb">
                  <NivraOrb small />
                </span>

                <span className="ai-copilot-transcript-text">
                  {transcript ||
                    "Tell me what you need..."}
                </span>

              </div>

            </div>

            {/* =================================================
                SEND
            ================================================= */}

            {transcript && (
              <button
                className="ai-copilot-send-button"
                onClick={sendMessage}
                disabled={loading}
                type="button"
              >

                {loading ? (
                  <>
                    <span className="ai-copilot-spinner"></span>
                    Nivra is thinking
                  </>
                ) : (
                  <>
                    Ask Nivra
                    <SendIcon />
                  </>
                )}

              </button>
            )}

            {/* =================================================
                AI RESPONSE
            ================================================= */}

            {answer && (
              <div className="ai-copilot-answer-box">

                <div className="ai-copilot-answer-header">

                  <div className="ai-copilot-answer-orb">
                    <NivraOrb small />
                  </div>

                  <div>

                    <div className="ai-copilot-answer-title">
                      Nivra
                    </div>

                    <div className="ai-copilot-answer-subtitle">
                      Cold Chain Intelligence
                    </div>

                  </div>

                  <div className="ai-copilot-answer-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

                <div className="ai-copilot-answer-text">
                  {answer}
                </div>

              </div>
            )}

            {/* =================================================
                LANGUAGE
            ================================================= */}

            <div className="ai-copilot-language-section">

              <div className="ai-copilot-language-wrapper">

                <div className="ai-copilot-language-label">
                  Voice language
                </div>

                <div className="ai-copilot-language-control">

                  <GlobeIcon />

                  <select
                    id="ai-copilot-language"
                    className="ai-copilot-language-select"
                    value={language}
                    onChange={handleLanguageChange}
                  >
                    <option value="en-IN">
                      English (India)
                    </option>

                    <option value="hi-IN">
                      हिन्दी
                    </option>

                    <option value="hinglish">
                      Hinglish
                    </option>
                  </select>

                </div>

              </div>

              <div className="ai-copilot-language-info">
                {language === "hinglish"
                  ? "Hinglish uses Indian English speech recognition."
                  : `Speaking in ${
                      language === "hi-IN"
                        ? "Hindi"
                        : "English"
                    }.`}
              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="ai-copilot-footer">

            <span className="ai-copilot-footer-item">
              <span className="ai-copilot-footer-wave">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
              Voice-first intelligence
            </span>

            <span className="ai-copilot-footer-divider"></span>

            <span className="ai-copilot-footer-item">
              <span className="ai-copilot-footer-orb">
                <NivraOrb small />
              </span>
            </span>

          </div>

        </section>
      )}
    </>
  );
}