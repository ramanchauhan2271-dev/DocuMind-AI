import AccuracyBadge from "./AccuracyBadge";
import EntityCard from "./EntityCard";

const ENTITY_ORDER = ["PERSON", "ORG", "LOC", "DATE", "MISC"];

function addLineNumbers(text) {
  return text
    .split("\n")
    .map((line, i) => ({ num: i + 1, text: line }));
}

export default function ResultsPanel({ result, onReset }) {
  const lines = addLineNumbers(result.raw_text || "");
  const totalEntities = Object.values(result.entities || {}).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  const handleCopyJSON = () => {
    const json = JSON.stringify(result.entities, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert("JSON copied to clipboard!");
    });
  };

  const handleDownload = () => {
    const now = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const content = [
      "=".repeat(60),
      "  DocuMind AI — Extraction Report",
      `  Generated: ${new Date().toLocaleString()}`,
      "=".repeat(60),
      "",
      "RAW OCR TEXT",
      "-".repeat(60),
      result.raw_text,
      "",
      "STRUCTURED ENTITIES (JSON)",
      "-".repeat(60),
      JSON.stringify(result.entities, null, 2),
      "",
      "METRICS",
      "-".repeat(60),
      `Accuracy Score: ${result.accuracy_score}%`,
      `Pages Processed: ${result.page_count}`,
      `Processing Time: ${result.processing_time_ms}ms`,
      `Total Entities Found: ${totalEntities}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documind-report-${now}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-root">
      {/* Top bar */}
      <div className="results-topbar">
        <div className="results-title-group">
          <span className="results-title">Extraction Complete</span>
          <span className="entity-count">{totalEntities} entities found</span>
        </div>
        <div className="results-actions">
          <button className="action-btn secondary" onClick={handleCopyJSON}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="2" y="4" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 4V2.5A1.5 1.5 0 016.5 1h6A1.5 1.5 0 0114 2.5v8A1.5 1.5 0 0112.5 12H11" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            Copy JSON
          </button>
          <button className="action-btn secondary" onClick={handleDownload}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1v9M4 7l3.5 3.5L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M1 13h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Download
          </button>
          <button className="action-btn primary" onClick={onReset}>
            New Document
          </button>
        </div>
      </div>

      {/* Accuracy badge */}
      <AccuracyBadge
        accuracyScore={result.accuracy_score}
        pageCount={result.page_count}
        processingTimeMs={result.processing_time_ms}
      />

      {/* Two-column layout */}
      <div className="two-col">
        {/* LEFT — Raw OCR text */}
        <div className="col-panel">
          <div className="col-header">
            <span className="col-title">Raw OCR Text</span>
            <span className="col-badge">{lines.length} lines</span>
          </div>
          <div className="ocr-scroll">
            <pre className="ocr-pre">
              {lines.map(({ num, text }) => (
                <div key={num} className="ocr-line">
                  <span className="line-num">{num}</span>
                  <span className="line-text">{text || " "}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* RIGHT — Entity cards */}
        <div className="col-panel">
          <div className="col-header">
            <span className="col-title">Structured Entities</span>
            <span className="col-badge">BERT NER</span>
          </div>
          <div className="entities-grid">
            {ENTITY_ORDER.map((label) => (
              <EntityCard
                key={label}
                label={label}
                entities={result.entities?.[label] || []}
              />
            ))}
            {totalEntities === 0 && (
              <div className="no-entities">
                <p>No entities detected. The document may contain no recognizable named entities, or the OCR output was too sparse.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .results-root { display: flex; flex-direction: column; gap: 24px; width: 100%; }

        .results-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .results-title-group { display: flex; align-items: center; gap: 12px; }
        .results-title { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }
        .entity-count {
          font-size: 0.78rem;
          color: #38bdf8;
          background: rgba(56,189,248,0.1);
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 100px;
          padding: 3px 10px;
        }

        .results-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .action-btn.secondary {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
          color: #94a3b8;
        }
        .action-btn.secondary:hover { background: rgba(255,255,255,0.09); color: #e2e8f0; }
        .action-btn.primary {
          background: linear-gradient(135deg, #0ea5e9, #38bdf8);
          color: #0f172a;
          font-weight: 700;
        }
        .action-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(56,189,248,0.3);
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          min-height: 0;
        }
        @media (max-width: 900px) {
          .two-col { grid-template-columns: 1fr; }
        }

        .col-panel {
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        .col-title { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
        .col-badge {
          font-size: 0.72rem;
          color: #64748b;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 2px 8px;
          font-family: 'Space Mono', monospace;
        }

        .ocr-scroll {
          flex: 1;
          overflow-y: auto;
          max-height: 520px;
          scrollbar-width: thin;
          scrollbar-color: rgba(56,189,248,0.2) transparent;
        }
        .ocr-pre {
          margin: 0;
          padding: 16px 0;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          line-height: 1.7;
          color: #94a3b8;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ocr-line {
          display: flex;
          padding: 0 16px;
        }
        .ocr-line:hover { background: rgba(56,189,248,0.03); }
        .line-num {
          min-width: 40px;
          color: #334155;
          text-align: right;
          padding-right: 16px;
          user-select: none;
          flex-shrink: 0;
        }
        .line-text { color: #94a3b8; }

        .entities-grid {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: 520px;
          scrollbar-width: thin;
          scrollbar-color: rgba(56,189,248,0.2) transparent;
        }

        .no-entities {
          padding: 40px 20px;
          text-align: center;
          color: #475569;
          font-size: 0.85rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
