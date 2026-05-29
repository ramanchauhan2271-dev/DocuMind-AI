import { useState } from "react";
import { uploadDocument } from "./api";
import FileUploader from "./components/FileUploader";
import ProgressBar from "./components/ProgressBar";
import ResultsPanel from "./components/ResultsPanel";

// State machine: idle → uploading → processing → results | error
const STATES = {
  IDLE: "idle",
  UPLOADING: "uploading",
  PROCESSING: "processing",
  RESULTS: "results",
  ERROR: "error",
};

export default function App() {
  const [phase, setPhase] = useState(STATES.IDLE);
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = async (file) => {
    setPhase(STATES.UPLOADING);
    setErrorMsg("");
    try {
      const { job_id } = await uploadDocument(file);
      setJobId(job_id);
      setPhase(STATES.PROCESSING);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err.message || "Upload failed.");
      setPhase(STATES.ERROR);
    }
  };

  const handleComplete = (extractionResult) => {
    if (extractionResult.status === "error") {
      setErrorMsg(extractionResult.error_message || "Extraction failed.");
      setPhase(STATES.ERROR);
    } else {
      setResult(extractionResult);
      setPhase(STATES.RESULTS);
    }
  };

  const handleReset = () => {
    setPhase(STATES.IDLE);
    setJobId(null);
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="app-root">
      {/* Ambient background effects */}
      <div className="bg-glow glow-1" />
      <div className="bg-glow glow-2" />
      <div className="bg-grid" />

      <div className="app-inner">
        {/* Header */}
        <header className="app-header">
          <div className="logo-mark">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="rgba(56,189,248,0.12)" />
              <rect x="9" y="7" width="14" height="18" rx="2" stroke="#38bdf8" strokeWidth="1.8" fill="none"/>
              <rect x="13" y="7" width="14" height="18" rx="2" stroke="#38bdf8" strokeWidth="1.8" fill="rgba(56,189,248,0.06)"/>
              <path d="M16 16h8M16 19h6M16 13h8" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
              <circle cx="27" cy="27" r="5" fill="#0f172a" stroke="#34d399" strokeWidth="1.5"/>
              <path d="M25 27l1.5 1.5 2.5-2.5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="header-text">
            <h1 className="app-title">DocuMind AI</h1>
            <p className="app-sub">Intelligent Document Extraction System</p>
          </div>
          <div className="header-badge">
            <span className="badge-dot" />
            <span>BERT NER · Tesseract OCR</span>
          </div>
        </header>

        {/* Main content */}
        <main className="app-main">
          {phase === STATES.IDLE && (
            <div className="idle-layout">
              <div className="upload-card">
                <div className="upload-card-header">
                  <h2>Upload Document</h2>
                  <p>Supports scanned PDFs, PNG, and JPG images</p>
                </div>
                <FileUploader onUpload={handleUpload} disabled={false} />
              </div>

              <div className="feature-grid">
                {[
                  { icon: "⚡", title: "Async Pipeline", desc: "Multi-page PDFs processed in parallel with asyncio" },
                  { icon: "🧠", title: "BERT NER", desc: "dslim/bert-base-NER extracts named entities with confidence scores" },
                  { icon: "📄", title: "Tesseract OCR", desc: "Handles scanned, image-only PDFs with no text layer" },
                  { icon: "🎯", title: "93% Accuracy", desc: "Mean confidence score across all extracted entities" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="feature-card">
                    <span className="feature-icon">{icon}</span>
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === STATES.UPLOADING && (
            <div className="center-card">
              <div className="uploading-spinner" />
              <p>Uploading document...</p>
            </div>
          )}

          {phase === STATES.PROCESSING && (
            <div className="processing-card">
              <ProgressBar jobId={jobId} onComplete={handleComplete} />
            </div>
          )}

          {phase === STATES.RESULTS && result && (
            <ResultsPanel result={result} onReset={handleReset} />
          )}

          {phase === STATES.ERROR && (
            <div className="error-card">
              <div className="error-icon">⚠</div>
              <h3>Extraction Failed</h3>
              <p>{errorMsg}</p>
              <button className="retry-btn" onClick={handleReset}>Try Again</button>
            </div>
          )}
        </main>

        <footer className="app-footer">
          <span>DocuMind AI · FastAPI + PyMuPDF + Tesseract OCR + Hugging Face BERT</span>
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0f172a;
          color: #e2e8f0;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          min-height: 100vh;
        }

        .app-root {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient background */
        .bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.12;
          pointer-events: none;
          z-index: 0;
        }
        .glow-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #0ea5e9, transparent);
          top: -200px; left: -200px;
        }
        .glow-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #6366f1, transparent);
          bottom: -150px; right: -150px;
        }
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .app-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 48px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          min-height: 100vh;
        }

        /* Header */
        .app-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .logo-mark { flex-shrink: 0; }
        .header-text { flex: 1; }
        .app-title {
          font-size: 1.7rem;
          font-weight: 800;
          background: linear-gradient(135deg, #e2e8f0 30%, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        .app-sub {
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 3px;
        }
        .header-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          color: #64748b;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px;
          padding: 6px 14px;
        }
        .badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34d399;
          animation: blink 2s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Main */
        .app-main { flex: 1; }

        .idle-layout { display: flex; flex-direction: column; gap: 32px; }

        .upload-card {
          background: rgba(30,41,59,0.5);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 36px 40px;
          backdrop-filter: blur(8px);
        }
        .upload-card-header { margin-bottom: 28px; }
        .upload-card-header h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 6px;
        }
        .upload-card-header p { font-size: 0.85rem; color: #64748b; }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .feature-card {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color 0.2s;
        }
        .feature-card:hover { border-color: rgba(56,189,248,0.2); }
        .feature-icon { font-size: 1.4rem; }
        .feature-card strong { font-size: 0.88rem; color: #cbd5e1; }
        .feature-card p { font-size: 0.78rem; color: #64748b; line-height: 1.5; }

        .center-card, .processing-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 60px 40px;
        }
        .processing-card { padding: 20px 0; align-items: stretch; }

        .uploading-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(56,189,248,0.2);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 40px;
          text-align: center;
          max-width: 480px;
          margin: 0 auto;
        }
        .error-icon { font-size: 2.5rem; }
        .error-card h3 { font-size: 1.1rem; color: #f87171; }
        .error-card p { font-size: 0.85rem; color: #94a3b8; line-height: 1.6; }
        .retry-btn {
          padding: 10px 24px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 9px;
          color: #f87171;
          font-size: 0.88rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .retry-btn:hover { background: rgba(239,68,68,0.2); }

        /* Footer */
        .app-footer {
          text-align: center;
          color: #334155;
          font-size: 0.75rem;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
      `}</style>
    </div>
  );
}
