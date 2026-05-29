import { useEffect, useState } from "react";

export default function AccuracyBadge({ accuracyScore, pageCount, processingTimeMs }) {
  const [displayed, setDisplayed] = useState(0);

  // Animate the number counting up
  useEffect(() => {
    const target = Math.round(accuracyScore);
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplayed(target);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(start));
      }
    }, 25);
    return () => clearInterval(timer);
  }, [accuracyScore]);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracyScore / 100) * circumference;
  const timeLabel = processingTimeMs >= 1000
    ? `${(processingTimeMs / 1000).toFixed(1)}s`
    : `${processingTimeMs}ms`;

  return (
    <div className="badge-row">
      {/* Circular accuracy gauge */}
      <div className="accuracy-circle-wrap">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="7" />
          <circle
            cx="55" cy="55" r={radius}
            fill="none"
            stroke="url(#accGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
          />
          <defs>
            <linearGradient id="accGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        <div className="circle-inner">
          <span className="acc-pct">{displayed}%</span>
          <span className="acc-label">Accuracy</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{pageCount}</span>
          <span className="stat-name">Pages Processed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value time">{timeLabel}</span>
          <span className="stat-name">Processing Time</span>
        </div>
        <div className="stat-card">
          <span className="stat-value green">BERT</span>
          <span className="stat-name">NER Model</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">OCR+NLP</span>
          <span className="stat-name">Pipeline</span>
        </div>
      </div>

      <style>{`
        .badge-row {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 24px 28px;
          background: linear-gradient(135deg, rgba(14,165,233,0.06), rgba(52,211,153,0.04));
          border: 1px solid rgba(56,189,248,0.15);
          border-radius: 16px;
          flex-wrap: wrap;
        }

        .accuracy-circle-wrap {
          position: relative;
          width: 110px;
          height: 110px;
          flex-shrink: 0;
        }
        .accuracy-circle-wrap svg { position: absolute; top: 0; left: 0; }
        .circle-inner {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .acc-pct {
          display: block;
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(135deg, #38bdf8, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }
        .acc-label {
          display: block;
          font-size: 0.62rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          flex: 1;
        }
        .stat-card {
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 12px 16px;
        }
        .stat-value {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #e2e8f0;
          font-family: 'Space Mono', monospace;
        }
        .stat-value.time { color: #f59e0b; }
        .stat-value.green { color: #34d399; }
        .stat-name {
          display: block;
          font-size: 0.72rem;
          color: #475569;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
