import asyncio
import os
import shutil
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models import ExtractionResult, EntityEntry
from ner_pipeline import extract_entities, load_ner_pipeline
from ocr_engine import extract_text_from_images
from pdf_parser import parse_document

# ─── In-memory job store ────────────────────────────────────────────────────
jobs: Dict[str, ExtractionResult] = {}


# ─── Lifespan: preload model on startup ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, load_ner_pipeline)
    yield


# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DocuMind AI",
    description="Intelligent Document Extraction System — OCR + BERT NER",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Background processing pipeline ─────────────────────────────────────────
async def process_document(job_id: str, file_path: str, content_type: str):
    """Full async pipeline: PDF → OCR → NER → store result."""
    start_ms = int(time.time() * 1000)

    try:
        # Step 1: Parse PDF/image to page images
        image_paths, page_count = await parse_document(file_path, content_type)

        # Step 2: OCR all pages in parallel
        raw_text, _ = await extract_text_from_images(image_paths)

        # Step 3: BERT NER extraction
        entities_raw, accuracy_score = await extract_entities(raw_text)

        # Convert to Pydantic models
        entities = {
            label: [EntityEntry(word=e["word"], score=e["score"]) for e in ents]
            for label, ents in entities_raw.items()
        }

        elapsed_ms = int(time.time() * 1000) - start_ms

        jobs[job_id] = ExtractionResult(
            job_id=job_id,
            status="done",
            page_count=page_count,
            raw_text=raw_text,
            entities=entities,
            accuracy_score=accuracy_score,
            processing_time_ms=elapsed_ms,
        )

    except Exception as e:
        elapsed_ms = int(time.time() * 1000) - start_ms
        jobs[job_id] = ExtractionResult(
            job_id=job_id,
            status="error",
            error_message=str(e),
            processing_time_ms=elapsed_ms,
        )
        print(f"[ERROR] Job {job_id} failed: {e}")

    finally:
        # Cleanup uploaded file
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception:
            pass


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Accept a PDF or image upload. Returns a job_id immediately.
    Processing runs in the background.
    """
    allowed_types = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/tiff",
    }

    content_type = file.content_type or ""
    filename = file.filename or ""

    # Fallback content-type detection from extension
    if content_type not in allowed_types:
        ext = os.path.splitext(filename)[1].lower()
        ext_map = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".tiff": "image/tiff",
            ".tif": "image/tiff",
        }
        content_type = ext_map.get(ext, content_type)

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Use PDF, PNG, or JPG.",
        )

    # Save upload to temp file
    suffix = os.path.splitext(filename)[1] or ".pdf"
    tmp_file = tempfile.NamedTemporaryFile(
        delete=False, suffix=suffix, prefix="documind_upload_"
    )
    try:
        contents = await file.read()
        tmp_file.write(contents)
        tmp_file.flush()
        tmp_file.close()
    except Exception as e:
        tmp_file.close()
        os.unlink(tmp_file.name)
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {e}")

    # Create job
    job_id = str(uuid.uuid4())
    jobs[job_id] = ExtractionResult(job_id=job_id, status="processing")

    # Start background processing
    background_tasks.add_task(process_document, job_id, tmp_file.name, content_type)

    return {"job_id": job_id, "status": "processing"}


@app.get("/result/{job_id}", response_model=ExtractionResult)
async def get_result(job_id: str):
    """Poll for extraction result by job_id."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return jobs[job_id]


@app.get("/health")
async def health():
    return {"status": "ok", "active_jobs": len(jobs)}
