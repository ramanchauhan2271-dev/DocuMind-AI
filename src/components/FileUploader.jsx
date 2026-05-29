import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileUploader({ onUpload, disabled }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragError, setDragError] = useState("");

  const onDrop = useCallback((accepted, rejected) => {
    setDragError("");
    if (rejected.length > 0) {
      setDragError("Invalid file type. Please upload a PDF, PNG, or JPG.");
      return;
    }
    if (accepted.length > 0) {
      setSelectedFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    disabled,
  });

  const handleExtract = () => {
    if (selectedFile) onUpload(selectedFile);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setDragError("");
  };

  return (
    <div className="uploader-wrapper">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "drag-active" : ""} ${disabled ? "disabled" : ""} ${selectedFile ? "has-file" : ""}`}
      >
        <input {...getInputProps()} />

        {!selectedFile ? (
          <div className="drop-content">
            <div className="drop-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="6" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
                <rect x="4" y="10" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
                <path d="M16 28l6-6 6 6M22 22v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="drop-title">
              {isDragActive ? "Release to upload" : "Drop your document here"}
            </p>
            <p className="drop-sub">PDF, PNG, JPG · or click to browse</p>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-icon">
              {selectedFile.type === "application/pdf" ? (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="2" width="18" height="24" rx="2" fill="#ef4444" opacity="0.8"/>
                  <rect x="6" y="4" width="14" height="20" rx="1" fill="#fca5a5" opacity="0.3"/>
                  <text x="8" y="18" fontSize="7" fill="white" fontWeight="bold">PDF</text>
                  <path d="M22 2l6 6v22H10" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.4"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="2" y="2" width="28" height="28" rx="3" fill="#38bdf8" opacity="0.3"/>
                  <circle cx="10" cy="10" r="3" fill="#38bdf8" opacity="0.7"/>
                  <path d="M2 22l8-8 6 6 4-4 10 10" stroke="#38bdf8" strokeWidth="2" fill="none"/>
                </svg>
              )}
            </div>
            <div className="file-info">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatBytes(selectedFile.size)}</span>
            </div>
            <button className="clear-btn" onClick={handleClear} title="Remove file">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {dragError && <p className="drag-error">{dragError}</p>}

      <button
        className="extract-btn"
        onClick={handleExtract}
        disabled={!selectedFile || disabled}
      >
        <span>Extract Now</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3v12M3 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <style>{`
        .uploader-wrapper { display: flex; flex-direction: column; gap: 16px; width: 100%; }

        .dropzone {
          border: 2px dashed rgba(56,189,248,0.35);
          border-radius: 16px;
          padding: 48px 32px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(56,189,248,0.03);
          text-align: center;
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dropzone:hover:not(.disabled) {
          border-color: rgba(56,189,248,0.7);
          background: rgba(56,189,248,0.07);
        }
        .dropzone.drag-active {
          border-color: #38bdf8;
          background: rgba(56,189,248,0.12);
          transform: scale(1.01);
        }
        .dropzone.has-file {
          border-style: solid;
          border-color: rgba(56,189,248,0.5);
          padding: 24px 32px;
          min-height: auto;
        }
        .dropzone.disabled { opacity: 0.5; cursor: not-allowed; }

        .drop-content { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #94a3b8; }
        .drop-icon { color: #38bdf8; opacity: 0.7; }
        .drop-title { font-size: 1rem; font-weight: 600; color: #cbd5e1; margin: 0; }
        .drop-sub { font-size: 0.8rem; margin: 0; }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          text-align: left;
        }
        .file-icon { flex-shrink: 0; }
        .file-info { flex: 1; min-width: 0; }
        .file-name { display: block; color: #e2e8f0; font-weight: 500; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-size { display: block; color: #64748b; font-size: 0.78rem; margin-top: 2px; }
        .clear-btn {
          flex-shrink: 0;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          color: #f87171;
          padding: 6px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
        }
        .clear-btn:hover { background: rgba(239,68,68,0.2); }

        .drag-error { color: #f87171; font-size: 0.82rem; margin: 0; padding-left: 4px; }

        .extract-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #0ea5e9, #38bdf8);
          border: none;
          border-radius: 12px;
          color: #0f172a;
          font-weight: 700;
          font-size: 0.95rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }
        .extract-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(56,189,248,0.35);
        }
        .extract-btn:active:not(:disabled) { transform: translateY(0); }
        .extract-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}
