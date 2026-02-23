import React from "react";

export default function ConsentModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="consent-overlay">
      <div className="consent-card">
        <h2>Consent for Motion Tracking</h2>
        <p>
          FitFlex uses your device camera to detect body pose for rep counting. No raw video is stored by default.
          We do not perform face recognition or biometric identification. Session summaries are anonymized and stored
          locally or uploaded only with your consent.
        </p>
        <ul>
          <li>No raw video stored by default</li>
          <li>No face recognition or biometric ID</li>
          <li>Consent required for motion tracking and analytics</li>
        </ul>
        <div className="consent-actions">
          <button className="btn" onClick={() => { localStorage.setItem("fitflex_consent", "false"); window.location.reload(); }}>Decline</button>
          <button className="btn primary" onClick={onAccept}>I Consent</button>
        </div>
      </div>
    </div>
  );
}
