import { useEffect, useRef, useState } from "react";

const LABEL_CONFIG = {
  PERSON: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  ORG: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 5V3a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  LOC: {
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.25)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="7" cy="5" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  DATE: {
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 6h12" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 1v3M10 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  MISC: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.2)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 5v4M7 4v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="conf-label" style={{ color }}>{pct}%</span>
      <style>{`
        .conf-bar-wrap { display: flex; align-items: center; gap: 6px; }
        .conf-bar-track { height: 4px; flex: 1; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; }
        .conf-bar-fill { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
        .conf-label { font-size: 0.72rem; font-family: 'Space Mono', monospace; min-width: 32px; text-align: right; }
      `}</style>
    </div>
  );
}

export default function EntityCard({ label, entities }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.MISC;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!entities || entities.length === 0) return null;

  return (
    <div
      ref={ref}
      className={`entity-card ${visible ? "visible" : ""}`}
      style={{
        "--card-color": cfg.color,
        "--card-bg": cfg.bg,
        "--card-border": cfg.border,
      }}
    >
      <div className="card-header">
        <div className="card-label-group">
          <span className="card-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
          <span className="card-label" style={{ color: cfg.color }}>{label}</span>
        </div>
        <span className="card-count">{entities.length}</span>
      </div>

      <div className="card-entities">
        {entities.map((ent, i) => (
          <div key={i} className="entity-item">
            <span className="entity-word">{ent.word}</span>
            <ConfidenceBar score={ent.score} />
          </div>
        ))}
      </div>

      <style>{`
        .entity-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 18px 20px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .entity-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .card-label-group { display: flex; align-items: center; gap: 7px; }
        .card-icon { display: flex; align-items: center; }
        .card-label {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .card-count {
          background: rgba(255,255,255,0.06);
          color: #64748b;
          font-size: 0.72rem;
          font-family: 'Space Mono', monospace;
          padding: 2px 8px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .card-entities { display: flex; flex-direction: column; gap: 10px; }
        .entity-item { display: flex; flex-direction: column; gap: 4px; }
        .entity-word {
          color: #e2e8f0;
          font-size: 0.85rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
