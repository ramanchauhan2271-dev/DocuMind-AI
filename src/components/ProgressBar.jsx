import { useEffect, useRef, useState } from "react";
import { getResult } from "../api";

const STATUS_MESSAGES = [
  "Uploading document...",
  "Running OCR analysis...",
  "Analyzing with BERT NER...",
  "Structuring entities...",
  "Finalizing results...",
];

const POLL_INTERVAL_MS = 1500;

export default function ProgressBar({ jobId, onComplete }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const intervalRef = useRef(null);
  const pollRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Animate progress bar smoothly (never quite reaches 100 until done)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.06;
      });
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Poll backend for result
  useEffect(() => {
    if (!jobId) return;

    pollRef.current = setInterval(async () => {
      try {
        const result = await getResult(jobId);
        if (result.status === "done" || result.status === "error") {
          clearInterval(pollRef.current);
          clearInterval(intervalRef.current);
          setProgress(100);
          setTimeout(() => onComplete(result), 400);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [jobId, onComplete]);

  const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-label">Processing Document</span>
        <span className="progress-time">{elapsed}s</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }}>
          <div className="progress-shimmer" />
        </div>
      </div>

      <div className="progress-status">
        <span className="pulse-dot" />
        <span className="status-text">{STATUS_MESSAGES[messageIndex]}</span>
        <span className="progress-pct">{Math.floor(progress)}%</span>
      </div>

      <div className="progress-steps">
        {["PDF Parse", "OCR", "BERT NER", "Structure"].map((step, i) => {
          const stepProgress = (i + 1) / 4;
          const isActive = progress / 100 >= stepProgress - 0.25;
          const isDone = progress / 100 >= stepProgress;
          return (
            <div key={step} className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <div className="step-dot">
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                ) : null}
              </div>
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .progress-container {
          width: 100%;
          padding: 32px 40px;
          background: rgba(30,41,59,0.6);
          border: 1px solid rgba(56,189,248,0.15);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .progress-label { color: #cbd5e1; font-weight: 600; font-size: 0.95rem; }
        .progress-time { color: #64748b; font-size: 0.82rem; font-family: 'Space Mono', monospace; }

        .progress-track {
          height: 8px;
          background: rgba(15,23,42,0.8);
          border-radius: 100px;
          overflow: hidden;
          border: 1px solid rgba(56,189,248,0.1);
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0284c7, #38bdf8, #7dd3fc);
          border-radius: 100px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .progress-shimmer {
          position: absolute;
          top: 0; bottom: 0;
          width: 60%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { left: -60%; }
          100% { left: 140%; }
        }

        .progress-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #38bdf8;
          flex-shrink: 0;
          animation: pulse 1.2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .status-text { color: #94a3b8; font-size: 0.85rem; flex: 1; }
        .progress-pct { color: #38bdf8; font-size: 0.82rem; font-family: 'Space Mono', monospace; font-weight: 600; }

        .progress-steps {
          display: flex;
          gap: 24px;
          padding-top: 8px;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: #475569;
          transition: color 0.3s;
        }
        .step-item.active { color: #94a3b8; }
        .step-item.done { color: #38bdf8; }
        .step-dot {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-item.done .step-dot { background: rgba(56,189,248,0.15); }
      `}</style>
    </div>
  );
}
